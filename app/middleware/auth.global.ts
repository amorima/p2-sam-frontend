import type { AuthSession } from '~/composables/useAuth'

const PUBLIC_ROUTES = ['/login', '/register']

export default defineNuxtRouteMiddleware((to) => {
  if (PUBLIC_ROUTES.includes(to.path)) return

  const session = useCookie<AuthSession | null>('auth-session')
  if (!session.value) {
    return navigateTo('/login')
  }
})
