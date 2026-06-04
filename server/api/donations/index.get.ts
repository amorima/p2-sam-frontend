interface Donation {
  id_doacao: number
  mecena_nif_nipc: string
  data: string
  valor_transacao: number
  tipo_donativo: 'ESPECIE' | 'NUMERARIO'
  anonimo: boolean
  url_comprovativo: string
  estado: 'ACEITE' | 'REJEITADO' | 'PENDENTE'
}

interface FlatPatron {
  nif_nipc: string
  nome_entidade: string
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)
  const limit = Math.min(Math.max(1, parseInt(String(query.limit)) || 25), 200)
  const offset = Math.max(0, parseInt(String(query.offset)) || 0)
  const q = typeof query.q === 'string' ? query.q.trim() : ''
  const qs = q ? `&q=${encodeURIComponent(q)}` : ''

  const [donationsRes, patronsRes] = await Promise.all([
    authBackendFetch<{ items: Donation[], total: number, limit: number, offset: number }>(event, `${config.backendBase}/donations?limit=${limit}&offset=${offset}${qs}`),
    authBackendFetch<{ items: FlatPatron[] }>(event, `${config.backendBase}/patrons?limit=500`)
  ])

  const nameMap = new Map(
    (patronsRes.items ?? []).map(p => [p.nif_nipc, p.nome_entidade])
  )

  const items = (donationsRes.items ?? []).map(d => ({
    ...d,
    nome_entidade: nameMap.get(d.mecena_nif_nipc) ?? d.mecena_nif_nipc
  }))

  const total = donationsRes.total ?? 0
  const lastOffset = total > 0 ? Math.max(0, (Math.ceil(total / limit) - 1) * limit) : 0
  const links: Record<string, string> = {
    self: `/api/donations?limit=${limit}&offset=${offset}`,
    first: `/api/donations?limit=${limit}&offset=0`,
    last: `/api/donations?limit=${limit}&offset=${lastOffset}`
  }
  if (offset + limit < total) links.next = `/api/donations?limit=${limit}&offset=${offset + limit}`
  if (offset > 0) links.prev = `/api/donations?limit=${limit}&offset=${Math.max(0, offset - limit)}`

  return { items, total, limit, offset, links }
})
