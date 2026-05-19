import { buildEscPos, type ReceiptData } from '../../utils/escpos'

export default eventHandler(async (event) => {
  const body = await readBody<ReceiptData>(event)

  if (!body?.pin || !body?.donorName) {
    throw createError({ statusCode: 400, message: 'Missing required fields' })
  }

  const buffer = buildEscPos(body)
  return { bytes: Array.from(buffer) }
})
