export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  return await authBackendFetch(event, `${config.backendBase}/donations/${id}`, {
    method: 'PATCH',
    body
  })
})
