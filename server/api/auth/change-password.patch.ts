export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody<{ currentPassword: string, newPassword: string }>(event)
  return await authBackendFetch(event, `${config.backendBase}/auth/change-password`, {
    method: 'PATCH',
    body
  })
})
