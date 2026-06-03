export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const nif_nipc = getRouterParam(event, 'nif_nipc')
  const query = getQuery(event)
  const limit = Math.min(Math.max(1, parseInt(String(query.limit)) || 25), 200)
  const offset = Math.max(0, parseInt(String(query.offset)) || 0)

  return await authBackendFetch(event, `${config.backendBase}/patrons/${nif_nipc}/donations?limit=${limit}&offset=${offset}`)
})
