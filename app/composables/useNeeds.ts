import { createSharedComposable } from '@vueuse/core'
import {
  mockNeeds,
  mockInstitutions,
  mockGoodsServices,
  type Need,
  type NeedItem,
  type EstadoPedido,
  type MatchTipo,
  type GoodsService
} from '~/utils/mockData'

interface NewItemInput {
  tipo_bem_servico: string
  tipo_bem: 'BEM' | 'SERVICO'
}

interface CreateNeedInput {
  nif_nipc: string
  nome_entidade?: string
  data: string
  estado?: EstadoPedido
  urgente: boolean
  items: NewItemInput[]
}

const _useNeeds = () => {
  const needs = useState<Need[]>('needs.list', () => [...mockNeeds])
  const institutions = useState('needs.institutions', () => [...mockInstitutions])
  const goodsServices = useState<GoodsService[]>('needs.goodsServices', () => [...mockGoodsServices])

  const nextNeedId = () => Math.max(2000, ...needs.value.map(n => n.id_pedido)) + 1
  const nextItemId = () => {
    const all = needs.value.flatMap(n => n.items.map(i => i.id_item))
    return Math.max(0, ...all) + 1
  }

  function ensureGoodsService(item: NewItemInput) {
    const exists = goodsServices.value.some(g => g.tipo_bem_servico === item.tipo_bem_servico)
    if (!exists) {
      goodsServices.value.push({ tipo_bem_servico: item.tipo_bem_servico, tipo_bem: item.tipo_bem })
    }
  }

  function createNeed(input: CreateNeedInput): Need {
    input.items.forEach(ensureGoodsService)
    const id_pedido = nextNeedId()
    let id_item = nextItemId()
    const items: NeedItem[] = input.items.map(it => ({
      id_item: id_item++,
      id_pedido,
      tipo_bem_servico: it.tipo_bem_servico,
      tipo_bem: it.tipo_bem,
      status: 'available',
      match_tipo: null,
      match_ref: null
    }))
    const need: Need = {
      id_pedido,
      nif_nipc: input.nif_nipc,
      nome_entidade: input.nome_entidade,
      data: input.data,
      estado: input.estado ?? 'PENDENTE',
      urgente: input.urgente,
      items
    }
    // If created already accepted and urgent, auto-issue voucher on BEM items as a courtesy
    if (need.estado === 'ACEITE' && need.urgente) {
      need.items.forEach((it) => {
        if (it.tipo_bem === 'BEM' && !it.match_tipo) {
          it.match_tipo = 'VOUCHER'
          it.match_ref = `VCH-${new Date().getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}`
          it.status = 'completed'
        }
      })
    }
    needs.value = [need, ...needs.value]
    return need
  }

  function updateNeedStatus(id: number, estado: EstadoPedido, motivo_recusa?: string) {
    const need = needs.value.find(n => n.id_pedido === id)
    if (!need) return
    need.estado = estado
    if (estado === 'REJEITADO') {
      need.motivo_recusa = motivo_recusa ?? need.motivo_recusa
    } else {
      need.motivo_recusa = undefined
    }
  }

  function setItemMatch(id_pedido: number, id_item: number, match_tipo: MatchTipo | null, match_ref: string | null) {
    const need = needs.value.find(n => n.id_pedido === id_pedido)
    if (!need) return
    const item = need.items.find(i => i.id_item === id_item)
    if (!item) return
    item.match_tipo = match_tipo
    item.match_ref = match_ref
    if (match_tipo === 'VOUCHER') {
      item.status = 'completed'
    } else if (match_tipo) {
      item.status = 'pending'
    } else {
      item.status = 'available'
    }
  }

  function approveNeed(id_pedido: number) {
    const need = needs.value.find(n => n.id_pedido === id_pedido)
    if (!need) return
    need.estado = 'ACEITE'
    need.motivo_recusa = undefined
    // For urgent needs, auto-issue vouchers for any BEM item without a match yet
    if (need.urgente) {
      need.items.forEach((it) => {
        if (it.tipo_bem === 'BEM' && !it.match_tipo) {
          it.match_tipo = 'VOUCHER'
          it.match_ref = `VCH-${new Date().getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}`
          it.status = 'completed'
        }
      })
    }
  }

  function rejectNeed(id_pedido: number, motivo: string) {
    const need = needs.value.find(n => n.id_pedido === id_pedido)
    if (!need) return
    need.estado = 'REJEITADO'
    need.motivo_recusa = motivo
  }

  return {
    needs,
    institutions,
    goodsServices,
    createNeed,
    updateNeedStatus,
    setItemMatch,
    approveNeed,
    rejectNeed
  }
}

export const useNeeds = createSharedComposable(_useNeeds)
