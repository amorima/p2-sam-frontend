import { buildEscPos, type ReceiptData } from '../../utils/escpos'
import { sendRawToPrinter } from '../../utils/rawPrint'

export default eventHandler(async (event) => {
  const body = await readBody<ReceiptData>(event)

  if (!body?.pin || !body?.donorName) {
    throw createError({ statusCode: 400, message: 'Missing required fields' })
  }

  try {
    const buffer = buildEscPos(body)
    sendRawToPrinter(buffer, body.printerName)
    return { ok: true }
  }
  catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    throw createError({ statusCode: 500, message: msg })
  }
})
