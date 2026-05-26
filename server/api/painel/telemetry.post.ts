export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)
  try {
    return await $fetch(`${config.backendBase}/telemetry`, {
      method: 'POST',
      body,
      timeout: 5000
    })
  } catch {
    return null
  }
})
