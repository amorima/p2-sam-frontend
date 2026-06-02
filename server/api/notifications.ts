export default defineEventHandler(async () => {
  const config = useRuntimeConfig()
  try {
    return await internalFetch(`${config.backendBase}/notifications`)
  } catch {
    return []
  }
})
