export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const nif = getRouterParam(event, 'nif')
  const body = await readBody(event)

  return await authBackendFetch(event, `${config.backendBase}/business/${nif}`, {
    method: 'PATCH',
    body
  })
})
