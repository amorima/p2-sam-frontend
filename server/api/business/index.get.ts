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

  let businesses: FlatBusiness[] = []
  try {
    const businessRes = await authBackendFetch<{ data: FlatBusiness[] }>(event, `${config.backendBase}/business`)
    businesses = businessRes.data ?? []
  } catch {
    // Non-admin users get 403 — return empty list gracefully
    return { data: [] }
  }

  const offersResults = await Promise.allSettled(
    businesses.map(b =>
      authBackendFetch<{ offers: Offer[] }>(event, `${config.backendBase}/business/${b.nif_nipc}/offers`)
    )
  )

  const data = businesses.map((flat, i) => {
    const result = offersResults[i]
    const offers: Offer[] = result?.status === 'fulfilled'
      ? ((result as PromiseFulfilledResult<{ offers: Offer[] }>).value?.offers ?? [])
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

  return { data }
})
