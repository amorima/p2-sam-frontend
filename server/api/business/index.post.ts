export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  return await authBackendFetch(event, `${config.backendBase}/business`, {
    method: 'POST',
    body
  })
})
