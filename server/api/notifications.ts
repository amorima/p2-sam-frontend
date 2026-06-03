export default defineEventHandler(async () => {
  const config = useRuntimeConfig()
  try {
    const res = await internalFetch<{ items: unknown[] }>(`${config.backendBase}/notifications?limit=100`)
    return res.items ?? []
  } catch {
    return []
  }
})
