export default defineEventHandler(async (event) => {
  const body = await readBody<{
    role: string
    entity: Record<string, any>
    location: Record<string, any>
    contacts?: any[]
    institution?: Record<string, any>
    business?: Record<string, any>
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

  const payload: Record<string, any> = {
    entity: { ...body.entity, role: body.role },
    location: body.location,
    contacts: body.contacts ?? []
  }

  if (body.role === 'institution' && body.institution) {
    payload.institution = body.institution
  }
  if (body.role === 'business' && body.business) {
    payload.business = body.business
  }

  try {
    return await $fetch(`${config.backendBase}/${endpoint}`, { method: 'POST', body: payload })
  } catch (err: any) {
    const status = err?.response?.status ?? err?.statusCode
    const message = err?.data?.description ?? err?.statusMessage ?? 'Erro ao registar.'
    throw createError({ statusCode: status ?? 500, statusMessage: message })
  }
})
