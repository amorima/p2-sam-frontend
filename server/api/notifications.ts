export default defineEventHandler(async () => {
  const config = useRuntimeConfig()
  try {
    return await $fetch(`${config.backendBase}/notifications`)
  } catch {
    return []
  }
})
