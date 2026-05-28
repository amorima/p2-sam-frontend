import type { AuthSession } from '~/composables/useAuth'

export default defineNuxtRouteMiddleware(() => {
  const session = useCookie<AuthSession | null>('auth-session')
  if (session.value?.role !== 'admin') {
    return navigateTo('/login')
  }
})
