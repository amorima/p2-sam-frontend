// Single-business fetch for the owner ("O Meu Negócio"). The list endpoint
// GET /business is admin-only, so a business user can never load itself from
// there. GET /business/:nif (adminOrSelf) lets the owner fetch its own record.

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
  const nif = getRouterParam(event, 'nif')

  const flat = await authBackendFetch<FlatBusiness>(event, `${config.backendBase}/business/${nif}`)

  const offersRes = await authBackendFetch<{ items: Offer[] }>(
    event,
    `${config.backendBase}/business/${nif}/offers?limit=200`
  ).catch(() => ({ items: [] as Offer[] }))

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
    offers: (offersRes.items ?? []).map(o => ({
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
