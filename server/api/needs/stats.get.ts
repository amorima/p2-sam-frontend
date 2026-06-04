interface NeedsStats {
  total: number
  pendentes: number
  aceites: number
  urgentes: number
}

export default defineEventHandler(async (event): Promise<NeedsStats> => {
  const config = useRuntimeConfig()
  const query = getQuery(event)
  const q = typeof query.q === 'string' ? query.q.trim() : ''
  const qs = q ? `?q=${encodeURIComponent(q)}` : ''
  try {
    return await internalFetch<NeedsStats>(`${config.backendBase}/needs/stats${qs}`)
  } catch {
    return { total: 0, pendentes: 0, aceites: 0, urgentes: 0 }
  }
})
