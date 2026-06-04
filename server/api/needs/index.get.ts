interface BackendNeedItem {
  id_item?: number
  id_pedido: number
  tipo_bem_servico: string
}

interface BackendNeed {
  'id_pedido': number
  'nif_nipc': string
  'data': string | null
  'estado': string | null
  'urgente': boolean | number
  'need items'?: BackendNeedItem[]
  'NeedItems'?: BackendNeedItem[]
  'needItems'?: BackendNeedItem[]
}

interface BackendLead {
  id_item: number | null
  estado: string | null
}

// Known service-type keywords to infer tipo_bem when not available from backend
const SERVICE_KEYWORDS = ['apoio', 'consulta', 'transporte', 'aulas', 'jurídico', 'psicológico', 'médic', 'explicação', 'serviço']

function inferTipoBem(tipo: string): 'BEM' | 'SERVICO' {
  const lower = tipo.toLowerCase()
  for (const kw of SERVICE_KEYWORDS) {
    if (lower.includes(kw)) return 'SERVICO'
  }
  return 'BEM'
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)
  const limit = Math.min(Math.max(1, parseInt(String(query.limit)) || 25), 200)
  const offset = Math.max(0, parseInt(String(query.offset)) || 0)
  const q = typeof query.q === 'string' ? query.q.trim() : ''
  const qs = q ? `&q=${encodeURIComponent(q)}` : ''

  const [needsRes, institutionsRes, leadsRes] = await Promise.all([
    internalFetch<{ items: BackendNeed[], total: number, limit: number, offset: number }>(`${config.backendBase}/needs?limit=${limit}&offset=${offset}${qs}`),
    internalFetch<{ items: Array<{ nif_nipc: string, nome_entidade: string }> }>(`${config.backendBase}/institutions?limit=500`),
    internalFetch<{ items: BackendLead[] }>(`${config.backendBase}/leads?limit=1000`).catch(() => ({ items: [] as BackendLead[] }))
  ])

  const nameMap = new Map(
    (institutionsRes.items ?? []).map(i => [i.nif_nipc, i.nome_entidade])
  )

  // Map each item to its lead status so the admin sees which items are claimed
  const itemLeadStatus = new Map<number, 'pending' | 'completed'>()
  for (const lead of (leadsRes.items ?? [])) {
    if (lead.id_item == null) continue
    if (lead.estado === 'ENTREGUE') {
      itemLeadStatus.set(lead.id_item, 'completed')
    } else if (lead.estado === 'PENDENTE' && !itemLeadStatus.has(lead.id_item)) {
      itemLeadStatus.set(lead.id_item, 'pending')
    }
  }

  let itemCounter = 0

  const items = (needsRes.items ?? []).map((need) => {
    // Sequelize names the hasMany association key using the model name "need item" → "need items"
    const rawItems: BackendNeedItem[] = need['need items'] ?? need.NeedItems ?? need.needItems ?? []

    const mappedItems = rawItems.map(item => ({
      id_item: item.id_item ?? ++itemCounter,
      id_pedido: item.id_pedido,
      tipo_bem_servico: item.tipo_bem_servico,
      tipo_bem: inferTipoBem(item.tipo_bem_servico),
      status: (itemLeadStatus.get(item.id_item ?? 0) ?? 'available') as 'available' | 'pending' | 'completed',
      match_tipo: itemLeadStatus.has(item.id_item ?? 0) ? ('PAINEL' as const) : null,
      match_ref: null,
      match_business_nif: null,
      match_business_estado: null,
      match_business_motivo: null
    }))

    return {
      id_pedido: need.id_pedido,
      nif_nipc: need.nif_nipc,
      nome_entidade: nameMap.get(need.nif_nipc) ?? need.nif_nipc,
      data: need.data ?? new Date().toISOString(),
      estado: need.estado ?? 'PENDENTE',
      urgente: Boolean(need.urgente),
      items: mappedItems
    }
  })

  const total = needsRes.total ?? 0
  const lastOffset = total > 0 ? Math.max(0, (Math.ceil(total / limit) - 1) * limit) : 0
  const links: Record<string, string> = {
    self: `/api/needs?limit=${limit}&offset=${offset}`,
    first: `/api/needs?limit=${limit}&offset=0`,
    last: `/api/needs?limit=${limit}&offset=${lastOffset}`
  }
  if (offset + limit < total) links.next = `/api/needs?limit=${limit}&offset=${offset + limit}`
  if (offset > 0) links.prev = `/api/needs?limit=${limit}&offset=${Math.max(0, offset - limit)}`

  return { items, total, limit, offset, links }
})
