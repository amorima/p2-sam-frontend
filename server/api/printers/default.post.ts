import { execSync } from 'node:child_process'

export default eventHandler(async (event) => {
  const body = await readBody<{ name: string }>(event)

  if (!body?.name || typeof body.name !== 'string') {
    throw createError({ statusCode: 400, message: 'Printer name required' })
  }

  // Validate the name is a real installed printer before acting on it
  let available: string[] = []
  try {
    const raw = execSync(
      'powershell -NoProfile -Command "Get-Printer | Select-Object -ExpandProperty Name"',
      { encoding: 'utf8', timeout: 5000 }
    )
    available = raw.split('\n').map(p => p.trim()).filter(Boolean)
  }
  catch {
    throw createError({ statusCode: 500, message: 'Could not list printers' })
  }

  if (!available.includes(body.name)) {
    throw createError({ statusCode: 422, message: 'Printer not found' })
  }

  // Escape single quotes inside the printer name for PowerShell
  const safeName = body.name.replace(/'/g, "''")

  try {
    execSync(
      `powershell -NoProfile -Command "(New-Object -ComObject WScript.Network).SetDefaultPrinter('${safeName}')"`,
      { encoding: 'utf8', timeout: 5000 }
    )
    return { ok: true }
  }
  catch {
    throw createError({ statusCode: 500, message: 'Could not set default printer' })
  }
})
