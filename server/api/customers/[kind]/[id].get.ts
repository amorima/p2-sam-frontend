import type { CustomerDetail, CustomerKind } from '~/types'

interface BackendLocation {
  codigo_postal?: string
  rua?: string | null
  n_porta?: string | null
  freguesia?: string | null
  concelho?: string | null
  distrito?: string | null
  pais?: string | null
}

interface BackendContact {
  contacto?: string
  nome_contacto?: string | null
  descricao?: string | null
}

interface BackendEntityResource {
  nif_nipc: string
  nome_entidade?: string
  email_login?: string
  iban?: string | null
  profile_pic?: string | null
  blocked?: boolean | number
  reason?: string | null
  geo_latitude?: number
  geo_longitude?: number
  url_comprovativo_estatuto?: string | null
  locations?: BackendLocation[]
  contacts?: BackendContact[]
}

interface BackendCitizen {
  nome: string
  contacto: string
  rgpd?: number
  blocked?: number
  reason?: string | null
}

const KIND_PATH: Record<CustomerKind, string> = {
  patron: 'patrons',
  business: 'business',
  institution: 'institutions',
  citizen: 'citizens'
}

const KIND_ACTOR: Record<CustomerKind, 'Mecenas' | 'Negócio' | 'Instituição' | 'Cidadão'> = {
  patron: 'Mecenas',
  business: 'Negócio',
  institution: 'Instituição',
  citizen: 'Cidadão'
}

export default defineEventHandler(async (event): Promise<CustomerDetail> => {
  const config = useRuntimeConfig()
  const kind = getRouterParam(event, 'kind') as CustomerKind | undefined
  const rawId = getRouterParam(event, 'id')

  if (!kind || !rawId || !KIND_PATH[kind]) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid customer kind' })
  }

  const id = decodeURIComponent(rawId)
  const url = `${config.backendBase}/${KIND_PATH[kind]}/${encodeURIComponent(id)}`

  const avatarSrc = (profile_pic: string | null | undefined): string | undefined =>
    profile_pic ? `/api/download/avatar?nome=${encodeURIComponent(profile_pic)}` : undefined

  try {
    if (kind === 'citizen') {
      const c = await $fetch<BackendCitizen>(url)
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
        reason: c.reason ?? null,
        rgpd: c.rgpd === 1
      }
    }

    const e = await $fetch<BackendEntityResource>(url)
    const blocked = Boolean(e.blocked)
    const name = e.nome_entidade ?? e.nif_nipc
    return {
      id: e.nif_nipc,
      name,
      email: e.email_login ?? '',
      avatar: { src: avatarSrc(e.profile_pic), alt: name },
      status: blocked ? 'unsubscribed' : 'subscribed',
      actorType: KIND_ACTOR[kind],
      kind,
      blocked,
      reason: e.reason ?? null,
      iban: e.iban ?? null,
      profile_pic: e.profile_pic ?? null,
      locations: e.locations ?? [],
      contacts: e.contacts ?? [],
      geo_latitude: e.geo_latitude ?? null,
      geo_longitude: e.geo_longitude ?? null,
      url_comprovativo_estatuto: e.url_comprovativo_estatuto ?? null
    }
  } catch (err: unknown) {
    const er = err as { response?: { status?: number }, data?: { description?: string } }
    throw createError({
      statusCode: er?.response?.status ?? 500,
      statusMessage: er?.data?.description ?? 'Failed to fetch customer'
    })
  }
})
