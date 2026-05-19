// Web Serial API — browser talks directly to the thermal printer.
// navigator.serial is only available in Chrome/Edge over HTTPS or localhost.

type SerialPortLike = {
  open(options: { baudRate: number }): Promise<void>
  close(): Promise<void>
  readable: { getReader(): unknown } | null
  writable: { getWriter(): { write(data: Uint8Array): Promise<void>; releaseLock(): void } } | null
}

type SerialAPI = {
  getPorts(): Promise<SerialPortLike[]>
  requestPort(options?: object): Promise<SerialPortLike>
}

function getSerial(): SerialAPI | null {
  if (!import.meta.client) return null
  return ('serial' in navigator) ? (navigator as unknown as { serial: SerialAPI }).serial : null
}

export const useSerialPrint = () => {
  const isSupported = computed(() => import.meta.client && 'serial' in navigator)
  const hasPort = ref(false)

  async function refreshPortStatus() {
    const serial = getSerial()
    if (!serial) return
    const ports = await serial.getPorts()
    hasPort.value = ports.length > 0
  }

  async function requestPort() {
    const serial = getSerial()
    if (!serial) return
    try {
      await serial.requestPort()
      hasPort.value = true
    } catch { /* user cancelled the dialog */ }
  }

  async function print(bytes: number[]) {
    const serial = getSerial()
    if (!serial) throw new Error('Web Serial não suportado neste browser.')

    const ports = await serial.getPorts()
    if (!ports.length) throw new Error('Nenhuma impressora ligada. Configure nas Definições.')

    const port = ports[0]!
    const baudRate = parseInt(localStorage.getItem('sam_print_baud_rate') ?? '9600') || 9600

    await port.open({ baudRate })
    const writer = port.writable!.getWriter()
    try {
      await writer.write(new Uint8Array(bytes))
    } finally {
      writer.releaseLock()
      await port.close()
    }
  }

  if (import.meta.client) refreshPortStatus()

  return { isSupported, hasPort, requestPort, refreshPortStatus, print }
}
