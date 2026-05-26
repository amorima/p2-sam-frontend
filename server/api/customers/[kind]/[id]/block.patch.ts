const ENTITY_KINDS = new Set(['patron', 'business', 'institution'])

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const kind = getRouterParam(event, 'kind')
  const id = getRouterParam(event, 'id')

  if (!kind || !id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing kind or id' })
  }

  const backendPath
    = kind === 'citizen'
      ? `/citizens/${encodeURIComponent(id)}/block`
      : ENTITY_KINDS.has(kind)
        ? `/entities/${encodeURIComponent(id)}/block`
        : null

  if (!backendPath) {
    throw createError({ statusCode: 400, statusMessage: `Invalid kind: ${kind}` })
  }

  const body = await readBody<{ blocked: boolean | 0 | 1, reason?: string | null }>(event)
  const authHeader = getRequestHeader(event, 'authorization')

  try {
    return await $fetch(`${config.backendBase}${backendPath}`, {
      method: 'PATCH',
      body,
      headers: authHeader ? { authorization: authHeader } : undefined
    })
  } catch (err: unknown) {
    const e = err as { response?: { status?: number }, data?: { description?: string, message?: string } }
    throw createError({
      statusCode: e?.response?.status ?? 500,
      statusMessage: e?.data?.description ?? e?.data?.message ?? 'Failed to update block state'
    })
  }
})
