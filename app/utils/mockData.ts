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

export const mockPatrons = [
  {
    resource: { nif_nipc: '500123456' },
    entity: { nif_nipc: '500123456', nome_entidade: 'Fundação Cultural de Vila do Conde', email_login: 'geral@fcvc.pt', iban: 'PT50000201230000000111111' },
    locations: [{ rua: 'Praça Vasco da Gama', n_porta: '1', codigo_postal: '4480-454', concelho: 'Vila do Conde', distrito: 'Porto', freguesia: 'Vila do Conde', pais: 'Portugal' }],
    contacts: [{ contacto: '252631000', nome_contacto: 'Maria Santos', descricao: 'Diretora' }]
  },
  {
    resource: { nif_nipc: '502345678' },
    entity: { nif_nipc: '502345678', nome_entidade: 'Construções Nortense, S.A.', email_login: 'financeiro@nortense.pt', iban: 'PT50000201230000000222222' },
    locations: [{ rua: 'Rua das Indústrias', n_porta: '45', codigo_postal: '4480-200', concelho: 'Vila do Conde', distrito: 'Porto', freguesia: 'Azurara', pais: 'Portugal' }],
    contacts: [{ contacto: '252640200', nome_contacto: 'Carlos Ferreira', descricao: 'Diretor Financeiro' }]
  },
  {
    resource: { nif_nipc: '210987654' },
    entity: { nif_nipc: '210987654', nome_entidade: 'Ana Margarida Teixeira', email_login: 'ana.teixeira@gmail.com', iban: 'PT50000201230000000333333' },
    locations: [{ rua: 'Rua de Santo António', n_porta: '12', codigo_postal: '4480-670', concelho: 'Vila do Conde', distrito: 'Porto', freguesia: 'Touguinhó', pais: 'Portugal' }],
    contacts: [{ contacto: '916543210', nome_contacto: 'Ana Teixeira', descricao: 'Titular' }]
  },
  {
    resource: { nif_nipc: '508765432' },
    entity: { nif_nipc: '508765432', nome_entidade: 'Supermercados Atlântico, Lda.', email_login: 'geral@atlantico.pt', iban: 'PT50000201230000000444444' },
    locations: [{ rua: 'Avenida do Brasil', n_porta: '100', codigo_postal: '4480-100', concelho: 'Vila do Conde', distrito: 'Porto', freguesia: 'Vila do Conde', pais: 'Portugal' }],
    contacts: [{ contacto: '252610100', nome_contacto: 'Rui Monteiro', descricao: 'Sócio-Gerente' }]
  },
  {
    resource: { nif_nipc: '504321098' },
    entity: { nif_nipc: '504321098', nome_entidade: 'Clínica Saúde Norte, Lda.', email_login: 'clinica@saudenorte.pt', iban: 'PT50000201230000000555555' },
    locations: [{ rua: 'Rua Dr. António Granjo', n_porta: '8', codigo_postal: '4480-668', concelho: 'Vila do Conde', distrito: 'Porto', freguesia: 'Vila do Conde', pais: 'Portugal' }],
    contacts: [{ contacto: '252650050', nome_contacto: 'Dra. Sofia Lopes', descricao: 'Diretora Clínica' }]
  }
]

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

export const mockInstitution = {
  resource: {
    nif_nipc: '500999888',
    geo_latitude: 41.3526,
    geo_longitude: -8.7396,
    url_comprovativo_estatuto: ''
  },
  entity: {
    nif_nipc: '500999888',
    nome_entidade: 'Centro Social Bom Samaritano',
    email_login: 'instituicao@bsamaritano.pt',
    iban: 'PT50000201230000000999888'
  },
  locations: [
    {
      rua: 'Rua da Solidariedade',
      n_porta: '23',
      codigo_postal: '4480-200',
      concelho: 'Vila do Conde',
      distrito: 'Porto',
      freguesia: 'Vila do Conde',
      pais: 'Portugal'
    }
  ],
  contacts: [
    {
      contacto: '252631500',
      nome_contacto: 'Padre João Mendes',
      descricao: 'Diretor'
    }
  ]
}

export const mockInstitutions = [
  mockInstitution,
  {
    resource: { nif_nipc: '500111222', geo_latitude: 41.3490, geo_longitude: -8.7430, url_comprovativo_estatuto: '' },
    entity: { nif_nipc: '500111222', nome_entidade: 'Associação Mãos Solidárias', email_login: 'geral@maossolidarias.pt', iban: 'PT50000201230000000111222' },
    locations: [{ rua: 'Travessa da Paz', n_porta: '5', codigo_postal: '4480-450', concelho: 'Vila do Conde', distrito: 'Porto', freguesia: 'Azurara', pais: 'Portugal' }],
    contacts: [{ contacto: '252620111', nome_contacto: 'Marta Costa', descricao: 'Presidente' }]
  },
  {
    resource: { nif_nipc: '500333444', geo_latitude: 41.3460, geo_longitude: -8.7350, url_comprovativo_estatuto: '' },
    entity: { nif_nipc: '500333444', nome_entidade: 'Lar de São Vicente', email_login: 'direcao@larsvicente.pt', iban: 'PT50000201230000000333444' },
    locations: [{ rua: 'Avenida do Mar', n_porta: '88', codigo_postal: '4480-100', concelho: 'Vila do Conde', distrito: 'Porto', freguesia: 'Vila do Conde', pais: 'Portugal' }],
    contacts: [{ contacto: '252600333', nome_contacto: 'Helena Rocha', descricao: 'Diretora Técnica' }]
  }
]

export type TipoBem = 'BEM' | 'SERVICO'
export interface GoodsService {
  tipo_bem_servico: string
  tipo_bem: TipoBem
}

export const mockGoodsServices: GoodsService[] = [
  { tipo_bem_servico: 'Cabazes alimentares', tipo_bem: 'BEM' },
  { tipo_bem_servico: 'Roupa de bebé', tipo_bem: 'BEM' },
  { tipo_bem_servico: 'Material escolar', tipo_bem: 'BEM' },
  { tipo_bem_servico: 'Produtos de higiene', tipo_bem: 'BEM' },
  { tipo_bem_servico: 'Cobertores e roupa de cama', tipo_bem: 'BEM' },
  { tipo_bem_servico: 'Medicamentos', tipo_bem: 'BEM' },
  { tipo_bem_servico: 'Apoio psicológico', tipo_bem: 'SERVICO' },
  { tipo_bem_servico: 'Consulta médica', tipo_bem: 'SERVICO' },
  { tipo_bem_servico: 'Transporte adaptado', tipo_bem: 'SERVICO' },
  { tipo_bem_servico: 'Aulas de explicação', tipo_bem: 'SERVICO' },
  { tipo_bem_servico: 'Apoio jurídico', tipo_bem: 'SERVICO' }
]

export type EstadoPedido = 'PENDENTE' | 'ACEITE' | 'REJEITADO'
export type MatchTipo = 'VOUCHER' | 'NEGOCIO' | 'PAINEL'
export type ItemStatus = 'available' | 'pending' | 'completed'

export interface NeedItem {
  id_item: number
  id_pedido: number
  tipo_bem_servico: string
  tipo_bem: TipoBem
  status: ItemStatus
  match_tipo: MatchTipo | null
  match_ref: string | null
}

export interface Need {
  id_pedido: number
  nif_nipc: string
  nome_entidade?: string
  data: string
  estado: EstadoPedido
  urgente: boolean
  motivo_recusa?: string
  items: NeedItem[]
}

export interface Panel {
  id_dispositivo: number
  nome: string
  geo_latitude: number
  geo_longitude: number
  raio_alcance: number
  localizacao: string
}

export const mockPanels: Panel[] = [
  { id_dispositivo: 1, nome: 'Painel #1 - Praça Vasco da Gama', geo_latitude: 41.3526, geo_longitude: -8.7396, raio_alcance: 500, localizacao: 'Praça Vasco da Gama' },
  { id_dispositivo: 2, nome: 'Painel #2 - Mercado Municipal', geo_latitude: 41.3552, geo_longitude: -8.7444, raio_alcance: 500, localizacao: 'Mercado Municipal' },
  { id_dispositivo: 3, nome: 'Painel #3 - Estação CP', geo_latitude: 41.3493, geo_longitude: -8.7375, raio_alcance: 500, localizacao: 'Estação Ferroviária' },
  { id_dispositivo: 4, nome: 'Painel #4 - Centro de Saúde', geo_latitude: 41.3478, geo_longitude: -8.7402, raio_alcance: 500, localizacao: 'Centro de Saúde de Vila do Conde' },
  { id_dispositivo: 5, nome: 'Painel #5 - Azurara', geo_latitude: 41.3416, geo_longitude: -8.7479, raio_alcance: 500, localizacao: 'Azurara' },
  { id_dispositivo: 6, nome: 'Painel #6 - Touguinhó', geo_latitude: 41.3713, geo_longitude: -8.6987, raio_alcance: 500, localizacao: 'Touguinhó' },
  { id_dispositivo: 7, nome: 'Painel #7 - Póvoa de Varzim', geo_latitude: 41.3811, geo_longitude: -8.7589, raio_alcance: 500, localizacao: 'Póvoa de Varzim' },
  { id_dispositivo: 8, nome: 'Painel #8 - Mindelo', geo_latitude: 41.3043, geo_longitude: -8.7299, raio_alcance: 500, localizacao: 'Mindelo' },
  { id_dispositivo: 9, nome: 'Painel #9 - Vairão', geo_latitude: 41.3247, geo_longitude: -8.6716, raio_alcance: 500, localizacao: 'Vairão' },
  { id_dispositivo: 10, nome: 'Painel #10 - Modivas', geo_latitude: 41.2891, geo_longitude: -8.7211, raio_alcance: 500, localizacao: 'Modivas' },
  { id_dispositivo: 11, nome: 'Painel #11 - Esposende', geo_latitude: 41.5340, geo_longitude: -8.7822, raio_alcance: 500, localizacao: 'Esposende (fora do raio)' }
]

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (d: number) => d * Math.PI / 180
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

export interface BusinessOffer {
  id_oferta: number
  negocio_nif_nipc: string
  tipo_bem_servico: string
  descricao: string
  valor_total: number
  desconto: number
}

export interface Business {
  resource: {
    nif_nipc: string
    geo_latitude: number
    geo_longitude: number
  }
  entity: {
    nif_nipc: string
    nome_entidade: string
    email_login: string
    iban: string
  }
  offers: BusinessOffer[]
}

export const mockBusinesses: Business[] = [
  {
    resource: { nif_nipc: '510100200', geo_latitude: 41.3540, geo_longitude: -8.7400 },
    entity: { nif_nipc: '510100200', nome_entidade: 'Advogados Costa & Associados', email_login: 'contacto@costaassociados.pt', iban: 'PT50000201230000010100200' },
    offers: [
      { id_oferta: 901, negocio_nif_nipc: '510100200', tipo_bem_servico: 'Apoio jurídico', descricao: 'Consultas jurídicas em direito civil e família', valor_total: 80, desconto: 100 },
      { id_oferta: 902, negocio_nif_nipc: '510100200', tipo_bem_servico: 'Aulas de explicação', descricao: 'Explicações de Português e História', valor_total: 25, desconto: 50 }
    ]
  },
  {
    resource: { nif_nipc: '510100300', geo_latitude: 41.3500, geo_longitude: -8.7480 },
    entity: { nif_nipc: '510100300', nome_entidade: 'Sociedade de Advogados Conde', email_login: 'geral@sacondeadvogados.pt', iban: 'PT50000201230000010100300' },
    offers: [
      { id_oferta: 903, negocio_nif_nipc: '510100300', tipo_bem_servico: 'Apoio jurídico', descricao: 'Apoio jurídico em direito laboral', valor_total: 90, desconto: 75 }
    ]
  },
  {
    resource: { nif_nipc: '510100400', geo_latitude: 41.3480, geo_longitude: -8.7390 },
    entity: { nif_nipc: '510100400', nome_entidade: 'Clínica Norte+ Saúde', email_login: 'clinica@norteplus.pt', iban: 'PT50000201230000010100400' },
    offers: [
      { id_oferta: 904, negocio_nif_nipc: '510100400', tipo_bem_servico: 'Consulta médica', descricao: 'Consultas de medicina geral e familiar', valor_total: 40, desconto: 100 },
      { id_oferta: 905, negocio_nif_nipc: '510100400', tipo_bem_servico: 'Apoio psicológico', descricao: 'Acompanhamento psicológico semanal', valor_total: 50, desconto: 80 }
    ]
  },
  {
    resource: { nif_nipc: '510100500', geo_latitude: 41.3560, geo_longitude: -8.7420 },
    entity: { nif_nipc: '510100500', nome_entidade: 'Psicologia Vila do Conde', email_login: 'consultorio@psivc.pt', iban: 'PT50000201230000010100500' },
    offers: [
      { id_oferta: 906, negocio_nif_nipc: '510100500', tipo_bem_servico: 'Apoio psicológico', descricao: 'Terapia individual e familiar', valor_total: 55, desconto: 100 }
    ]
  },
  {
    resource: { nif_nipc: '510100600', geo_latitude: 41.3470, geo_longitude: -8.7330 },
    entity: { nif_nipc: '510100600', nome_entidade: 'Táxis Solidários do Conde', email_login: 'frota@taxisconde.pt', iban: 'PT50000201230000010100600' },
    offers: [
      { id_oferta: 907, negocio_nif_nipc: '510100600', tipo_bem_servico: 'Transporte adaptado', descricao: 'Viaturas adaptadas a mobilidade reduzida', valor_total: 15, desconto: 100 }
    ]
  },
  {
    resource: { nif_nipc: '510100700', geo_latitude: 41.3520, geo_longitude: -8.7380 },
    entity: { nif_nipc: '510100700', nome_entidade: 'Centro Escolar Aprender+', email_login: 'geral@aprendermais.pt', iban: 'PT50000201230000010100700' },
    offers: [
      { id_oferta: 908, negocio_nif_nipc: '510100700', tipo_bem_servico: 'Aulas de explicação', descricao: 'Explicações de Matemática e Ciências (1º-9º ano)', valor_total: 20, desconto: 100 }
    ]
  }
]

export const mockNeeds: Need[] = [
  {
    id_pedido: 2001,
    nif_nipc: '500999888',
    nome_entidade: 'Centro Social Bom Samaritano',
    data: '2026-04-12T10:30:00.000Z',
    estado: 'ACEITE',
    urgente: true,
    items: [
      { id_item: 1, id_pedido: 2001, tipo_bem_servico: 'Cabazes alimentares', tipo_bem: 'BEM', status: 'completed', match_tipo: 'VOUCHER', match_ref: 'VCH-2026-0042' },
      { id_item: 2, id_pedido: 2001, tipo_bem_servico: 'Produtos de higiene', tipo_bem: 'BEM', status: 'pending', match_tipo: 'PAINEL', match_ref: 'Painel #3 - Praça Vasco da Gama' }
    ]
  },
  {
    id_pedido: 2002,
    nif_nipc: '500111222',
    nome_entidade: 'Associação Mãos Solidárias',
    data: '2026-05-02T14:15:00.000Z',
    estado: 'PENDENTE',
    urgente: false,
    items: [
      { id_item: 3, id_pedido: 2002, tipo_bem_servico: 'Material escolar', tipo_bem: 'BEM', status: 'available', match_tipo: null, match_ref: null },
      { id_item: 4, id_pedido: 2002, tipo_bem_servico: 'Aulas de explicação', tipo_bem: 'SERVICO', status: 'available', match_tipo: null, match_ref: null }
    ]
  },
  {
    id_pedido: 2003,
    nif_nipc: '500333444',
    nome_entidade: 'Lar de São Vicente',
    data: '2026-05-08T09:00:00.000Z',
    estado: 'PENDENTE',
    urgente: true,
    items: [
      { id_item: 5, id_pedido: 2003, tipo_bem_servico: 'Medicamentos', tipo_bem: 'BEM', status: 'available', match_tipo: null, match_ref: null },
      { id_item: 6, id_pedido: 2003, tipo_bem_servico: 'Consulta médica', tipo_bem: 'SERVICO', status: 'available', match_tipo: null, match_ref: null },
      { id_item: 7, id_pedido: 2003, tipo_bem_servico: 'Transporte adaptado', tipo_bem: 'SERVICO', status: 'available', match_tipo: null, match_ref: null }
    ]
  },
  {
    id_pedido: 2004,
    nif_nipc: '500999888',
    nome_entidade: 'Centro Social Bom Samaritano',
    data: '2026-03-25T11:00:00.000Z',
    estado: 'REJEITADO',
    urgente: false,
    motivo_recusa: 'Pedido fora do âmbito do SAM.',
    items: [
      { id_item: 8, id_pedido: 2004, tipo_bem_servico: 'Apoio jurídico', tipo_bem: 'SERVICO', status: 'available', match_tipo: null, match_ref: null }
    ]
  }
]

