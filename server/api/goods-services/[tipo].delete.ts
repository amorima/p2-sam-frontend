export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const tipo = getRouterParam(event, 'tipo')

  if (!tipo) throw createError({ statusCode: 400, statusMessage: 'Tipo obrigatório' })

  return await authBackendFetch(event, `${config.backendBase}/goods-services/${encodeURIComponent(tipo)}`, {
    method: 'DELETE'
  })
})
