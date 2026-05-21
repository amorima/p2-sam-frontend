export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const bucket = getRouterParam(event, 'bucket')
  const nome = getQuery(event).nome as string

  if (!nome) throw createError({ statusCode: 400, statusMessage: 'Nome do ficheiro em falta' })
  if (bucket !== 'files' && bucket !== 'avatar') {
    throw createError({ statusCode: 400, statusMessage: 'Bucket não autorizado' })
  }

  const response = await fetch(
    `${config.backendBase}/api/upload/${bucket}/download?nome=${encodeURIComponent(nome)}`
  )

  if (!response.ok) {
    throw createError({ statusCode: response.status, statusMessage: 'Ficheiro não encontrado' })
  }

  const contentType = response.headers.get('content-type') ?? 'application/octet-stream'
  setResponseHeader(event, 'Content-Type', contentType)
  setResponseHeader(event, 'Content-Disposition', `inline; filename="${nome}"`)

  return sendStream(event, response.body as ReadableStream)
})
