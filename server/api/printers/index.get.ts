import { spawnSync } from 'node:child_process'

export default eventHandler(() => {
  const r = spawnSync('powershell', [
    '-NoProfile',
    '-Command',
    'Get-WmiObject Win32_Printer | Select-Object -ExpandProperty Name'
  ], { encoding: 'utf8', timeout: 8000 })

  if (r.error || r.status !== 0) {
    return { printers: [] }
  }

  const printers = (r.stdout ?? '')
    .split('\n')
    .map(p => p.trim())
    .filter(Boolean)

  return { printers }
})
