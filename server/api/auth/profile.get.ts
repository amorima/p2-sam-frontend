export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  return await authBackendFetch(event, `${config.backendBase}/users/profile`, {
    method: 'GET'
  })
})
