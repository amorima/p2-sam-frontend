export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const nif = getRouterParam(event, 'nif')

  return await authBackendFetch(event, `${config.backendBase}/business/${nif}`, {
    method: 'DELETE'
  })
})
