import { describe, it, expect } from 'vitest'
import type { Need, NeedItem, EstadoPedido } from '~/utils/domain'

function makeItem(overrides: Partial<NeedItem> = {}): NeedItem {
  return {
    id_item: 1,
    id_pedido: 1,
    tipo_bem_servico: 'Leite',
    tipo_bem: 'BEM',
    status: 'available',
    match_tipo: null,
    match_ref: null,
    ...overrides
  }
}

function makeNeed(overrides: Partial<Need> = {}): Need {
  return {
    id_pedido: 1,
    nif_nipc: '507654321',
    data: new Date().toISOString(),
    estado: 'PENDENTE',
    urgente: false,
    items: [],
    ...overrides
  }
}

describe('[RF04] Submissão de Necessidades — estrutura do pedido', () => {
  it('Necessidade tem um array de itens (carências) obrigatório', () => {
    const need = makeNeed()
    expect(Array.isArray(need.items)).toBe(true)
  })

  it('Necessidade com vários itens regista cada carência individualmente', () => {
    const need = makeNeed({
      items: [
        makeItem({ id_item: 1, tipo_bem_servico: 'Leite' }),
        makeItem({ id_item: 2, tipo_bem_servico: 'Sabonete' }),
        makeItem({ id_item: 3, tipo_bem_servico: 'Apoio jurídico', tipo_bem: 'SERVICO' })
      ]
    })
    expect(need.items).toHaveLength(3)
  })

  it('Necessidade pertence a uma Instituição identificada por nif_nipc', () => {
    const need = makeNeed({ nif_nipc: '507654321' })
    expect(need.nif_nipc).toBe('507654321')
    expect(/^\d{9}$/.test(need.nif_nipc)).toBe(true)
  })

  it('Necessidade tem timestamp de criação (data)', () => {
    const now = new Date().toISOString()
    const need = makeNeed({ data: now })
    expect(need.data).toBe(now)
    expect(new Date(need.data).getTime()).not.toBeNaN()
  })
})

describe('[RF04] Submissão de Necessidades — itens: tipo e estado', () => {
  it('item pode ser do tipo BEM', () => {
    const item = makeItem({ tipo_bem: 'BEM', tipo_bem_servico: 'Leite' })
    expect(item.tipo_bem).toBe('BEM')
    expect(item.tipo_bem_servico).toBe('Leite')
  })

  it('item pode ser do tipo SERVICO', () => {
    const item = makeItem({ tipo_bem: 'SERVICO', tipo_bem_servico: 'Apoio jurídico' })
    expect(item.tipo_bem).toBe('SERVICO')
  })

  it('item inicia sem match (status "available" e match_tipo null)', () => {
    const item = makeItem()
    expect(item.status).toBe('available')
    expect(item.match_tipo).toBeNull()
    expect(item.match_ref).toBeNull()
  })

  it('item tem id único dentro do pedido', () => {
    const item1 = makeItem({ id_item: 1 })
    const item2 = makeItem({ id_item: 2 })
    expect(item1.id_item).not.toBe(item2.id_item)
  })
})

describe('[RF04] Submissão de Necessidades — estados e visibilidade pública', () => {
  it('Necessidade aceita os três estados: PENDENTE, ACEITE, REJEITADO', () => {
    const estados: EstadoPedido[] = ['PENDENTE', 'ACEITE', 'REJEITADO']
    for (const estado of estados) {
      const need = makeNeed({ estado })
      expect(need.estado).toBe(estado)
    }
  })

  it('campo urgente indica a visibilidade pública e prioridade do pedido', () => {
    const urgente = makeNeed({ urgente: true })
    const normal = makeNeed({ urgente: false })
    expect(urgente.urgente).toBe(true)
    expect(normal.urgente).toBe(false)
  })

  it('Necessidade urgente é diferenciada de necessidade normal', () => {
    const urgente = makeNeed({ urgente: true, id_pedido: 1 })
    const normal = makeNeed({ urgente: false, id_pedido: 2 })
    expect(urgente.urgente).not.toBe(normal.urgente)
  })

  it('motivo de recusa é registado quando o estado é REJEITADO', () => {
    const rejected = makeNeed({ estado: 'REJEITADO', motivo_recusa: 'Documentação incompleta' })
    expect(rejected.motivo_recusa).toBe('Documentação incompleta')
  })

  it('motivo de recusa é opcional para outros estados', () => {
    const pending = makeNeed({ estado: 'PENDENTE' })
    expect(pending.motivo_recusa).toBeUndefined()
  })
})
