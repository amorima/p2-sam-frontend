export const mockPatron = {
  resource: { nif_nipc: '123456789' },
  entity: {
    nif_nipc: '123456789',
    nome_entidade: 'Patron Organization, Lda.',
    email_login: 'patron@example.com',
    iban: 'PT50000201234567890123456789'
  },
  locations: [
    {
      rua: 'Rua de Exemplo',
      n_porta: '10',
      codigo_postal: '1000-100',
      concelho: 'Lisboa',
      distrito: 'Lisboa',
      freguesia: 'Santa Maria Maior',
      pais: 'Portugal'
    }
  ],
  contacts: [
    {
      contacto: '912345678',
      nome_contacto: 'João Silva',
      descricao: 'Responsável'
    }
  ]
}

const now = Date.now()

export const mockLockers = [
  {
    locker_id: 1001,
    tipo: 'inteligente',
    geo_latitude: 41.14140,
    geo_longitude: -8.61099,
    bateria_estado: 85,
    cpu_temperatura: 38.2,
    dnb_sinal: 5,
    aviso: null,
    evento: 'heartbeat',
    versao: '1.0.3',
    ultimo_ping: new Date(now - 30_000).toISOString(),
    saude: 'saudavel' as const
  },
  {
    locker_id: 1002,
    tipo: 'inteligente',
    geo_latitude: 41.15500,
    geo_longitude: -8.62200,
    bateria_estado: 35,
    cpu_temperatura: 56.4,
    dnb_sinal: 2,
    aviso: 'Bateria fraca',
    evento: 'heartbeat',
    versao: '1.0.2',
    ultimo_ping: new Date(now - 120_000).toISOString(),
    saude: 'com_deficiencias' as const
  },
  {
    locker_id: 1003,
    tipo: 'inteligente',
    geo_latitude: 41.13200,
    geo_longitude: -8.60500,
    bateria_estado: 12,
    cpu_temperatura: 93.1,
    dnb_sinal: 0,
    aviso: 'Sobreaquecimento crítico',
    evento: 'error',
    versao: '1.0.1',
    ultimo_ping: new Date(now - 300_000).toISOString(),
    saude: 'erros' as const
  },
  {
    locker_id: 1004,
    tipo: 'inteligente',
    geo_latitude: 41.16100,
    geo_longitude: -8.63400,
    bateria_estado: 72,
    cpu_temperatura: 41.5,
    dnb_sinal: 4,
    aviso: null,
    evento: 'door_open',
    versao: '1.0.3',
    ultimo_ping: new Date(now - 60_000).toISOString(),
    saude: 'saudavel' as const
  },
  {
    locker_id: 1005,
    tipo: 'inteligente',
    geo_latitude: 41.12800,
    geo_longitude: -8.59800,
    bateria_estado: 45,
    cpu_temperatura: 67.3,
    dnb_sinal: 1,
    aviso: 'Porta aberta',
    evento: 'door_open',
    versao: '1.0.0',
    ultimo_ping: new Date(now - 180_000).toISOString(),
    saude: 'com_deficiencias' as const
  },
  {
    locker_id: 1006,
    tipo: 'inteligente',
    geo_latitude: 41.17500,
    geo_longitude: -8.64100,
    bateria_estado: 8,
    cpu_temperatura: 29.1,
    dnb_sinal: 3,
    aviso: null,
    evento: 'heartbeat',
    versao: '1.0.3',
    ultimo_ping: new Date(now - 86_400_000 * 3).toISOString(),
    saude: 'desligado' as const
  }
]

function ping(
  id: string,
  lockerId: number,
  offsetMs: number,
  evento: string,
  bateria: number,
  temp: number,
  sinal: number,
  aviso: string | null = null,
  sensorPorta = 'fechado',
  numpad = 'operacional',
  versao = '1.0.3'
) {
  return {
    _id: id,
    locker_id: lockerId,
    tipo: 'inteligente',
    geo_latitude: 41.14140,
    geo_longitude: -8.61099,
    bateria_estado: bateria,
    cpu_temperatura: temp,
    dnb_sinal: sinal,
    aviso,
    evento,
    status: { sensor_porta: sensorPorta, numpad },
    versao,
    timestamp: new Date(now - offsetMs).toISOString()
  }
}

export const mockTelemetryPings: Record<number, ReturnType<typeof ping>[]> = {
  1001: [
    ping('mock1001a', 1001, 30_000, 'heartbeat', 85, 38.2, 5),
    ping('mock1001b', 1001, 90_000, 'heartbeat', 86, 37.8, 5),
    ping('mock1001c', 1001, 150_000, 'door_open', 86, 38.0, 5, 'Porta aberta', 'aberto'),
    ping('mock1001d', 1001, 210_000, 'door_close', 86, 38.1, 5, null, 'fechado'),
    ping('mock1001e', 1001, 330_000, 'heartbeat', 87, 37.5, 5),
    ping('mock1001f', 1001, 600_000, 'heartbeat', 87, 39.1, 4),
    ping('mock1001g', 1001, 900_000, 'boot', 88, 36.9, 5),
    ping('mock1001h', 1001, 1_800_000, 'heartbeat', 89, 35.4, 5)
  ],
  1002: [
    ping('mock1002a', 1002, 120_000, 'heartbeat', 35, 56.4, 2, 'Bateria fraca'),
    ping('mock1002b', 1002, 420_000, 'heartbeat', 38, 55.1, 2, 'Bateria fraca'),
    ping('mock1002c', 1002, 900_000, 'heartbeat', 41, 54.8, 3, 'Bateria fraca'),
    ping('mock1002d', 1002, 1_800_000, 'boot', 55, 52.0, 3)
  ],
  1003: [
    ping('mock1003a', 1003, 300_000, 'error', 12, 93.1, 0, 'Sobreaquecimento crítico'),
    ping('mock1003b', 1003, 600_000, 'error', 15, 88.4, 0, 'Sobreaquecimento crítico'),
    ping('mock1003c', 1003, 900_000, 'heartbeat', 18, 79.2, 1, 'Temperatura elevada'),
    ping('mock1003d', 1003, 1_800_000, 'heartbeat', 22, 70.5, 2)
  ],
  1004: [
    ping('mock1004a', 1004, 60_000, 'door_open', 72, 41.5, 4, 'Porta aberta', 'aberto'),
    ping('mock1004b', 1004, 120_000, 'door_close', 72, 41.7, 4, null, 'fechado'),
    ping('mock1004c', 1004, 600_000, 'heartbeat', 73, 40.9, 4),
    ping('mock1004d', 1004, 1_800_000, 'heartbeat', 75, 39.8, 5)
  ],
  1005: [
    ping('mock1005a', 1005, 180_000, 'door_open', 45, 67.3, 1, 'Porta aberta', 'aberto'),
    ping('mock1005b', 1005, 480_000, 'heartbeat', 47, 65.1, 1, 'Porta aberta', 'aberto'),
    ping('mock1005c', 1005, 900_000, 'heartbeat', 50, 63.8, 2)
  ],
  1006: [
    ping('mock1006a', 1006, 86_400_000 * 3, 'heartbeat', 8, 29.1, 3),
    ping('mock1006b', 1006, 86_400_000 * 3 + 300_000, 'heartbeat', 10, 28.8, 3),
    ping('mock1006c', 1006, 86_400_000 * 4, 'boot', 15, 27.5, 4)
  ]
}

export const mockApprovedDonation = {
  id_doacao: 1001,
  mecena_nif_nipc: '123456789',
  nome_entidade: 'Patron Organization, Lda.',
  data: '2026-03-20T00:00:00.000Z',
  valor_transacao: 500,
  tipo_donativo: 'NUMERARIO' as const,
  anonimo: false,
  url_comprovativo: '',
  estado: 'ACEITE' as const
}
