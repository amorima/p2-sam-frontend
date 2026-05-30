export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  return await authBackendFetch(event, `${config.backendBase}/notifications/me/read-all`, { method: 'DELETE' })
})
