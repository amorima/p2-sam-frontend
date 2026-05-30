const KIND_TO_PATH: Record<string, string> = {
  patron: 'patrons',
  business: 'business',
  institution: 'institutions',
  citizen: 'citizens'
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const kind = getRouterParam(event, 'kind')
  const rawId = getRouterParam(event, 'id')

  if (!kind || !rawId || !KIND_TO_PATH[kind]) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid customer kind' })
  }

  const id = decodeURIComponent(rawId)
  const authHeader = getRequestHeader(event, 'authorization')

  try {
    await $fetch(`${config.backendBase}/${KIND_TO_PATH[kind]}/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: authHeader ? { authorization: authHeader } : undefined
    })
    setResponseStatus(event, 204)
    return null
  } catch (err: unknown) {
    const e = err as { response?: { status?: number }, data?: { description?: string, message?: string } }
    throw createError({
      statusCode: e?.response?.status ?? 500,
      statusMessage: e?.data?.description ?? e?.data?.message ?? 'Failed to delete customer'
    })
  }
})
