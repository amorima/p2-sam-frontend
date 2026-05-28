// Domain types — populated at runtime from the SAM backend (which itself is
// seeded by the p2-SAM-data-generator). No literal data here.

export type TipoBem = 'BEM' | 'SERVICO'

export interface GoodsService {
  tipo_bem_servico: string
  tipo_bem: TipoBem
}

export type EstadoPedido = 'PENDENTE' | 'ACEITE' | 'REJEITADO'
export type MatchTipo = 'VOUCHER' | 'NEGOCIO' | 'PAINEL'
export type ItemStatus = 'available' | 'pending' | 'completed'

export type BusinessMatchEstado = 'PENDENTE' | 'ACEITE' | 'RECUSADO' | 'CONCLUIDO'

export interface NeedItem {
  id_item: number
  id_pedido: number
  tipo_bem_servico: string
  tipo_bem: TipoBem
  status: ItemStatus
  match_tipo: MatchTipo | null
  match_ref: string | null
  match_business_nif?: string | null
  match_business_estado?: BusinessMatchEstado | null
  match_business_motivo?: string | null
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

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (d: number) => d * Math.PI / 180
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

export interface Institution {
  resource: {
    nif_nipc: string
    geo_latitude: number
    geo_longitude: number
    url_comprovativo_estatuto: string
  }
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

export interface BusinessOffer {
  id_oferta: number
  negocio_nif_nipc: string
  tipo_bem_servico: string
  descricao: string
  valor_total: number
  desconto: number
}

export type BusinessStatus = 'ATIVO' | 'SUSPENSO'

export interface BusinessLocation {
  codigo_postal: string
  concelho: string
  distrito: string
  freguesia: string
  pais: string
  rua: string
  n_porta: string
}

export interface BusinessContact {
  contacto: string
  nome_contacto: string
  descricao: string
}

export interface Business {
  resource: {
    nif_nipc: string
    geo_latitude: number
    geo_longitude: number
    url_certidao_permanente?: string
    inicio_atividade?: string
  }
  entity: {
    nif_nipc: string
    nome_entidade: string
    email_login: string
    iban: string
    blocked?: boolean
    reason?: string | null
  }
  locations?: BusinessLocation[]
  contacts?: BusinessContact[]
  offers: BusinessOffer[]
  status?: BusinessStatus
}

export const LEAD_PIN_VALIDITY_HOURS = 168

export type LeadEstado = 'PENDENTE' | 'ENTREGUE' | 'EXPIRADO'

export interface SmartLocker {
  id_locker: number
  nome: string
  estado: 'DISPONIVEL' | 'INDISPONIVEL' | 'OCUPADO' | 'MANUTENCAO'
  geo_latitude: number
  geo_longitude: number
  localizacao: string
  total_portas: number
}

export interface Lead {
  id_lead: number
  data: string
  id_painel: number
  painel_nome?: string
  nome_cidadao: string
  contacto_cidadao: string
  id_pedido: number
  id_item: number
  item_pedido: string
  estado: LeadEstado
  pin_entrega: string
  id_locker: number | null
  locker_nome?: string
  porta?: number | null
  data_entrega?: string | null
  nome_entidade?: string
}
