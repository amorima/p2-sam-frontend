import { spawnSync } from 'node:child_process'

export default eventHandler(async (event) => {
  const body = await readBody<{ name: string }>(event)

  if (!body?.name || typeof body.name !== 'string') {
    throw createError({ statusCode: 400, message: 'Printer name required' })
  }

  // Validate against real installed printers
  const list = spawnSync('powershell', [
    '-NoProfile',
    '-Command',
    'Get-WmiObject Win32_Printer | Select-Object -ExpandProperty Name'
  ], { encoding: 'utf8', timeout: 8000 })

  if (list.error || list.status !== 0) {
    throw createError({ statusCode: 500, message: 'Could not list printers' })
  }

  const available = (list.stdout ?? '').split('\n').map(p => p.trim()).filter(Boolean)

  if (!available.includes(body.name)) {
    throw createError({ statusCode: 422, message: 'Printer not found' })
  }

  // Escape single quotes inside the printer name
  const safeName = body.name.replace(/'/g, '\'\'')

  const set = spawnSync('powershell', [
    '-NoProfile',
    '-Command',
    `(New-Object -ComObject WScript.Network).SetDefaultPrinter('${safeName}')`
  ], { encoding: 'utf8', timeout: 8000 })

  if (set.error || set.status !== 0) {
    const msg = (set.stderr ?? set.stdout ?? '').trim()
    throw createError({ statusCode: 500, message: msg || 'Could not set default printer' })
  }

  return { ok: true }
})
