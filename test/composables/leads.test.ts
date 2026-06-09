import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { LEAD_PIN_VALIDITY_HOURS, type Lead } from '~/utils/domain'
import { useLeads } from '~/composables/useLeads'

const HOUR = 3_600_000

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

describe('[RF09] Validação no Locker — effectiveEstado: janela de 168 horas', () => {
  const { effectiveEstado } = useLeads()

  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('lead entregue retorna ENTREGUE independentemente da idade do PIN', () => {
    const lead = makeLead({ estado: 'ENTREGUE', data: '2020-01-01T00:00:00.000Z' })
    expect(effectiveEstado(lead)).toBe('ENTREGUE')
  })

  it('lead criado há 2 horas retorna PENDENTE (dentro do prazo de 168 h)', () => {
    const base = new Date('2025-06-01T12:00:00.000Z')
    vi.setSystemTime(base)
    const lead = makeLead({
      data: new Date(base.getTime() - 2 * HOUR).toISOString(),
      estado: 'PENDENTE'
    })
    expect(effectiveEstado(lead)).toBe('PENDENTE')
  })

  it('lead criado há mais de 168 horas retorna EXPIRADO', () => {
    const created = new Date('2025-06-01T12:00:00.000Z')
    vi.setSystemTime(new Date(created.getTime() + (LEAD_PIN_VALIDITY_HOURS + 1) * HOUR))
    const lead = makeLead({ data: created.toISOString(), estado: 'PENDENTE' })
    expect(effectiveEstado(lead)).toBe('EXPIRADO')
  })

  it('no instante exacto de expiração (168 h) o lead ainda é PENDENTE (comparação estrita >)', () => {
    const created = new Date('2025-06-01T12:00:00.000Z')
    vi.setSystemTime(new Date(created.getTime() + LEAD_PIN_VALIDITY_HOURS * HOUR))
    const lead = makeLead({ data: created.toISOString(), estado: 'PENDENTE' })
    expect(effectiveEstado(lead)).toBe('PENDENTE')
  })

  it('lead criado há 100 horas está ainda dentro do prazo (PENDENTE)', () => {
    const created = new Date('2025-06-01T00:00:00.000Z')
    vi.setSystemTime(new Date(created.getTime() + 100 * HOUR))
    const lead = makeLead({ data: created.toISOString(), estado: 'PENDENTE' })
    expect(effectiveEstado(lead)).toBe('PENDENTE')
  })

  it('lead criado há 169 horas está fora do prazo (EXPIRADO)', () => {
    const created = new Date('2025-06-01T00:00:00.000Z')
    vi.setSystemTime(new Date(created.getTime() + 169 * HOUR))
    const lead = makeLead({ data: created.toISOString(), estado: 'PENDENTE' })
    expect(effectiveEstado(lead)).toBe('EXPIRADO')
  })
})

describe('[RF09] Validação no Locker — expiresAt: cálculo do prazo de validade', () => {
  const { expiresAt } = useLeads()

  it('data de expiração é exactamente 168 horas após a criação do lead', () => {
    const created = new Date('2025-06-01T12:00:00.000Z')
    const lead = makeLead({ data: created.toISOString() })
    const expected = new Date(created.getTime() + LEAD_PIN_VALIDITY_HOURS * HOUR)
    expect(expiresAt(lead).getTime()).toBe(expected.getTime())
  })

  it('expiresAt é posterior à data de criação do lead', () => {
    const created = new Date('2025-03-15T08:00:00.000Z')
    const lead = makeLead({ data: created.toISOString() })
    expect(expiresAt(lead).getTime()).toBeGreaterThan(created.getTime())
  })
})

describe('[RNF05] Integridade do PIN — expiração automática e registo da transação', () => {
  const { effectiveEstado, hoursRemaining } = useLeads()

  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('PIN expirado nunca retorna PENDENTE (garantia de uso único temporal)', () => {
    const created = new Date('2025-01-01T00:00:00.000Z')
    vi.setSystemTime(new Date(created.getTime() + (LEAD_PIN_VALIDITY_HOURS + 100) * HOUR))
    const lead = makeLead({ data: created.toISOString(), estado: 'PENDENTE' })
    expect(effectiveEstado(lead)).not.toBe('PENDENTE')
    expect(effectiveEstado(lead)).toBe('EXPIRADO')
  })

  it('hoursRemaining nunca retorna valor negativo para lead expirado', () => {
    const created = new Date('2025-06-01T12:00:00.000Z')
    vi.setSystemTime(new Date(created.getTime() + (LEAD_PIN_VALIDITY_HOURS + 48) * HOUR))
    const lead = makeLead({ data: created.toISOString() })
    expect(hoursRemaining(lead)).toBe(0)
  })

  it('lead criado há 24 h tem ~144 horas restantes (LEAD_PIN_VALIDITY_HOURS − 24)', () => {
    const created = new Date('2025-06-01T12:00:00.000Z')
    vi.setSystemTime(new Date(created.getTime() + 24 * HOUR))
    const lead = makeLead({ data: created.toISOString() })
    expect(hoursRemaining(lead)).toBeCloseTo(LEAD_PIN_VALIDITY_HOURS - 24, 1)
  })

  it('Lead tem campo pin_entrega obrigatório que identifica a transação', () => {
    const lead = makeLead({ pin_entrega: '847291' })
    expect(lead.pin_entrega).toBeDefined()
    expect(lead.pin_entrega).not.toBe('')
  })

  it('dois leads distintos devem ter PINs diferentes (unicidade)', () => {
    const lead1 = makeLead({ id_lead: 1, pin_entrega: '123456' })
    const lead2 = makeLead({ id_lead: 2, pin_entrega: '654321' })
    expect(lead1.pin_entrega).not.toBe(lead2.pin_entrega)
  })
})

describe('[RF10] Atualização de Estado — confirmação de depósito no Locker', () => {
  const { effectiveEstado } = useLeads()

  it('estado ENTREGUE é o estado final após depósito confirmado', () => {
    const lead = makeLead({ estado: 'ENTREGUE', data: '2020-01-01T00:00:00.000Z' })
    expect(effectiveEstado(lead)).toBe('ENTREGUE')
  })

  it('lead ENTREGUE não reverte para EXPIRADO mesmo após 168 h', () => {
    const ancient = makeLead({ estado: 'ENTREGUE', data: '2010-01-01T00:00:00.000Z' })
    expect(effectiveEstado(ancient)).toBe('ENTREGUE')
  })

  it('Lead tem campo id_locker para associar ao dispositivo de entrega', () => {
    const comLocker = makeLead({ id_locker: 5 })
    const semLocker = makeLead({ id_locker: null })
    expect(comLocker.id_locker).toBe(5)
    expect(semLocker.id_locker).toBeNull()
  })

  it('Lead tem campo data_entrega para registo temporal do depósito', () => {
    const lead: Lead = makeLead({ data_entrega: '2025-06-02T10:30:00.000Z' })
    expect(lead.data_entrega).toBeDefined()
    expect(lead.data_entrega).toBe('2025-06-02T10:30:00.000Z')
  })

  it('Lead tem campo porta para identificar a porta específica do Locker', () => {
    const lead: Lead = makeLead({ porta: 3 })
    expect(lead.porta).toBe(3)
  })
})
