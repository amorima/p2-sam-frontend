export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)
  try {
    return await $fetch(`${config.backendBase}/leads`, {
      method: 'POST',
      body
    })
  } catch (err: unknown) {
    const e = err as { status?: number, data?: unknown, message?: string }
    console.error('[leads POST] backend error:', JSON.stringify(e.data ?? e.message))
    throw createError({ statusCode: e.status ?? 500, message: JSON.stringify(e.data ?? e.message) })
  }
})
