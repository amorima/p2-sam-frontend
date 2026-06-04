interface FlatEntity {
  nif_nipc: string
  nome_entidade: string
  iban: string
  email_login?: string
  locations: Array<{
    codigo_postal: string
    concelho: string
    distrito: string
    freguesia: string
    pais: string
    rua: string
    n_porta: string
  }>
  contacts: Array<{
    contacto: string
    nome_contacto: string
    descricao: string
  }>
}

interface FlatInstitution extends FlatEntity {
  geo_latitude: number
  geo_longitude: number
  url_comprovativo_estatuto: string
}

function toNestedInstitution(flat: FlatInstitution) {
  return {
    resource: {
      nif_nipc: flat.nif_nipc,
      geo_latitude: flat.geo_latitude ?? 0,
      geo_longitude: flat.geo_longitude ?? 0,
      url_comprovativo_estatuto: flat.url_comprovativo_estatuto ?? ''
    },
    entity: {
      nif_nipc: flat.nif_nipc,
      nome_entidade: flat.nome_entidade ?? '',
      email_login: flat.email_login ?? '',
      iban: flat.iban ?? ''
    },
    locations: flat.locations ?? [],
    contacts: flat.contacts ?? []
  }
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)
  const limit = Math.min(Math.max(1, parseInt(String(query.limit)) || 25), 500)
  const offset = Math.max(0, parseInt(String(query.offset)) || 0)

  const res = await internalFetch<{ items: FlatInstitution[], total: number, limit: number, offset: number }>(
    `${config.backendBase}/institutions?limit=${limit}&offset=${offset}`
  )

  const items = (res.items ?? []).map(toNestedInstitution)
  const total = res.total ?? 0
  const lastOffset = total > 0 ? Math.max(0, (Math.ceil(total / limit) - 1) * limit) : 0
  const links: Record<string, string> = {
    self: `/api/institutions?limit=${limit}&offset=${offset}`,
    first: `/api/institutions?limit=${limit}&offset=0`,
    last: `/api/institutions?limit=${limit}&offset=${lastOffset}`
  }
  if (offset + limit < total) links.next = `/api/institutions?limit=${limit}&offset=${offset + limit}`
  if (offset > 0) links.prev = `/api/institutions?limit=${limit}&offset=${Math.max(0, offset - limit)}`

  return { items, total, limit, offset, links }
})
