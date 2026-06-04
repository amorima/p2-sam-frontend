interface LeadsStats {
  total: number
  entregues: number
  pendentes: number
  expirados: number
  expiraBreve: number
}

export default defineEventHandler(async (): Promise<LeadsStats> => {
  const config = useRuntimeConfig()
  try {
    return await internalFetch<LeadsStats>(`${config.backendBase}/leads/stats`)
  } catch {
    return { total: 0, entregues: 0, pendentes: 0, expirados: 0, expiraBreve: 0 }
  }
})
