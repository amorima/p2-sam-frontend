import type { H3Event } from 'h3'

interface StoredSession {
  role: string
  nif: string
  name: string
  accessToken?: string
  refreshToken?: string
}

function readSession(event: H3Event): StoredSession | null {
  try {
    const raw = getCookie(event, 'auth-session')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

type HttpMethod = 'GET' | 'HEAD' | 'PATCH' | 'POST' | 'PUT' | 'DELETE' | 'CONNECT' | 'OPTIONS' | 'TRACE'
  | 'get' | 'head' | 'patch' | 'post' | 'put' | 'delete' | 'connect' | 'options' | 'trace'

interface FetchErrorLike {
  response?: { status?: number }
  statusCode?: number
  data?: { description?: string, message?: string, error?: string }
  message?: string
}

export async function authBackendFetch<T = unknown>(
  event: H3Event,
  url: string,
  options: { method?: string, body?: unknown } = {}
): Promise<T> {
  const config = useRuntimeConfig()
  const session = readSession(event)

  const doFetch = (token?: string) => $fetch<T>(url, {
    method: options.method as HttpMethod | undefined,
    body: options.body as Record<string, unknown>,
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  }) as Promise<T>

  try {
    return await doFetch(session?.accessToken)
  } catch (err: unknown) {
    const e = err as FetchErrorLike
    const status = e?.response?.status ?? e?.statusCode

    if (status === 401 && session?.refreshToken) {
      try {
        const refreshed = await $fetch<{ accessToken: string, refreshToken: string }>(
          `${config.backendBase}/auth/refresh`,
          { method: 'POST', body: { refreshToken: session.refreshToken } }
        )

        const newSession: StoredSession = {
          ...session,
          accessToken: refreshed.accessToken,
          refreshToken: refreshed.refreshToken
        }
        setCookie(event, 'auth-session', JSON.stringify(newSession), {
          maxAge: 60 * 60 * 24 * 7,
          sameSite: 'lax',
          path: '/'
        })

        return await doFetch(refreshed.accessToken)
      } catch {
        throw createError({ statusCode: 401, statusMessage: 'Sessão expirada. Inicie sessão novamente.' })
      }
    }

    const message = e?.data?.description ?? e?.data?.message ?? e?.data?.error ?? e?.message ?? 'Erro inesperado'
    console.error(`[backendFetch] ${status ?? 'NET_ERR'} ${url}:`, JSON.stringify(e?.data ?? e?.message))
    throw createError({ statusCode: status ?? 500, statusMessage: message })
  }
}
