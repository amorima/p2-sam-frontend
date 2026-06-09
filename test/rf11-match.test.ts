import { describe, it, expect, beforeEach } from 'vitest'
import { useNeeds } from '~/composables/useNeeds'
import type { Need, NeedItem } from '~/utils/domain'

function makeNeedWithItem(itemOverrides: Partial<NeedItem> = {}): Need {
  return {
    id_pedido: 1,
    nif_nipc: '507654321',
    data: new Date().toISOString(),
    estado: 'PENDENTE',
    urgente: false,
    items: [{
      id_item: 1,
      id_pedido: 1,
      tipo_bem_servico: 'Leite',
      tipo_bem: 'BEM',
      status: 'available',
      match_tipo: null,
      match_ref: null,
      ...itemOverrides
    }]
  }
}

describe('[RF11] Match e Pagamentos — alocação de recursos por tipo', () => {
  const { needs, setItemMatch } = useNeeds()

  beforeEach(() => {
    needs.value = []
  })

  it('match VOUCHER (fundo de Mecenas) define o item como concluído (completed)', () => {
    needs.value = [makeNeedWithItem()]
    setItemMatch(1, 1, 'VOUCHER', 'VCH-2025-1234')
    const item = needs.value[0]!.items[0]!
    expect(item.match_tipo).toBe('VOUCHER')
    expect(item.match_ref).toBe('VCH-2025-1234')
    expect(item.status).toBe('completed')
  })

  it('match NEGOCIO (serviço pago a negócio) coloca o item em pendente', () => {
    needs.value = [makeNeedWithItem()]
    setItemMatch(1, 1, 'NEGOCIO', 'Supermercado SAM')
    const item = needs.value[0]!.items[0]!
    expect(item.match_tipo).toBe('NEGOCIO')
    expect(item.status).toBe('pending')
  })

  it('match PAINEL (doação do cidadão) coloca o item em pendente', () => {
    needs.value = [makeNeedWithItem()]
    setItemMatch(1, 1, 'PAINEL', null)
    const item = needs.value[0]!.items[0]!
    expect(item.match_tipo).toBe('PAINEL')
    expect(item.status).toBe('pending')
  })

  it('remover match (null) repõe o item como disponível (available)', () => {
    needs.value = [makeNeedWithItem({ match_tipo: 'VOUCHER', status: 'completed' })]
    setItemMatch(1, 1, null, null)
    const item = needs.value[0]!.items[0]!
    expect(item.match_tipo).toBeNull()
    expect(item.match_ref).toBeNull()
    expect(item.status).toBe('available')
  })

  it('match NEGOCIO não afecta items de outros pedidos', () => {
    needs.value = [
      makeNeedWithItem(),
      { ...makeNeedWithItem(), id_pedido: 2, items: [{ ...makeNeedWithItem().items[0]!, id_pedido: 2 }] }
    ]
    setItemMatch(1, 1, 'VOUCHER', 'VCH-2025-0001')
    expect(needs.value[1]!.items[0]!.match_tipo).toBeNull()
  })
})

describe('[RF11] Match e Pagamentos — alocação a Negócio: ciclo completo', () => {
  const { needs, setBusinessMatch, setBusinessResponse } = useNeeds()

  beforeEach(() => {
    needs.value = []
  })

  it('setBusinessMatch regista o NIF do negócio e coloca estado PENDENTE', () => {
    needs.value = [makeNeedWithItem()]
    setBusinessMatch(1, 1, '507123456', 'Supermercado SAM')
    const item = needs.value[0]!.items[0]!
    expect(item.match_tipo).toBe('NEGOCIO')
    expect(item.match_business_nif).toBe('507123456')
    expect(item.match_business_estado).toBe('PENDENTE')
    expect(item.status).toBe('pending')
  })

  it('negócio que aceita o serviço mantém item como pending até conclusão', () => {
    needs.value = [makeNeedWithItem()]
    setBusinessMatch(1, 1, '507123456', 'SAM Biz')
    setBusinessResponse(1, 1, 'ACEITE')
    const item = needs.value[0]!.items[0]!
    expect(item.match_business_estado).toBe('ACEITE')
    expect(item.status).toBe('pending')
  })

  it('negócio que recusa o serviço repõe o item como available', () => {
    needs.value = [makeNeedWithItem()]
    setBusinessMatch(1, 1, '507123456', 'SAM Biz')
    setBusinessResponse(1, 1, 'RECUSADO', 'Fora de stock')
    const item = needs.value[0]!.items[0]!
    expect(item.match_business_estado).toBe('RECUSADO')
    expect(item.match_business_motivo).toBe('Fora de stock')
    expect(item.status).toBe('available')
  })

  it('negócio que conclui o serviço define o item como completed', () => {
    needs.value = [makeNeedWithItem()]
    setBusinessMatch(1, 1, '507123456', 'SAM Biz')
    setBusinessResponse(1, 1, 'CONCLUIDO')
    const item = needs.value[0]!.items[0]!
    expect(item.match_business_estado).toBe('CONCLUIDO')
    expect(item.status).toBe('completed')
  })

  it('motivo de recusa é limpo quando o negócio conclui o serviço', () => {
    needs.value = [makeNeedWithItem()]
    setBusinessMatch(1, 1, '507123456', 'SAM Biz')
    setBusinessResponse(1, 1, 'RECUSADO', 'Sem stock')
    setBusinessMatch(1, 1, '507123456', 'SAM Biz')
    setBusinessResponse(1, 1, 'CONCLUIDO')
    const item = needs.value[0]!.items[0]!
    expect(item.match_business_motivo).toBeNull()
  })
})
