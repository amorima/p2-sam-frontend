export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  return await authBackendFetch(event, `${config.backendBase}/goods-services`, {
    method: 'POST',
    body
  })
})
