interface BackendNeedItem {
  id_item?: number
  id_pedido: number
  tipo_bem_servico: string
}

interface BackendNeed {
  'id_pedido': number
  'nif_nipc': string
  'createdAt': string | null
  'estado': string | null
  'urgente': boolean | number
  'need items'?: BackendNeedItem[]
  'NeedItems'?: BackendNeedItem[]
  'needItems'?: BackendNeedItem[]
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

export default defineEventHandler(async () => {
  const config = useRuntimeConfig()

  const [needsRes, institutionsRes] = await Promise.all([
    $fetch<{ needs: BackendNeed[] }>(`${config.backendBase}/needs`),
    $fetch<{ data: Array<{ nif_nipc: string, nome_entidade: string }> }>(`${config.backendBase}/institutions`)
  ])

  const nameMap = new Map(
    (institutionsRes.data ?? []).map(i => [i.nif_nipc, i.nome_entidade])
  )

  let itemCounter = 0
  const today = new Date().toISOString()

  const needs = (needsRes.needs ?? []).map((need) => {
    // Sequelize names the hasMany association key using the model name "need item" → "need items"
    const rawItems: BackendNeedItem[] = need['need items'] ?? need.NeedItems ?? need.needItems ?? []

    const items = rawItems.map(item => ({
      id_item: item.id_item ?? ++itemCounter,
      id_pedido: item.id_pedido,
      tipo_bem_servico: item.tipo_bem_servico,
      tipo_bem: inferTipoBem(item.tipo_bem_servico),
      status: 'available' as const,
      match_tipo: null,
      match_ref: null,
      match_business_nif: null,
      match_business_estado: null,
      match_business_motivo: null
    }))

    return {
      id_pedido: need.id_pedido,
      nif_nipc: need.nif_nipc,
      nome_entidade: nameMap.get(need.nif_nipc) ?? need.nif_nipc,
      data: need.createdAt ?? today,
      estado: need.estado ?? 'PENDENTE',
      urgente: Boolean(need.urgente),
      items
    }
  })

  return { needs }
})
