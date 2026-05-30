export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const rawSession = getCookie(event, 'auth-session')
  const session = rawSession ? JSON.parse(rawSession) as { nif: string } : null
  if (!session?.nif) {
    throw createError({ statusCode: 401, statusMessage: 'Não autenticado.' })
  }
  return await authBackendFetch(event, `${config.backendBase}/entities/${session.nif}`, {
    method: 'DELETE'
  })
})
