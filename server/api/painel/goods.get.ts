interface FlatInstitution {
  nif_nipc: string
  nome_entidade: string
}

interface BackendNeedItem {
  id_item: number
  id_pedido: number
  tipo_bem_servico: string
}

interface BackendNeed {
  'id_pedido': number
  'nif_nipc': string
  'estado'?: string | null
  'need items'?: BackendNeedItem[]
  'NeedItems'?: BackendNeedItem[]
  'needItems'?: BackendNeedItem[]
}

interface BackendLead {
  id_item: number | null
  estado: string | null
}

export default defineEventHandler(async () => {
  const config = useRuntimeConfig()

  // All three reads are best-effort: a transient backend hiccup (e.g. a 429)
  // should degrade gracefully to fewer goods rather than failing the whole
  // panel listing with an error.
  const [institutionsRes, needsRes, leadsRes] = await Promise.all([
    $fetch<{ data: FlatInstitution[] }>(`${config.backendBase}/institutions`).catch(() => ({ data: [] as FlatInstitution[] })),
    $fetch<{ needs: BackendNeed[] }>(`${config.backendBase}/needs`).catch(() => ({ needs: [] as BackendNeed[] })),
    $fetch<BackendLead[]>(`${config.backendBase}/leads`).catch(() => [] as BackendLead[])
  ])

  // This is the single national citizen panel — there is no per-device catchment
  // area, so every approved need's items belong on it. (A geographic radius
  // filter previously hid all needs whenever the kiosk's GPS was far from the
  // institutions, which is why approved/allocated pedidos never appeared.)
  const nameMap = new Map(
    (institutionsRes.data ?? []).map(i => [i.nif_nipc, i.nome_entidade])
  )

  // Exclude items that have an active lead (PENDENTE or ENTREGUE) — these match
  // the states the backend treats as reserving the item. EXPIRADO leads free
  // the item back onto the panel.
  const excludedByItemId = new Set<number>()
  for (const lead of leadsRes as BackendLead[]) {
    if (lead.estado === 'PENDENTE' || lead.estado === 'ENTREGUE') {
      if (lead.id_item != null) excludedByItemId.add(lead.id_item)
    }
  }

  const goods: Array<{
    id_item: number
    id_pedido: number
    tipo_bem_servico: string
    nome_entidade: string
  }> = []

  for (const need of needsRes.needs ?? []) {
    // Only include needs that have been approved
    if (need.estado != null && need.estado !== 'ACEITE') continue

    const items: BackendNeedItem[] = need['need items'] ?? need.NeedItems ?? need.needItems ?? []
    for (const item of items) {
      // Skip items missing their own PK — these are phantom/incomplete rows
      if (!item.id_item) continue
      if (excludedByItemId.has(item.id_item)) continue

      goods.push({
        id_item: item.id_item,
        id_pedido: need.id_pedido,
        tipo_bem_servico: item.tipo_bem_servico,
        nome_entidade: nameMap.get(need.nif_nipc) ?? need.nif_nipc
      })
    }
  }

  return { goods }
})
