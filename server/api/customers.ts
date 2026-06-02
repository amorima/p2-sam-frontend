import type { User } from '~/types'

interface BackendEntity {
  nif_nipc: string
  nome_entidade?: string
  email_login?: string
  iban?: string | null
  profile_pic?: string | null
  blocked?: boolean | number
  reason?: string | null
}

interface BackendCitizen {
  nome: string
  contacto: string
  rgpd?: number
  blocked?: number
  reason?: string | null
}

function avatarSrc(profile_pic: string | null | undefined): string | undefined {
  if (profile_pic) return `/api/download/avatar?nome=${encodeURIComponent(profile_pic)}`
  return undefined
}

function entityToUser(
  e: BackendEntity,
  kind: 'patron' | 'business' | 'institution',
  actorType: 'Mecenas' | 'Negócio' | 'Instituição'
): User {
  const blocked = Boolean(e.blocked)
  const name = e.nome_entidade ?? e.nif_nipc
  return {
    id: e.nif_nipc,
    name,
    email: e.email_login ?? '',
    avatar: { src: avatarSrc(e.profile_pic), alt: name },
    status: blocked ? 'unsubscribed' : 'subscribed',
    actorType,
    kind,
    blocked,
    reason: e.reason ?? null,
    iban: e.iban ?? null,
    profile_pic: e.profile_pic ?? null
  }
}

function citizenToUser(c: BackendCitizen): User {
  const blocked = Boolean(c.blocked)
  return {
    id: c.contacto,
    name: c.nome,
    email: c.contacto,
    avatar: { src: avatarSrc(null), alt: c.nome },
    status: blocked ? 'unsubscribed' : 'subscribed',
    actorType: 'Cidadão',
    kind: 'citizen',
    blocked,
    reason: c.reason ?? null
  }
}

export default defineEventHandler(async (event): Promise<User[] | unknown> => {
  const config = useRuntimeConfig()
  const base = config.backendBase

  // Create a new citizen (admin user-management "Novo utilizador" action).
  if (getMethod(event) === 'POST') {
    const body = await readBody<{ name?: string, email?: string, rgpd?: boolean }>(event)
    const nome = body?.name?.trim()
    const contacto = body?.email?.trim()
    if (!nome || !contacto) {
      throw createError({ statusCode: 400, statusMessage: 'Nome e email são obrigatórios.' })
    }
    try {
      return await authBackendFetch(event, `${base}/citizens`, {
        method: 'POST',
        body: { nome, contacto, rgpd: body?.rgpd === false ? 0 : 1 }
      })
    } catch (err: unknown) {
      const e = err as { statusCode?: number, statusMessage?: string, data?: { description?: string } }
      throw createError({
        statusCode: e?.statusCode ?? 500,
        statusMessage: e?.statusMessage ?? e?.data?.description ?? 'Falha ao criar utilizador.'
      })
    }
  }

  const safeFetch = async <T>(path: string): Promise<T | null> => {
    try {
      return await authBackendFetch<T>(event, `${base}${path}`)
    } catch (err: unknown) {
      const e = err as { response?: { status?: number }, message?: string }
      console.warn(`[customers] ${path} failed:`, e?.response?.status, e?.message)
      return null
    }
  }

  // Citizens can be a bare array (older backend) or { data: [...] } (new backend);
  // entities are always { data: [...] }.
  const [patrons, businesses, institutions, citizensRes] = await Promise.all([
    safeFetch<{ data?: BackendEntity[] } | BackendEntity[]>('/patrons'),
    safeFetch<{ data?: BackendEntity[] } | BackendEntity[]>('/business'),
    safeFetch<{ data?: BackendEntity[] } | BackendEntity[]>('/institutions'),
    safeFetch<{ data?: BackendCitizen[] } | BackendCitizen[]>('/citizens')
  ])

  const toArray = <T>(v: { data?: T[] } | T[] | null): T[] => {
    if (!v) return []
    return Array.isArray(v) ? v : (v.data ?? [])
  }

  const users: User[] = []
  for (const p of toArray<BackendEntity>(patrons)) users.push(entityToUser(p, 'patron', 'Mecenas'))
  for (const b of toArray<BackendEntity>(businesses)) users.push(entityToUser(b, 'business', 'Negócio'))
  for (const i of toArray<BackendEntity>(institutions)) users.push(entityToUser(i, 'institution', 'Instituição'))
  for (const c of toArray<BackendCitizen>(citizensRes)) users.push(citizenToUser(c))

  console.log(`[customers] returning ${users.length} users (patrons=${toArray<BackendEntity>(patrons).length}, business=${toArray<BackendEntity>(businesses).length}, institutions=${toArray<BackendEntity>(institutions).length}, citizens=${toArray<BackendCitizen>(citizensRes).length})`)
  return users
})
