export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  return authBackendFetch(event, `${config.backendBase}/api-tokens`)
})
