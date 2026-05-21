interface TelemetryEvent {
  _id: string
  locker_id: number
  tipo: string
  geo_latitude: number
  geo_longitude: number
  bateria_estado: number
  cpu_temperatura: number
  dnb_sinal: number
  aviso: string | null
  evento: string
  versao: string
  createdAt?: string
  timestamp?: string
}

function computeSaude(bateria: number, temp: number, sinal: number, evento: string, lastPingMs: number): 'saudavel' | 'com_deficiencias' | 'erros' | 'desligado' {
  const ageDays = lastPingMs / (1000 * 60 * 60 * 24)
  if (ageDays > 1) return 'desligado'
  if (evento === 'error' || temp > 80 || sinal === 0) return 'erros'
  if (bateria < 20 || temp > 60 || sinal <= 1) return 'com_deficiencias'
  return 'saudavel'
}

export default defineEventHandler(async () => {
  const config = useRuntimeConfig()
  const events = await $fetch<TelemetryEvent[]>(`${config.backendBase}/telemetry`)

  if (!Array.isArray(events) || events.length === 0) {
    return { lockers: [] }
  }

  // Group events by locker_id and keep only the latest per locker
  const latestByLocker = new Map<number, TelemetryEvent & { ts: number }>()

  for (const ev of events) {
    const ts = new Date(ev.timestamp ?? ev.createdAt ?? 0).getTime()
    const existing = latestByLocker.get(ev.locker_id)
    if (!existing || ts > existing.ts) {
      latestByLocker.set(ev.locker_id, { ...ev, ts })
    }
  }

  const now = Date.now()
  const lockers = Array.from(latestByLocker.values()).map((ev) => {
    const ultimoPing = new Date(ev.ts).toISOString()
    const ageSinceLastPingMs = now - ev.ts
    const saude = computeSaude(ev.bateria_estado, ev.cpu_temperatura, ev.dnb_sinal, ev.evento, ageSinceLastPingMs)

    return {
      locker_id: ev.locker_id,
      tipo: ev.tipo ?? 'inteligente',
      geo_latitude: ev.geo_latitude,
      geo_longitude: ev.geo_longitude,
      bateria_estado: ev.bateria_estado,
      cpu_temperatura: ev.cpu_temperatura,
      dnb_sinal: ev.dnb_sinal,
      aviso: ev.aviso,
      evento: ev.evento,
      versao: ev.versao,
      ultimo_ping: ultimoPing,
      saude
    }
  })

  return { lockers }
})
