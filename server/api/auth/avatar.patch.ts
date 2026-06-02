import type { H3Event } from 'h3'

interface StoredSession {
  role: string
  nif: string
  name: string
  accessToken?: string
  refreshToken?: string
  profile_pic?: string | null
}

interface AvatarResponse {
  success: boolean
  profile_pic: string
  fileName: string
  url: string
  bucket: string
}

function readSession(event: H3Event): StoredSession | null {
  try {
    const raw = getCookie(event, 'auth-session')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export default defineEventHandler(async (event): Promise<AvatarResponse> => {
  const config = useRuntimeConfig()

  const contentType = getRequestHeader(event, 'content-type') ?? ''
  if (!contentType.includes('multipart/form-data')) {
    throw createError({ statusCode: 400, statusMessage: 'Esperado multipart/form-data.' })
  }

  const rawBody = await readRawBody(event, false)
  if (!rawBody) {
    throw createError({ statusCode: 400, statusMessage: 'Corpo da requisição vazio.' })
  }

  const session = readSession(event)

  const callBackend = async (token?: string) => {
    const response = await fetch(`${config.backendBase}/users/avatar`, {
      method: 'PATCH',
      body: rawBody as unknown as ArrayBuffer,
      headers: {
        'content-type': contentType,
        ...(token ? { authorization: `Bearer ${token}` } : {})
      }
    })
    return response
  }

  let response = await callBackend(session?.accessToken)

  if (response.status === 401 && session?.refreshToken) {
    try {
      const refreshed = await $fetch<{ accessToken: string, refreshToken: string }>(
        `${config.backendBase}/users/refresh`,
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

      response = await callBackend(refreshed.accessToken)
    } catch {
      throw createError({ statusCode: 401, statusMessage: 'Sessão expirada. Inicie sessão novamente.' })
    }
  }

  if (!response.ok) {
    const text = await response.text()
    throw createError({ statusCode: response.status, statusMessage: text || 'Falha ao atualizar avatar.' })
  }

  const data = await response.json() as AvatarResponse

  if (session) {
    const updatedSession: StoredSession = { ...session, profile_pic: data.profile_pic }
    setCookie(event, 'auth-session', JSON.stringify(updatedSession), {
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax',
      path: '/'
    })
  }

  return data
})
