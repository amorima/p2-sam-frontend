interface NewItem {
  tipo_bem_servico: string
  tipo_bem?: string
}

interface BackendCreateResponse {
  'id_pedido'?: number
  'need'?: {
    id_pedido: number
    nif_nipc: string
    estado: string
    urgente: boolean
  }
  'items'?: Array<{ id_item: number, id_pedido: number, tipo_bem_servico: string }>
  'needItems'?: Array<{ id_item: number, id_pedido: number, tipo_bem_servico: string }>
  'need items'?: Array<{ id_item: number, id_pedido: number, tipo_bem_servico: string }>
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  if (!body || !body.nif_nipc) {
    throw createError({
      statusCode: 400,
      statusMessage: 'NIF/NIPC da instituição é obrigatório.'
    })
  }

  const { nif_nipc, items, ...rest } = body

  // Backend DB stores tipo_bem as lowercase ('bem'/'servico') — frontend uses
  // uppercase ('BEM'/'SERVICO'). The ensureGoodsServicesForItems conflict check
  // is case-sensitive, so 'BEM' !== 'bem' triggers a false 422 → 500.
  const backendItems = (items || []).map((it: NewItem) => ({
    tipo_bem_servico: it.tipo_bem_servico,
    tipo_bem: it.tipo_bem?.toLowerCase()
  }))

  const backendBody = {
    ...rest,
    'nif_nipc': nif_nipc,
    'items': backendItems,
    'needItems': backendItems,
    'need items': backendItems
  }

  console.log('[needs/create] →', `POST /institutions/${nif_nipc}/needs`, JSON.stringify({ items: backendItems, estado: rest.estado, urgente: rest.urgente }))

  let response: BackendCreateResponse
  try {
    response = await authBackendFetch<BackendCreateResponse>(event, `${config.backendBase}/institutions/${nif_nipc}/needs`, {
      method: 'POST',
      body: backendBody
    })
  } catch (err: unknown) {
    const e = err as { statusCode?: number, statusMessage?: string, data?: unknown }
    console.error('[needs/create] ✗ backend error:', e?.statusCode, e?.statusMessage, JSON.stringify(e?.data))
    throw err
  }

  console.log('[needs/create] ✓ backend ok:', JSON.stringify(response))

  const result = {
    need: (response.need ?? (response.id_pedido ? response : {})) as Record<string, unknown>,
    items: (response.items ?? response.needItems ?? response['need items'] ?? []) as unknown[]
  }

  if (!result.need.id_pedido && response.id_pedido) {
    result.need = response as unknown as Record<string, unknown>
  }

  return result
})
