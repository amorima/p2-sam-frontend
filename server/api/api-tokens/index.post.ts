export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const config = useRuntimeConfig()
  return authBackendFetch(event, `${config.backendBase}/api-tokens`, { method: 'POST', body })
})
