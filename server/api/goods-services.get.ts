interface BackendGoodsService {
  tipo_bem_servico: string
  tipo_bem: 'bem' | 'servico'
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)
  const limit = Math.min(Math.max(1, parseInt(String(query.limit)) || 25), 500)
  const offset = Math.max(0, parseInt(String(query.offset)) || 0)

  const search = new URLSearchParams()
  if (typeof query.tipo_bem === 'string') search.set('tipo_bem', query.tipo_bem)
  search.set('limit', String(limit))
  search.set('offset', String(offset))

  const res = await $fetch<{ items: BackendGoodsService[], total: number }>(
    `${config.backendBase}/goods-services?${search.toString()}`
  )

  const items = (res.items ?? []).map(g => ({
    tipo_bem_servico: g.tipo_bem_servico,
    tipo_bem: g.tipo_bem === 'servico' ? ('SERVICO' as const) : ('BEM' as const)
  }))

  const total = res.total ?? 0
  const lastOffset = total > 0 ? Math.max(0, (Math.ceil(total / limit) - 1) * limit) : 0
  const links: Record<string, string> = {
    self: `/api/goods-services?limit=${limit}&offset=${offset}`,
    first: `/api/goods-services?limit=${limit}&offset=0`,
    last: `/api/goods-services?limit=${limit}&offset=${lastOffset}`
  }
  if (offset + limit < total) links.next = `/api/goods-services?limit=${limit}&offset=${offset + limit}`
  if (offset > 0) links.prev = `/api/goods-services?limit=${limit}&offset=${Math.max(0, offset - limit)}`

  return { items, total, limit, offset, links }
})
