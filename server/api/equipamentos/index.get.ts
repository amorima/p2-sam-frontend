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
  const res = await internalFetch<{ items: TelemetryEvent[] }>(`${config.backendBase}/telemetry?limit=200`)
  const events = res.items ?? []

  if (events.length === 0) {
    return { lockers: [] }
  }

  // Group all events by locker_id.
  const byLocker = new Map<number, (TelemetryEvent & { ts: number })[]>()
  for (const ev of events) {
    const ts = new Date(ev.timestamp ?? ev.createdAt ?? 0).getTime()
    const arr = byLocker.get(ev.locker_id) ?? []
    arr.push({ ...ev, ts })
    byLocker.set(ev.locker_id, arr)
  }

  // Pega o primeiro valor não-nulo (registos mais recentes primeiro). Eventos de
  // porta não trazem bateria/temperatura/sinal — sem isto, o cacifo apareceria a
  // 0% / ERRO logo após uma abertura, em vez do último valor real.
  const pick = <T>(docs: (TelemetryEvent & { ts: number })[], get: (d: TelemetryEvent) => T | null | undefined): T | undefined => {
    for (const d of docs) {
      const v = get(d)
      if (v !== null && v !== undefined) return v
    }
    return undefined
  }

  const now = Date.now()
  const lockers = Array.from(byLocker.values()).map((docs) => {
    docs.sort((a, b) => b.ts - a.ts)
    const head = docs[0]!
    const bateria = pick(docs, d => d.bateria_estado) ?? 0
    const temp = pick(docs, d => d.cpu_temperatura) ?? 0
    const sinal = pick(docs, d => d.dnb_sinal) ?? 0
    const ageSinceLastPingMs = now - head.ts

    return {
      locker_id: head.locker_id,
      tipo: pick(docs, d => d.tipo) ?? 'inteligente',
      geo_latitude: pick(docs, d => d.geo_latitude) ?? 0,
      geo_longitude: pick(docs, d => d.geo_longitude) ?? 0,
      bateria_estado: bateria,
      cpu_temperatura: temp,
      dnb_sinal: sinal,
      aviso: head.aviso ?? null,
      evento: head.evento,
      versao: pick(docs, d => d.versao) ?? '—',
      ultimo_ping: new Date(head.ts).toISOString(),
      saude: computeSaude(bateria, temp, sinal, head.evento, ageSinceLastPingMs)
    }
  })

  return { lockers }
})
