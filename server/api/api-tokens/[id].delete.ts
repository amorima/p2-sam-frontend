export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID em falta' })
  const config = useRuntimeConfig()
  await authBackendFetch(event, `${config.backendBase}/api-tokens/${id}`, { method: 'DELETE' })
  setResponseStatus(event, 204)
  return null
})
