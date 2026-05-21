export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)
  return $fetch(`${config.backendBase}/leads`, {
    method: 'POST',
    body
  })
})
