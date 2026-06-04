interface Location {
  codigo_postal: string
  concelho: string
  distrito: string
  freguesia: string
  pais: string
  rua: string
  n_porta: string
}

interface Contact {
  contacto: string
  nome_contacto: string
  descricao: string
}

interface FlatBusiness {
  nif_nipc: string
  geo_latitude: number
  geo_longitude: number
  nome_entidade: string
  iban: string
  email_login?: string
  blocked?: boolean | number
  reason?: string | null
  url_certidao_permanente?: string
  inicio_atividade?: string
  locations?: Location[]
  contacts?: Contact[]
}

interface Offer {
  id_oferta: number
  negocio_nif_nipc: string
  tipo_bem_servico: string
  descricao: string
  valor_total: number
  desconto: number
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)
  const limit = Math.min(Math.max(1, parseInt(String(query.limit)) || 25), 500)
  const offset = Math.max(0, parseInt(String(query.offset)) || 0)
  const q = typeof query.q === 'string' ? query.q.trim() : ''
  const qs = q ? `&q=${encodeURIComponent(q)}` : ''

  let businesses: FlatBusiness[] = []
  let total = 0
  try {
    const businessRes = await authBackendFetch<{ items: FlatBusiness[], total: number }>(event, `${config.backendBase}/business?limit=${limit}&offset=${offset}${qs}`)
    businesses = businessRes.items ?? []
    total = businessRes.total ?? 0
  } catch {
    // Non-admin users get 403 — return empty list gracefully
    return { items: [], total: 0, limit, offset, links: {} }
  }

  const offersResults = await Promise.allSettled(
    businesses.map(b =>
      authBackendFetch<{ items: Offer[] }>(event, `${config.backendBase}/business/${b.nif_nipc}/offers?limit=200`)
    )
  )

  const items = businesses.map((flat, i) => {
    const result = offersResults[i]
    const offers: Offer[] = result?.status === 'fulfilled'
      ? ((result as PromiseFulfilledResult<{ items: Offer[] }>).value?.items ?? [])
      : []

    const isBlocked = Boolean(flat.blocked)

    return {
      resource: {
        nif_nipc: flat.nif_nipc,
        geo_latitude: Number(flat.geo_latitude) || 0,
        geo_longitude: Number(flat.geo_longitude) || 0,
        url_certidao_permanente: flat.url_certidao_permanente ?? '',
        inicio_atividade: flat.inicio_atividade ?? ''
      },
      entity: {
        nif_nipc: flat.nif_nipc,
        nome_entidade: flat.nome_entidade ?? '',
        email_login: flat.email_login ?? '',
        iban: flat.iban ?? '',
        blocked: isBlocked,
        reason: flat.reason ?? null
      },
      locations: flat.locations ?? [],
      contacts: flat.contacts ?? [],
      offers: offers.map((o: Offer) => ({
        id_oferta: o.id_oferta,
        negocio_nif_nipc: o.negocio_nif_nipc,
        tipo_bem_servico: o.tipo_bem_servico,
        descricao: o.descricao,
        valor_total: Number(o.valor_total),
        desconto: Number(o.desconto)
      })),
      status: (isBlocked ? 'SUSPENSO' : 'ATIVO') as 'ATIVO' | 'SUSPENSO'
    }
  })

  const lastOffset = total > 0 ? Math.max(0, (Math.ceil(total / limit) - 1) * limit) : 0
  const links: Record<string, string> = {
    self: `/api/business?limit=${limit}&offset=${offset}`,
    first: `/api/business?limit=${limit}&offset=0`,
    last: `/api/business?limit=${limit}&offset=${lastOffset}`
  }
  if (offset + limit < total) links.next = `/api/business?limit=${limit}&offset=${offset + limit}`
  if (offset > 0) links.prev = `/api/business?limit=${limit}&offset=${Math.max(0, offset - limit)}`

  return { items, total, limit, offset, links }
})
