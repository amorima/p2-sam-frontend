import { execSync } from 'node:child_process'

export default eventHandler(async () => {
  try {
    const raw = execSync(
      'powershell -NoProfile -Command "Get-Printer | Select-Object -ExpandProperty Name"',
      { encoding: 'utf8', timeout: 5000 }
    )
    const printers = raw
      .split('\n')
      .map(p => p.trim())
      .filter(Boolean)

    return { printers }
  } catch {
    return { printers: [] }
  }
})
