import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { LEAD_PIN_VALIDITY_HOURS, type Lead } from '~/utils/domain'
import { useLeads } from '~/composables/useLeads'

const HOUR = 3_600_000

// Builds a minimal Lead fixture — only fields consumed by the pure functions
function makeLead(overrides: Partial<Lead> = {}): Lead {
  return {
    id_lead: 1,
    data: new Date().toISOString(),
    id_painel: 1,
    nome_cidadao: 'Cidadão Teste',
    contacto_cidadao: 'teste@sam.pt',
    id_pedido: 1,
    id_item: 1,
    item_pedido: 'Leite',
    estado: 'PENDENTE',
    pin_entrega: '123456',
    id_locker: null,
    ...overrides
  }
}

describe('useLeads — pure date functions', () => {
  // Call once at describe level — createSharedComposable is a singleton; these
  // functions are pure closures and do not depend on shared reactive state.
  const { effectiveEstado, expiresAt, hoursRemaining } = useLeads()

  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  // ── effectiveEstado ─────────────────────────────────────────────────────────

  describe('effectiveEstado', () => {
    it('always returns ENTREGUE for a delivered lead, regardless of age', () => {
      const old = makeLead({ estado: 'ENTREGUE', data: '2020-01-01T00:00:00.000Z' })
      expect(effectiveEstado(old)).toBe('ENTREGUE')
    })

    it('returns PENDENTE for a lead created 2 hours ago', () => {
      const base = new Date('2025-06-01T12:00:00.000Z')
      vi.setSystemTime(base)
      const lead = makeLead({
        data: new Date(base.getTime() - 2 * HOUR).toISOString(),
        estado: 'PENDENTE'
      })
      expect(effectiveEstado(lead)).toBe('PENDENTE')
    })

    it('returns EXPIRADO when more than LEAD_PIN_VALIDITY_HOURS have elapsed', () => {
      const created = new Date('2025-06-01T12:00:00.000Z')
      vi.setSystemTime(new Date(created.getTime() + (LEAD_PIN_VALIDITY_HOURS + 1) * HOUR))
      const lead = makeLead({ data: created.toISOString(), estado: 'PENDENTE' })
      expect(effectiveEstado(lead)).toBe('EXPIRADO')
    })

    it('returns PENDENTE at the exact expiry instant (uses strict > comparison)', () => {
      // The check is Date.now() > expiresAt, so at exactly the expiry ms the
      // lead is still PENDENTE — it becomes EXPIRADO only strictly after.
      const created = new Date('2025-06-01T12:00:00.000Z')
      vi.setSystemTime(new Date(created.getTime() + LEAD_PIN_VALIDITY_HOURS * HOUR))
      const lead = makeLead({ data: created.toISOString(), estado: 'PENDENTE' })
      expect(effectiveEstado(lead)).toBe('PENDENTE')
    })
  })

  // ── expiresAt ───────────────────────────────────────────────────────────────

  describe('expiresAt', () => {
    it('is exactly LEAD_PIN_VALIDITY_HOURS after the creation date', () => {
      const created = new Date('2025-06-01T12:00:00.000Z')
      const lead = makeLead({ data: created.toISOString() })
      const expected = new Date(created.getTime() + LEAD_PIN_VALIDITY_HOURS * HOUR)
      expect(expiresAt(lead).getTime()).toBe(expected.getTime())
    })
  })

  // ── hoursRemaining ──────────────────────────────────────────────────────────

  describe('hoursRemaining', () => {
    it('returns 0 for a fully expired lead (never goes negative)', () => {
      const created = new Date('2025-06-01T12:00:00.000Z')
      vi.setSystemTime(new Date(created.getTime() + (LEAD_PIN_VALIDITY_HOURS + 48) * HOUR))
      const lead = makeLead({ data: created.toISOString() })
      expect(hoursRemaining(lead)).toBe(0)
    })

    it('returns the correct remaining hours for a fresh lead', () => {
      const created = new Date('2025-06-01T12:00:00.000Z')
      const elapsedHours = 24
      vi.setSystemTime(new Date(created.getTime() + elapsedHours * HOUR))
      const lead = makeLead({ data: created.toISOString() })
      expect(hoursRemaining(lead)).toBeCloseTo(LEAD_PIN_VALIDITY_HOURS - elapsedHours, 1)
    })
  })
})
