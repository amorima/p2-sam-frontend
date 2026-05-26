interface BackendPing {
  _id: string
  evento?: string
  locker_id?: number
  tipo?: string
  geo_latitude?: number
  geo_longitude?: number
  bateria_estado?: number
  cpu_temperatura?: number
  dnb_sinal?: number
  aviso?: string | null
  status?: { sensor_porta?: string, numpad?: string }
  versao?: string
  timestamp?: string
  createdAt?: string
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const config = useRuntimeConfig()
  const lockerId = Number(id)

  let pings: BackendPing[] = []
  try {
    const raw = await $fetch<BackendPing[] | BackendPing>(`${config.backendBase}/telemetry/${id}`)
    pings = Array.isArray(raw) ? raw : raw ? [raw] : []
  } catch {
    pings = []
  }

  return {
    locker_id: Number.isNaN(lockerId) ? 0 : lockerId,
    pings: pings.map(p => ({
      _id: p._id,
      evento: p.evento ?? 'ping',
      locker_id: p.locker_id ?? lockerId,
      tipo: p.tipo ?? 'inteligente',
      geo_latitude: p.geo_latitude ?? 0,
      geo_longitude: p.geo_longitude ?? 0,
      bateria_estado: p.bateria_estado ?? 0,
      cpu_temperatura: p.cpu_temperatura ?? 0,
      dnb_sinal: p.dnb_sinal ?? 0,
      aviso: p.aviso ?? null,
      status: {
        sensor_porta: p.status?.sensor_porta ?? 'fechado',
        numpad: p.status?.numpad ?? 'ok'
      },
      versao: p.versao ?? '1.0.0',
      timestamp: p.timestamp ?? p.createdAt ?? new Date().toISOString()
    }))
  }
})
