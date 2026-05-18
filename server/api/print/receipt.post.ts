import { buildEscPos, type ReceiptData } from '../../utils/escpos'
import { sendRawToPrinter } from '../../utils/rawPrint'

export default eventHandler(async (event) => {
  const body = await readBody<ReceiptData>(event)

  if (!body?.pin || !body?.donorName) {
    throw createError({ statusCode: 400, message: 'Missing required fields' })
  }

  const printer = body.printerName?.trim() || '(default)'
  console.log(`[SAM receipt] donor="${body.donorName}" pin=${body.pin} printer="${printer}"`)

  try {
    const buffer = buildEscPos(body)
    console.log(`[SAM receipt] ESC/POS buffer: ${buffer.length} bytes`)
    sendRawToPrinter(buffer, body.printerName)
    console.log('[SAM receipt] print submitted successfully')
    return { ok: true }
  }
  catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`[SAM receipt] FAILED: ${msg}`)
    throw createError({ statusCode: 500, message: msg })
  }
})
