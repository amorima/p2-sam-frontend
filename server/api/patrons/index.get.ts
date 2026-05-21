interface FlatPatron {
  nif_nipc: string
  nome_entidade: string
  email_login: string
  iban: string
  locations: unknown[]
  contacts: unknown[]
}

export default defineEventHandler(async () => {
  const config = useRuntimeConfig()
  const res = await $fetch<{ data: FlatPatron[] }>(`${config.backendBase}/patrons`)

  const data = (res.data ?? []).map(p => ({
    resource: { nif_nipc: p.nif_nipc },
    entity: { nif_nipc: p.nif_nipc, nome_entidade: p.nome_entidade, email_login: p.email_login, iban: p.iban },
    locations: p.locations ?? [],
    contacts: p.contacts ?? []
  }))

  return { data }
})
