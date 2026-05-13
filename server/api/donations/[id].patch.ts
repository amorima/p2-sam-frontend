export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  return await $fetch(`${config.backendBase}/donations/${id}`, {
    method: 'PATCH',
    body
  })
})
