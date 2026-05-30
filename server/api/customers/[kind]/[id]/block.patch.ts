const ENTITY_KINDS = new Set(['patron', 'business', 'institution'])

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const kind = getRouterParam(event, 'kind')
  const rawId = getRouterParam(event, 'id')

  if (!kind || !rawId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing kind or id' })
  }

  const id = decodeURIComponent(rawId)

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

  try {
    return await authBackendFetch(event, `${config.backendBase}${backendPath}`, {
      method: 'PATCH',
      body
    })
  } catch (err: unknown) {
    const e = err as { statusCode?: number, statusMessage?: string, data?: { description?: string, message?: string } }
    throw createError({
      statusCode: e?.statusCode ?? 500,
      statusMessage: e?.statusMessage ?? e?.data?.description ?? e?.data?.message ?? 'Failed to update block state'
    })
  }
})
