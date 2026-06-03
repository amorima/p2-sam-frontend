interface BackendLead {
  'id_lead': number
  'data': string | null
  'id_painel': number | null
  'panel'?: { id_dispositivo: number }
  'nome_cidadao': string | null
  'contacto_cidadao': string | null
  'id_pedido': number | null
  'id_item': number | null
  'need item'?: { id_item: number, id_pedido: number, tipo_bem_servico: string, publico: number | null }
  'item_pedido': string | null
  'estado': string | null
  'pin_entrega': string | null
  'id_locker': number | null
  'locker'?: { id_locker: number }
  'porta': number | null
  'data_entrega': string | null
  'nome_entidade': string | null
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)
  const limit = Math.min(Math.max(1, parseInt(String(query.limit)) || 25), 200)
  const offset = Math.max(0, parseInt(String(query.offset)) || 0)

  let backendRes: { items: BackendLead[], total: number, limit: number, offset: number }
  try {
    backendRes = await internalFetch<typeof backendRes>(`${config.backendBase}/leads?limit=${limit}&offset=${offset}`)
  } catch (err: unknown) {
    console.error('[leads] Backend error:', (err as { message?: string })?.message)
    return { items: [], total: 0, limit, offset, links: {} }
  }

  const items = (backendRes.items ?? []).map(lead => ({
    id_lead: lead.id_lead,
    data: lead.data ?? new Date().toISOString(),
    id_painel: lead.id_painel,
    painel_nome: lead.panel
      ? `Painel #${lead.panel.id_dispositivo}`
      : undefined,
    nome_cidadao: lead.nome_cidadao ?? '',
    contacto_cidadao: lead.contacto_cidadao ?? '',
    id_pedido: lead.id_pedido,
    id_item: lead.id_item ?? 0,
    item_pedido: lead.item_pedido ?? '',
    estado: lead.estado ?? 'PENDENTE',
    pin_entrega: lead.pin_entrega ?? '',
    id_locker: lead.id_locker ?? null,
    locker_nome: lead.locker
      ? `Locker #${lead.locker.id_locker}`
      : undefined,
    porta: lead.porta ?? null,
    data_entrega: lead.data_entrega ?? null,
    nome_entidade: lead.nome_entidade ?? undefined
  }))

  const total = backendRes.total ?? 0
  const lastOffset = total > 0 ? Math.max(0, (Math.ceil(total / limit) - 1) * limit) : 0
  const links: Record<string, string> = {
    self: `/api/leads?limit=${limit}&offset=${offset}`,
    first: `/api/leads?limit=${limit}&offset=0`,
    last: `/api/leads?limit=${limit}&offset=${lastOffset}`
  }
  if (offset + limit < total) links.next = `/api/leads?limit=${limit}&offset=${offset + limit}`
  if (offset > 0) links.prev = `/api/leads?limit=${limit}&offset=${Math.max(0, offset - limit)}`

  return { items, total, limit, offset, links }
})
