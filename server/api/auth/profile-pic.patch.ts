export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)
  return await authBackendFetch(event, `${config.backendBase}/auth/profile-pic`, {
    method: 'PATCH',
    body
  })
})
