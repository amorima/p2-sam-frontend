const AGENT = 'http://127.0.0.1:9191'

export const usePrintAgent = () => {
  const isAvailable = ref(false)
  const selectedPrinter = ref('')

  async function checkAvailability() {
    if (!import.meta.client) return
    try {
      const r = await fetch(`${AGENT}/health`, { signal: AbortSignal.timeout(1500) })
      isAvailable.value = r.ok
    } catch {
      isAvailable.value = false
    }
  }

  async function fetchPrinters(): Promise<string[]> {
    const r = await fetch(`${AGENT}/printers`, { signal: AbortSignal.timeout(8000) })
    const data = await r.json() as { printers: string[] }
    return data.printers ?? []
  }

  async function print(bytes: number[], printerName?: string): Promise<void> {
    const r = await fetch(`${AGENT}/print`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bytes, printerName }),
      signal: AbortSignal.timeout(20000)
    })
    if (!r.ok) {
      const data = await r.json() as { error?: string }
      throw new Error(data.error ?? 'Erro de impressão')
    }
  }

  if (import.meta.client) checkAvailability()

  return { isAvailable, selectedPrinter, checkAvailability, fetchPrinters, print }
}
