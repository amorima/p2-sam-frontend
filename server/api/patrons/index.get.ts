export default defineEventHandler(async () => {
  const config = useRuntimeConfig()

  const response = await $fetch<{ data: PatronResponse[] }>(
    `${config.backendBase}/patrons`
  )

  return response
})

interface PatronResponse {
  resource: { nif_nipc: string }
  entity: {
    nif_nipc: string
    nome_entidade: string
    email_login: string
    iban: string
  }
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
