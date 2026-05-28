export default defineEventHandler(async (event) => {
  const body = await readBody<{
    role: string
    entity: Record<string, unknown>
    location: Record<string, unknown>
    contacts?: unknown[]
    institution?: Record<string, unknown>
    business?: Record<string, unknown>
    offers?: unknown[]
  }>(event)

  const config = useRuntimeConfig()

  const endpointMap: Record<string, string> = {
    patron: 'patrons',
    institution: 'institutions',
    business: 'business'
  }

  const endpoint = endpointMap[body.role]
  if (!endpoint) {
    throw createError({ statusCode: 400, statusMessage: 'Tipo inválido.' })
  }

  const payload: Record<string, unknown> = {
    entity: { ...body.entity, role: body.role },
    location: body.location,
    contacts: body.contacts ?? []
  }

  if (body.role === 'institution' && body.institution) {
    payload.institution = body.institution
  }
  if (body.role === 'business' && body.business) {
    payload.business = body.business
    if (Array.isArray(body.offers) && body.offers.length) {
      payload.offers = body.offers
    }
  }

  try {
    return await $fetch(`${config.backendBase}/${endpoint}`, { method: 'POST', body: payload })
  } catch (err: unknown) {
    const e = err as { response?: { status?: number }, statusCode?: number, data?: { description?: string }, statusMessage?: string }
    const status = e?.response?.status ?? e?.statusCode
    const message = e?.data?.description ?? e?.statusMessage ?? 'Erro ao registar.'
    throw createError({ statusCode: status ?? 500, statusMessage: message })
  }
})
