import type { AvatarProps } from '@nuxt/ui'

export type UserStatus = 'subscribed' | 'unsubscribed' | 'bounced'
export type SaleStatus = 'paid' | 'failed' | 'refunded'

export type CustomerKind = 'patron' | 'business' | 'institution' | 'citizen'

export interface User {
  id: string | number
  name: string
  email: string
  avatar?: AvatarProps
  status: UserStatus
  actorType: 'Mecenas' | 'Negócio' | 'Instituição' | 'Cidadão'
  kind?: CustomerKind
  blocked?: boolean
  reason?: string | null
  iban?: string | null
  profile_pic?: string | null
}

export interface CustomerLocation {
  codigo_postal?: string
  rua?: string | null
  n_porta?: string | null
  freguesia?: string | null
  concelho?: string | null
  distrito?: string | null
  pais?: string | null
}

export interface CustomerContact {
  contacto?: string
  nome_contacto?: string | null
  descricao?: string | null
}

export interface CustomerDetail extends User {
  kind: CustomerKind
  locations?: CustomerLocation[]
  contacts?: CustomerContact[]
  geo_latitude?: number | null
  geo_longitude?: number | null
  url_comprovativo_estatuto?: string | null
  rgpd?: boolean
}

export interface Mail {
  id: number
  unread?: boolean
  from: User
  subject: string
  body: string
  date: string
}

export interface Member {
  name: string
  username: string
  role: 'member' | 'owner'
  avatar: AvatarProps
}

export interface Stat {
  title: string
  icon: string
  value: number | string
  variation: number
  formatter?: (value: number) => string
}

export interface Sale {
  id: string
  date: string
  status: SaleStatus
  email: string
  amount: number
}

export interface Notification {
  id: number
  unread?: boolean
  sender: User
  body: string
  date: string
}

export type Period = 'daily' | 'weekly' | 'monthly'

export interface Range {
  start: Date
  end: Date
}
