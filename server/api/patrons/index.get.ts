interface FlatPatron {
  nif_nipc: string
  nome_entidade: string
  email_login: string
  iban: string
  locations: unknown[]
  contacts: unknown[]
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)
  const limit = Math.min(Math.max(1, parseInt(String(query.limit)) || 25), 500)
  const offset = Math.max(0, parseInt(String(query.offset)) || 0)
  const q = typeof query.q === 'string' ? query.q.trim() : ''
  const qs = q ? `&q=${encodeURIComponent(q)}` : ''

  const res = await authBackendFetch<{ items: FlatPatron[], total: number }>(event, `${config.backendBase}/patrons?limit=${limit}&offset=${offset}${qs}`)

  const items = (res.items ?? []).map(p => ({
    resource: { nif_nipc: p.nif_nipc },
    entity: { nif_nipc: p.nif_nipc, nome_entidade: p.nome_entidade, email_login: p.email_login, iban: p.iban },
    locations: p.locations ?? [],
    contacts: p.contacts ?? []
  }))

  const total = res.total ?? 0
  const lastOffset = total > 0 ? Math.max(0, (Math.ceil(total / limit) - 1) * limit) : 0
  const links: Record<string, string> = {
    self: `/api/patrons?limit=${limit}&offset=${offset}`,
    first: `/api/patrons?limit=${limit}&offset=0`,
    last: `/api/patrons?limit=${limit}&offset=${lastOffset}`
  }
  if (offset + limit < total) links.next = `/api/patrons?limit=${limit}&offset=${offset + limit}`
  if (offset > 0) links.prev = `/api/patrons?limit=${limit}&offset=${Math.max(0, offset - limit)}`

  return { items, total, limit, offset, links }
})
