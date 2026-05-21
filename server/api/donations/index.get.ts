interface Donation {
  id_doacao: number
  mecena_nif_nipc: string
  data: string
  valor_transacao: number
  tipo_donativo: 'ESPECIE' | 'NUMERARIO'
  anonimo: boolean
  url_comprovativo: string
  estado: 'ACEITE' | 'REJEITADO' | 'PENDENTE'
}

interface PatronItem {
  resource: { nif_nipc: string }
  entity: { nif_nipc: string, nome_entidade: string, email_login: string, iban: string }
  locations: object[]
  contacts: object[]
}

export default defineEventHandler(async () => {
  const config = useRuntimeConfig()

  const [donationsRes, patronsRes] = await Promise.all([
    $fetch<{ donations: Donation[] }>(`${config.backendBase}/donations`),
    $fetch<{ data: PatronItem[], _links: object }>(`${config.backendBase}/patrons`)
  ])

  // Backend returns flat format (nif_nipc and nome_entidade at top level)
  const nameMap = new Map(
    (patronsRes.data ?? []).map((p: any) => [p.nif_nipc, p.nome_entidade])
  )

  const enriched = (donationsRes.donations ?? []).map(d => ({
    ...d,
    nome_entidade: nameMap.get(d.mecena_nif_nipc) ?? d.mecena_nif_nipc
  }))

  return { donations: enriched }
})
