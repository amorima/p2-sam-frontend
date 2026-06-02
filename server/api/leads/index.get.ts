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

export default defineEventHandler(async () => {
  const config = useRuntimeConfig()

  let leads: BackendLead[] = []
  try {
    leads = await internalFetch<BackendLead[]>(`${config.backendBase}/leads`) ?? []
  } catch (err: unknown) {
    console.error('[leads] Backend error:', (err as { message?: string })?.message)
    return []
  }

  return leads.map(lead => ({
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
})
