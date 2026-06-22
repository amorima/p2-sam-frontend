// ⚠️ SORTEIO TEMPORÁRIO — REMOVER APÓS A APRESENTAÇÃO
// ─────────────────────────────────────────────────────────────────────────────
// Feature descartável usada apenas na demonstração: ao fazer uma doação no
// painel, é sorteado um prémio (Pin ou Gomas) que sai impresso no talão.
//
// Stock inicial: 20 Pins + 35 Gomas. O stock é guardado em localStorage para
// sobreviver a refreshes da página durante a apresentação.
//
// PARA REMOVER COMPLETAMENTE:
//   1. Apagar este ficheiro (app/composables/useRaffle.ts)
//   2. Remover os blocos marcados "── SORTEIO ──" em app/pages/painel.vue
//   3. Remover o bloco marcado "── SORTEIO ──" em server/utils/escpos.ts
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'sam_raffle_stock_v1'

interface RaffleStock {
  pin: number
  gomas: number
}

const INITIAL_STOCK: RaffleStock = { pin: 20, gomas: 35 }

export function useRaffle() {
  function readStock(): RaffleStock {
    if (!import.meta.client) return { ...INITIAL_STOCK }
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return { ...INITIAL_STOCK }
      const parsed = JSON.parse(raw)
      return {
        pin: Number.isFinite(parsed?.pin) ? Math.max(0, parsed.pin) : 0,
        gomas: Number.isFinite(parsed?.gomas) ? Math.max(0, parsed.gomas) : 0
      }
    } catch {
      return { ...INITIAL_STOCK }
    }
  }

  function writeStock(stock: RaffleStock) {
    if (!import.meta.client) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stock))
  }

  // Sorteia um prémio ponderado pelo stock restante e decrementa-o.
  // Devolve o rótulo a imprimir, ou null se já não há prémios.
  function drawPrize(): string | null {
    const stock = readStock()
    const total = stock.pin + stock.gomas
    if (total <= 0) return null

    const roll = Math.random() * total
    let label: string
    if (roll < stock.pin) {
      stock.pin -= 1
      label = 'Pin SAM'
    } else {
      stock.gomas -= 1
      label = 'Pacote de Gomas'
    }
    writeStock(stock)
    return label
  }

  // Repõe o stock inicial (útil para reiniciar entre ensaios da demo).
  function resetStock() {
    writeStock({ ...INITIAL_STOCK })
  }

  return { drawPrize, resetStock, readStock }
}
