export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)
  const { nif_nipc, ...rest } = body

  return await authBackendFetch(event, `${config.backendBase}/institutions/${nif_nipc}/needs`, {
    method: 'POST',
    body: rest
  })
})
