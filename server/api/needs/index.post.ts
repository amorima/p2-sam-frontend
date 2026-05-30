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

  // Prepare items for the backend: remove tipo_bem as it's inferred on GET
  const backendItems = (items || []).map((it: NewItem) => ({
    tipo_bem_servico: it.tipo_bem_servico
  }))

  const response = await authBackendFetch<BackendCreateResponse>(event, `${config.backendBase}/institutions/${nif_nipc}/needs`, {
    method: 'POST',
    body: {
      ...rest,
      'nif_nipc': nif_nipc,
      'items': backendItems,
      'needItems': backendItems,
      'need items': backendItems
    }
  })

  // Defensive mapping to ensure the frontend receive the structure it expects
  // useNeeds.ts expects: { need: { id_pedido, ... }, items: [...] }
  const result: { need: Record<string, unknown>, items: unknown[] } = {
    need: response.need ?? (response.id_pedido ? response : {}),
    items: response.items ?? response.needItems ?? response['need items'] ?? []
  }

  // Fallback for id_pedido if it's at the root and not in .need
  if (!result.need.id_pedido && response.id_pedido) {
    result.need = response as unknown as Record<string, unknown>
  }

  return result
})
