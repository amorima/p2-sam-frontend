const RADIUS_KM = 20

interface FlatInstitution {
  nif_nipc: string
  nome_entidade: string
  geo_latitude: number
  geo_longitude: number
}

interface BackendNeedItem {
  id_item: number
  id_pedido: number
  tipo_bem_servico: string
  // `publico = 1` marks an item explicitly allocated to the citizen panel during
  // approval — it is shown regardless of the panel's distance to the institution.
  publico?: number | boolean | null
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

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)
  const panelLat = query.lat ? parseFloat(String(query.lat)) : null
  const panelLng = query.lng ? parseFloat(String(query.lng)) : null

  // Best-effort reads: a transient backend hiccup (e.g. a 429) should degrade
  // gracefully to fewer goods rather than failing the whole panel listing.
  const [institutionsRes, needsRes, leadsRes] = await Promise.all([
    $fetch<{ data: FlatInstitution[] }>(`${config.backendBase}/institutions`).catch(() => ({ data: [] as FlatInstitution[] })),
    $fetch<{ needs: BackendNeed[] }>(`${config.backendBase}/needs`).catch(() => ({ needs: [] as BackendNeed[] })),
    $fetch<BackendLead[]>(`${config.backendBase}/leads`).catch(() => [] as BackendLead[])
  ])

  // Institutions within the panel's catchment radius (when GPS is available).
  const nearbyNifs = new Set(
    (institutionsRes.data ?? [])
      .filter(i => panelLat == null || panelLng == null
        ? true
        : haversineKm(panelLat, panelLng, i.geo_latitude ?? 0, i.geo_longitude ?? 0) <= RADIUS_KM)
      .map(i => i.nif_nipc)
  )

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

    const institutionNearby = nearbyNifs.has(need.nif_nipc)
    const items: BackendNeedItem[] = need['need items'] ?? need.NeedItems ?? need.needItems ?? []
    for (const item of items) {
      // Skip items missing their own PK — these are phantom/incomplete rows
      if (!item.id_item) continue
      if (excludedByItemId.has(item.id_item)) continue

      // Show the item if its institution is within the panel radius OR it was
      // explicitly allocated to the panel (publico) during approval — the latter
      // overrides distance so manual allocations always reach the panel.
      const allocatedToPanel = item.publico === 1 || item.publico === true
      if (!institutionNearby && !allocatedToPanel) continue

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
