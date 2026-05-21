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

export default defineEventHandler(async () => {
  const config = useRuntimeConfig()
  const res = await $fetch<{ data: FlatInstitution[] }>(`${config.backendBase}/institutions`)
  return { data: (res.data ?? []).map(toNestedInstitution) }
})
