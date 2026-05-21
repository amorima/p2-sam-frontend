interface FlatBusiness {
  nif_nipc: string
  geo_latitude: number
  geo_longitude: number
  nome_entidade: string
  iban: string
  email_login?: string
  locations: any[]
  contacts: any[]
}

interface Offer {
  id_oferta: number
  negocio_nif_nipc: string
  tipo_bem_servico: string
  descricao: string
  valor_total: number
  desconto: number
}

export default defineEventHandler(async () => {
  const config = useRuntimeConfig()

  const businessRes = await $fetch<{ data: FlatBusiness[] }>(`${config.backendBase}/business`)
  const businesses = businessRes.data ?? []

  // Fetch offers for all businesses in parallel
  const offersResults = await Promise.allSettled(
    businesses.map(b =>
      $fetch<{ offers: Offer[] }>(`${config.backendBase}/business/${b.nif_nipc}/offers`)
    )
  )

  const data = businesses.map((flat, i) => {
    const result = offersResults[i]
    const offers: Offer[] = result?.status === 'fulfilled'
      ? ((result as PromiseFulfilledResult<{ offers: Offer[] }>).value?.offers ?? [])
      : []

    return {
      resource: {
        nif_nipc: flat.nif_nipc,
        geo_latitude: flat.geo_latitude ?? 0,
        geo_longitude: flat.geo_longitude ?? 0
      },
      entity: {
        nif_nipc: flat.nif_nipc,
        nome_entidade: flat.nome_entidade ?? '',
        email_login: flat.email_login ?? '',
        iban: flat.iban ?? ''
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
      status: 'ATIVO' as const
    }
  })

  return { data }
})
