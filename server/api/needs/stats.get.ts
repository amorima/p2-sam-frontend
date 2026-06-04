interface NeedsStats {
  total: number
  pendentes: number
  aceites: number
  urgentes: number
}

export default defineEventHandler(async (): Promise<NeedsStats> => {
  const config = useRuntimeConfig()
  try {
    return await internalFetch<NeedsStats>(`${config.backendBase}/needs/stats`)
  } catch {
    return { total: 0, pendentes: 0, aceites: 0, urgentes: 0 }
  }
})
