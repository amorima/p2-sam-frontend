export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const nif = getRouterParam(event, 'nif')
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  return await authBackendFetch(event, `${config.backendBase}/business/${nif}/offers/${id}`, {
    method: 'PATCH',
    body
  })
})
