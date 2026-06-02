export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)
  try {
    return await internalFetch(`${config.backendBase}/telemetry`, { method: 'POST', body })
  } catch {
    return null
  }
})
