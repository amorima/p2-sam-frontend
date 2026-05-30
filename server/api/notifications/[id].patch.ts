export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const id = getRouterParam(event, 'id')
  return await authBackendFetch(event, `${config.backendBase}/notifications/${id}/read`, { method: 'PATCH' })
})
