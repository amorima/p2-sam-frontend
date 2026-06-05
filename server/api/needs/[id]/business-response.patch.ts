export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  return await authBackendFetch(event, `${config.backendBase}/needs/${id}/business-response`, {
    method: 'PATCH',
    body
  })
})
