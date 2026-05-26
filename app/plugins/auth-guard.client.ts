import type { $Fetch } from 'ofetch'
import type { AuthSession } from '~/composables/useAuth'

export default defineNuxtPlugin(() => {
  const session = useCookie<AuthSession | null>('auth-session')
  let isRedirecting = false

  const handle401 = () => {
    if (isRedirecting) return
    isRedirecting = true

    session.value = null
    try {
      localStorage.removeItem('auth-session')
    } catch { /* ignore */ }

    const current = window.location.pathname
    if (current === '/login' || current === '/register') {
      isRedirecting = false
      return
    }

    const target = `/login?redirect=${encodeURIComponent(current + window.location.search)}`
    Promise.resolve(navigateTo(target, { replace: true })).finally(() => {
      isRedirecting = false
    })
  }

  // Patch the existing global $fetch instead of replacing it, so all hooks
  // (existing + ours) co-exist and we don't lose the create/raw helpers.
  const fetcher = globalThis.$fetch as $Fetch | undefined
  if (!fetcher || typeof fetcher !== 'function') return

  const original = fetcher
  const wrapped = ((input: Parameters<$Fetch>[0], opts?: Parameters<$Fetch>[1]) =>
    original(input, opts).catch((err: unknown) => {
      const e = err as { response?: { status?: number }, status?: number }
      const status = e?.response?.status ?? e?.status
      if (status === 401) handle401()
      throw err
    })) as unknown as $Fetch

  // Preserve helpers (raw, create, native) so Nuxt internals keep working.
  Object.assign(wrapped, original)
  ;(globalThis as unknown as { $fetch: $Fetch }).$fetch = wrapped
})
