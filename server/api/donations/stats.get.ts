interface DonationStats {
  total: number
  totalAceite: number
  aceites: number
  pendentes: number
  rejeitadas: number
}

// Aggregate donation totals for the dashboard cards, independent of the
// current page and honouring the same search term (?q=).
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)
  const q = typeof query.q === 'string' ? query.q.trim() : ''
  const qs = q ? `?q=${encodeURIComponent(q)}` : ''

  return await authBackendFetch<DonationStats>(event, `${config.backendBase}/donations/stats${qs}`)
})
