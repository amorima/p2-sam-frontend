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

export default defineEventHandler(async (event): Promise<unknown> => {
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

  const query = getQuery(event)
  const limit = Math.min(Math.max(1, parseInt(String(query.limit)) || 25), 200)
  const offset = Math.max(0, parseInt(String(query.offset)) || 0)
  const q = typeof query.q === 'string' ? query.q.trim() : ''
  const qs = q ? `&q=${encodeURIComponent(q)}` : ''

  const safeFetch = async <T>(path: string): Promise<T | null> => {
    try {
      return await authBackendFetch<T>(event, `${base}${path}`)
    } catch (err: unknown) {
      const e = err as { response?: { status?: number }, message?: string }
      console.warn(`[customers] ${path} failed:`, e?.response?.status, e?.message)
      return null
    }
  }

  // Fetch all entities with a high limit for combining; pagination applied to combined result
  const [patrons, businesses, institutions, citizensRes] = await Promise.all([
    safeFetch<{ items?: BackendEntity[] } | BackendEntity[]>(`/patrons?limit=500${qs}`),
    safeFetch<{ items?: BackendEntity[] } | BackendEntity[]>(`/business?limit=500${qs}`),
    safeFetch<{ items?: BackendEntity[] } | BackendEntity[]>(`/institutions?limit=500${qs}`),
    safeFetch<{ items?: BackendCitizen[] } | BackendCitizen[]>(`/citizens?limit=500${qs}`)
  ])

  const toArray = <T>(v: { items?: T[], data?: T[] } | T[] | null): T[] => {
    if (!v) return []
    if (Array.isArray(v)) return v
    return v.items ?? v.data ?? []
  }

  const allUsers: User[] = []
  for (const p of toArray<BackendEntity>(patrons)) allUsers.push(entityToUser(p, 'patron', 'Mecenas'))
  for (const b of toArray<BackendEntity>(businesses)) allUsers.push(entityToUser(b, 'business', 'Negócio'))
  for (const i of toArray<BackendEntity>(institutions)) allUsers.push(entityToUser(i, 'institution', 'Instituição'))
  for (const c of toArray<BackendCitizen>(citizensRes)) allUsers.push(citizenToUser(c))

  const total = allUsers.length
  const items = allUsers.slice(offset, offset + limit)

  console.log(`[customers] total=${total}, returning ${items.length} users (offset=${offset}, limit=${limit})`)

  const lastOffset = total > 0 ? Math.max(0, (Math.ceil(total / limit) - 1) * limit) : 0
  const links: Record<string, string> = {
    self: `/api/customers?limit=${limit}&offset=${offset}`,
    first: `/api/customers?limit=${limit}&offset=0`,
    last: `/api/customers?limit=${limit}&offset=${lastOffset}`
  }
  if (offset + limit < total) links.next = `/api/customers?limit=${limit}&offset=${offset + limit}`
  if (offset > 0) links.prev = `/api/customers?limit=${limit}&offset=${Math.max(0, offset - limit)}`

  return { items, total, limit, offset, links }
})
