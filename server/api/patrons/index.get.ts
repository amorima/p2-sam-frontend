// Backend returns flat format: nif_nipc, nome_entidade, iban, locations, contacts at top level
export default defineEventHandler(async () => {
  const config = useRuntimeConfig()
  return $fetch(`${config.backendBase}/patrons`)
})
