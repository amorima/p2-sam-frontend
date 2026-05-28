interface BackendGoodsService {
  tipo_bem_servico: string
  tipo_bem: 'bem' | 'servico'
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)

  const search = new URLSearchParams()
  if (typeof query.tipo_bem === 'string') search.set('tipo_bem', query.tipo_bem)
  const qs = search.toString()

  const res = await $fetch<{ data: BackendGoodsService[] }>(
    `${config.backendBase}/goods-services${qs ? `?${qs}` : ''}`
  )

  return {
    data: (res.data ?? []).map(g => ({
      tipo_bem_servico: g.tipo_bem_servico,
      tipo_bem: g.tipo_bem === 'servico' ? ('SERVICO' as const) : ('BEM' as const)
    }))
  }
})
