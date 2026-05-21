export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const bucket = getRouterParam(event, 'bucket')

  if (bucket !== 'files' && bucket !== 'avatar') {
    throw createError({ statusCode: 400, statusMessage: 'Bucket não autorizado.' })
  }

  const contentType = getRequestHeader(event, 'content-type') ?? ''
  if (!contentType.includes('multipart/form-data')) {
    throw createError({ statusCode: 400, statusMessage: 'Esperado multipart/form-data.' })
  }

  const rawBody = await readRawBody(event, false)
  if (!rawBody) {
    throw createError({ statusCode: 400, statusMessage: 'Corpo da requisição vazio.' })
  }

  const nome = (getQuery(event).nome as string) || `upload_${Date.now()}`

  const response = await fetch(`${config.backendBase}/api/upload/${bucket}?nome=${encodeURIComponent(nome)}`, {
    method: 'POST',
    body: rawBody as unknown as ArrayBuffer,
    headers: { 'content-type': contentType }
  })

  if (!response.ok) {
    const text = await response.text()
    throw createError({ statusCode: response.status, statusMessage: text })
  }

  return response.json() as Promise<{ success: boolean, url: string, fileName: string, bucket: string }>
})
