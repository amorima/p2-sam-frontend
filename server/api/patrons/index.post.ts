export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  return await $fetch(`${config.backendBase}/patrons`, {
    method: 'POST',
    body
  })
})
