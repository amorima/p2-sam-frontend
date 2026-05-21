export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const nif_nipc = getRouterParam(event, 'nif_nipc')
  const body = await readBody(event)

  return await authBackendFetch(event, `${config.backendBase}/patrons/${nif_nipc}`, {
    method: 'PATCH',
    body
  })
})
