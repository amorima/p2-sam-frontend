export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const nif = getRouterParam(event, 'nif')
  const id = getRouterParam(event, 'id')

  return await authBackendFetch(event, `${config.backendBase}/business/${nif}/offers/${id}`, {
    method: 'DELETE'
  })
})
