export default defineEventHandler(async () => {
  const config = useRuntimeConfig()

  const leads = await $fetch<any[]>(`${config.backendBase}/leads`)

  return (leads ?? []).map((lead: any) => ({
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
