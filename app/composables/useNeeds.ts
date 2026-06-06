import { createSharedComposable } from '@vueuse/core'
import { usePagination } from './usePagination'
import type {
  Need,
  NeedItem,
  EstadoPedido,
  MatchTipo,
  GoodsService,
  Business,
  BusinessOffer,
  Institution,
  Panel
} from '~/utils/domain'

interface NewItemInput {
  tipo_bem_servico: string
  tipo_bem: 'BEM' | 'SERVICO'
}

// The project runs a single physical citizen panel in Vila do Conde. There is
// no IoT equipment-management backend (and none is required), so the panel is
// declared here as the canonical default that powers the approval PanelPicker.
const DEFAULT_PANEL: Panel = {
  id_dispositivo: 1,
  nome: 'Painel do Cidadão — Vila do Conde',
  geo_latitude: 41.3537,
  geo_longitude: -8.7427,
  raio_alcance: 20,
  localizacao: 'Praça do Município, Vila do Conde'
}

interface CreateNeedInput {
  nif_nipc: string
  nome_entidade?: string
  data: string
  estado?: EstadoPedido
  urgente: boolean
  items: NewItemInput[]
}

interface PaginatedResponse<T> {
  items: T[]
  total: number
  limit: number
  offset: number
}

interface NeedsStats {
  total: number
  pendentes: number
  aceites: number
  urgentes: number
}

const _useNeeds = () => {
  const { businessNif, isAdmin } = useAuth()
  const needs = useState<Need[]>('needs.list', () => [])
  const needsStats = useState<NeedsStats>('needs.stats', () => ({ total: 0, pendentes: 0, aceites: 0, urgentes: 0 }))

  const pag = usePagination('needs', 25)

  // Backward-compat wrapper
  const needsPagination = computed(() => ({
    total: pag.total.value,
    limit: pag.limit,
    offset: pag.offset.value
  }))
  const institutions = useState<Institution[]>('needs.institutions', () => [])
  const goodsServices = useState<GoodsService[]>('needs.goodsServices', () => [])
  const businesses = useState<Business[]>('needs.businesses', () => [])
  const panels = useState<Panel[]>('needs.panels', () => [DEFAULT_PANEL])
  // Server-side search term for the pedidos list (matches NIF + institution name
  // across the whole dataset, not just the loaded page).
  const needsSearch = useState<string>('needs.search', () => '')

  async function loadNeedsPage(offset: number) {
    const q = needsSearch.value.trim()
    const qs = q ? `&q=${encodeURIComponent(q)}` : ''
    try {
      const res = await $fetch<PaginatedResponse<Need>>(
        `/api/needs?limit=${pag.limit}&offset=${offset}${qs}${pag.sortQs.value}`
      )
      needs.value = res.items ?? []
      pag.total.value = res.total
      pag.offset.value = offset
    } catch (e) {
      console.error('[useNeeds] Failed to load needs page:', e)
    }
  }

  async function searchNeeds(q: string) {
    needsSearch.value = q
    pag.offset.value = 0
    await Promise.all([loadNeedsPage(0), loadNeedsStats(q)])
  }

  async function loadNeedsStats(q?: string) {
    try {
      const qs = q?.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''
      needsStats.value = await $fetch<NeedsStats>(`/api/needs/stats${qs}`)
    } catch (e) {
      console.error('[useNeeds] Failed to load stats:', e)
    }
  }

  // Fetch all data from API — client-only to avoid SSR cookie-forwarding issues
  useAsyncData('needs-initial-data', async () => {
    loadNeedsStats().catch(() => {})
    try {
      const [needsRes, institutionsRes, businessRes, goodsRes] = await Promise.all([
        $fetch<PaginatedResponse<Need>>('/api/needs?limit=25&offset=0'),
        $fetch<PaginatedResponse<Institution>>('/api/institutions?limit=500'),
        // Only admin can hit GET /api/business (list all). Business users load
        // their own record; other roles (institution, patron) get an empty list.
        businessNif.value
          ? $fetch<Business>(`/api/business/${businessNif.value}`)
              .then(b => ({ items: [b], total: 1, limit: 1, offset: 0 }))
              .catch(() => ({ items: [] as Business[], total: 0, limit: 500, offset: 0 }))
          : isAdmin.value
            ? $fetch<PaginatedResponse<Business>>('/api/business?limit=500').catch(() => ({ items: [] as Business[], total: 0, limit: 500, offset: 0 }))
            : Promise.resolve({ items: [] as Business[], total: 0, limit: 500, offset: 0 }),
        $fetch<PaginatedResponse<GoodsService>>('/api/goods-services?limit=500').catch(() => ({ items: [] as GoodsService[], total: 0, limit: 500, offset: 0 }))
      ])

      needs.value = needsRes.items ?? []
      pag.total.value = needsRes.total
      institutions.value = institutionsRes.items ?? []
      businesses.value = businessRes.items ?? []

      const gsMap = new Map<string, GoodsService>()
      for (const g of (goodsRes.items ?? [])) {
        gsMap.set(g.tipo_bem_servico, { tipo_bem_servico: g.tipo_bem_servico, tipo_bem: g.tipo_bem })
      }
      for (const need of (needsRes.items ?? [])) {
        for (const item of need.items) {
          if (!gsMap.has(item.tipo_bem_servico)) {
            gsMap.set(item.tipo_bem_servico, {
              tipo_bem_servico: item.tipo_bem_servico,
              tipo_bem: item.tipo_bem
            })
          }
        }
      }
      goodsServices.value = Array.from(gsMap.values())
    } catch (e) {
      console.error('[useNeeds] Failed to load initial data:', e)
    }
    return null
  }, { server: false })

  if (import.meta.client) {
    watch([pag.sortBy, pag.sortDir], () => {
      loadNeedsPage(0)
    })
  }

  function ensureGoodsService(item: NewItemInput) {
    const exists = goodsServices.value.some(g => g.tipo_bem_servico === item.tipo_bem_servico)
    if (!exists) {
      goodsServices.value.push({ tipo_bem_servico: item.tipo_bem_servico, tipo_bem: item.tipo_bem })
    }
  }

  async function createNeed(input: CreateNeedInput): Promise<Need> {
    input.items.forEach(ensureGoodsService)

    const backendRes = await $fetch<{
      need: { id_pedido: number, nif_nipc: string, estado: string, urgente: boolean, data?: string }
      items: Array<{ id_item: number, id_pedido: number, tipo_bem_servico: string }>
    }>('/api/needs', {
      method: 'POST',
      body: {
        nif_nipc: input.nif_nipc,
        estado: input.estado,
        urgente: input.urgente,
        items: input.items.map(it => ({
          tipo_bem_servico: it.tipo_bem_servico,
          tipo_bem: it.tipo_bem
        }))
      }
    })

    if (!backendRes || !backendRes.need || !backendRes.items) {
      throw new Error('Resposta do servidor inválida ao criar pedido.')
    }

    const items: NeedItem[] = backendRes.items.map(it => ({
      id_item: it.id_item,
      id_pedido: backendRes.need.id_pedido,
      tipo_bem_servico: it.tipo_bem_servico,
      tipo_bem: input.items.find(i => i.tipo_bem_servico === it.tipo_bem_servico)?.tipo_bem ?? 'BEM',
      status: 'available',
      match_tipo: null,
      match_ref: null
    }))

    const need: Need = {
      id_pedido: backendRes.need.id_pedido,
      nif_nipc: backendRes.need.nif_nipc,
      nome_entidade: input.nome_entidade,
      data: backendRes.need.data ?? input.data,
      estado: backendRes.need.estado as EstadoPedido,
      urgente: backendRes.need.urgente,
      items
    }

    needs.value = [need, ...needs.value]
    return need
  }

  async function updateNeedStatus(id: number, estado: EstadoPedido, motivo_recusa?: string) {
    const need = needs.value.find(n => n.id_pedido === id)
    if (!need) return
    need.estado = estado
    if (estado === 'REJEITADO') {
      need.motivo_recusa = motivo_recusa ?? need.motivo_recusa
    } else {
      need.motivo_recusa = undefined
    }

    try {
      await $fetch(`/api/needs/${id}`, {
        method: 'PATCH',
        body: { estado }
      })
    } catch (e) {
      console.error('[useNeeds] Failed to update need status:', e)
    }
  }

  function setItemMatch(id_pedido: number, id_item: number, match_tipo: MatchTipo | null, match_ref: string | null) {
    const need = needs.value.find(n => n.id_pedido === id_pedido)
    if (!need) return
    const item = need.items.find(i => i.id_item === id_item)
    if (!item) return
    item.match_tipo = match_tipo
    item.match_ref = match_ref
    if (match_tipo !== 'NEGOCIO') {
      item.match_business_nif = null
      item.match_business_estado = null
      item.match_business_motivo = null
    }
    if (match_tipo === 'VOUCHER') {
      item.status = 'completed'
    } else if (match_tipo) {
      item.status = 'pending'
    } else {
      item.status = 'available'
    }
  }

  function setBusinessMatch(id_pedido: number, id_item: number, nif: string, label: string) {
    const need = needs.value.find(n => n.id_pedido === id_pedido)
    if (!need) return
    const item = need.items.find(i => i.id_item === id_item)
    if (!item) return
    item.match_tipo = 'NEGOCIO'
    item.match_ref = label
    item.match_business_nif = nif
    item.match_business_estado = 'PENDENTE'
    item.match_business_motivo = null
    item.status = 'pending'
  }

  function setBusinessResponse(id_pedido: number, id_item: number, estado: 'ACEITE' | 'RECUSADO' | 'CONCLUIDO', motivo?: string) {
    const need = needs.value.find(n => n.id_pedido === id_pedido)
    if (!need) return
    const item = need.items.find(i => i.id_item === id_item)
    if (!item || item.match_tipo !== 'NEGOCIO') return
    item.match_business_estado = estado
    item.match_business_motivo = estado === 'RECUSADO' ? (motivo ?? null) : null
    if (estado === 'CONCLUIDO') item.status = 'completed'
    else if (estado === 'RECUSADO') item.status = 'available'
    else item.status = 'pending'

    $fetch(`/api/needs/${id_pedido}/business-response`, {
      method: 'PATCH',
      body: { id_item, estado, motivo: motivo ?? null }
    }).catch(e => console.error('[useNeeds] Failed to persist business response:', e))
  }

  async function approveNeed(id_pedido: number) {
    const need = needs.value.find(n => n.id_pedido === id_pedido)
    if (!need) return
    need.estado = 'ACEITE'
    need.motivo_recusa = undefined
    if (need.urgente) {
      need.items.forEach((it) => {
        if (it.tipo_bem === 'BEM' && !it.match_tipo) {
          it.match_tipo = 'VOUCHER'
          it.match_ref = `VCH-${new Date().getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}`
          it.status = 'completed'
        }
      })
    }

    // Persist which items were allocated to the citizen panel so the panel shows
    // them even when the institution is outside the kiosk's GPS radius.
    const panelItemIds = need.items
      .filter(it => it.match_tipo === 'PAINEL')
      .map(it => it.id_item)

    const businessMatches = need.items
      .filter(it => it.match_tipo === 'NEGOCIO' && it.match_business_nif)
      .map(it => ({
        id_item: it.id_item,
        negocio_nif: it.match_business_nif!,
        negocio_nome: it.match_ref ?? null
      }))

    try {
      await $fetch(`/api/needs/${id_pedido}`, {
        method: 'PATCH',
        body: { estado: 'ACEITE', panelItemIds, businessMatches }
      })
    } catch (e) {
      console.error('[useNeeds] Failed to approve need:', e)
    }
  }

  async function rejectNeed(id_pedido: number, motivo: string) {
    const need = needs.value.find(n => n.id_pedido === id_pedido)
    if (!need) return
    need.estado = 'REJEITADO'
    need.motivo_recusa = motivo

    try {
      await $fetch(`/api/needs/${id_pedido}`, {
        method: 'PATCH',
        body: { estado: 'REJEITADO' }
      })
    } catch (e) {
      console.error('[useNeeds] Failed to reject need:', e)
    }
  }

  interface BackendBusinessCreatePayload {
    entity: {
      nif_nipc: string
      nome_entidade: string
      email_login: string
      password: string
      iban?: string
    }
    business: {
      geo_latitude: number
      geo_longitude: number
      url_certidao_permanente: string
      inicio_atividade: string
    }
    location: {
      codigo_postal: string
      concelho: string
      distrito: string
      freguesia: string
      pais: string
      rua: string
      n_porta: string
    }
    contacts?: Array<{ contacto: string, nome_contacto: string, descricao: string }>
    offers?: Array<{
      tipo_bem_servico: string
      descricao: string
      valor_total: number
      desconto: number
      tipo_bem?: 'bem' | 'servico'
    }>
  }

  async function addBusiness(business: Business) {
    if (businesses.value.some(b => b.resource.nif_nipc === business.resource.nif_nipc)) return
    businesses.value.push(business)
  }

  async function createBusinessRemote(payload: BackendBusinessCreatePayload): Promise<Business> {
    const created = await $fetch<{ nif_nipc: string, offers?: Array<{ id_oferta: number, tipo_bem_servico: string, descricao: string, valor_total: number | string, desconto: number | string }> }>('/api/business', {
      method: 'POST',
      body: payload
    })

    const newBiz: Business = {
      resource: {
        nif_nipc: created.nif_nipc ?? payload.entity.nif_nipc,
        geo_latitude: payload.business.geo_latitude,
        geo_longitude: payload.business.geo_longitude,
        url_certidao_permanente: payload.business.url_certidao_permanente,
        inicio_atividade: payload.business.inicio_atividade
      },
      entity: {
        nif_nipc: payload.entity.nif_nipc,
        nome_entidade: payload.entity.nome_entidade,
        email_login: payload.entity.email_login,
        iban: payload.entity.iban ?? '',
        blocked: false,
        reason: null
      },
      locations: [payload.location],
      contacts: payload.contacts ?? [],
      offers: (created.offers ?? []).map(o => ({
        id_oferta: o.id_oferta,
        negocio_nif_nipc: payload.entity.nif_nipc,
        tipo_bem_servico: o.tipo_bem_servico,
        descricao: o.descricao,
        valor_total: Number(o.valor_total),
        desconto: Number(o.desconto)
      })),
      status: 'ATIVO'
    }
    businesses.value = [...businesses.value, newBiz]
    return newBiz
  }

  async function updateBusiness(nif: string, updater: (b: Business) => Business) {
    const idx = businesses.value.findIndex(b => b.resource.nif_nipc === nif)
    if (idx < 0) return
    const current = businesses.value[idx]!
    const next = updater(current)
    businesses.value.splice(idx, 1, next)

    const entityChanged
      = current.entity.nome_entidade !== next.entity.nome_entidade
        || current.entity.email_login !== next.entity.email_login
        || current.entity.iban !== next.entity.iban
        || current.entity.blocked !== next.entity.blocked
        || current.entity.reason !== next.entity.reason

    const resourceChanged
      = current.resource.geo_latitude !== next.resource.geo_latitude
        || current.resource.geo_longitude !== next.resource.geo_longitude
        || current.resource.url_certidao_permanente !== next.resource.url_certidao_permanente
        || current.resource.inicio_atividade !== next.resource.inicio_atividade

    if (!entityChanged && !resourceChanged) return

    try {
      await $fetch(`/api/business/${nif}`, {
        method: 'PATCH',
        body: {
          ...(entityChanged && {
            entity: {
              nome_entidade: next.entity.nome_entidade,
              email_login: next.entity.email_login,
              iban: next.entity.iban,
              blocked: next.entity.blocked ? 1 : 0,
              reason: next.entity.reason ?? null
            }
          }),
          ...(resourceChanged && {
            business: {
              geo_latitude: next.resource.geo_latitude,
              geo_longitude: next.resource.geo_longitude,
              ...(next.resource.url_certidao_permanente && { url_certidao_permanente: next.resource.url_certidao_permanente }),
              ...(next.resource.inicio_atividade && { inicio_atividade: next.resource.inicio_atividade })
            }
          })
        }
      })
    } catch (e) {
      console.error('[useNeeds] Failed to update business:', e)
      businesses.value.splice(idx, 1, current)
      throw e
    }
  }

  async function setBusinessStatus(nif: string, status: 'ATIVO' | 'SUSPENSO', reason?: string) {
    await updateBusiness(nif, b => ({
      ...b,
      status,
      entity: { ...b.entity, blocked: status === 'SUSPENSO', reason: status === 'SUSPENSO' ? (reason ?? b.entity.reason ?? null) : null }
    }))
  }

  async function removeBusiness(nif: string) {
    const previous = businesses.value
    businesses.value = businesses.value.filter(b => b.resource.nif_nipc !== nif)
    needs.value.forEach((need) => {
      need.items.forEach((item) => {
        if (item.match_tipo === 'NEGOCIO' && item.match_business_nif === nif) {
          item.match_tipo = null
          item.match_ref = null
          item.match_business_nif = null
          item.match_business_estado = null
          item.match_business_motivo = null
          item.status = 'available'
        }
      })
    })

    try {
      await $fetch(`/api/business/${nif}`, { method: 'DELETE' })
    } catch (e) {
      console.error('[useNeeds] Failed to delete business:', e)
      businesses.value = previous
      throw e
    }
  }

  async function addBusinessOffer(nif: string, offer: Omit<BusinessOffer, 'id_oferta' | 'negocio_nif_nipc'> & { tipo_bem?: 'BEM' | 'SERVICO' }) {
    const goods = goodsServices.value.find(g => g.tipo_bem_servico === offer.tipo_bem_servico)
    const tipo_bem = (offer.tipo_bem ?? goods?.tipo_bem ?? 'BEM').toLowerCase()

    const res = await $fetch<{ offer: BusinessOffer }>(`/api/business/${nif}/offers`, {
      method: 'POST',
      body: {
        tipo_bem_servico: offer.tipo_bem_servico,
        descricao: offer.descricao,
        valor_total: offer.valor_total,
        desconto: offer.desconto,
        tipo_bem
      }
    })

    const created: BusinessOffer = {
      id_oferta: res.offer.id_oferta,
      negocio_nif_nipc: nif,
      tipo_bem_servico: res.offer.tipo_bem_servico,
      descricao: res.offer.descricao,
      valor_total: Number(res.offer.valor_total),
      desconto: Number(res.offer.desconto)
    }

    const idx = businesses.value.findIndex(b => b.resource.nif_nipc === nif)
    if (idx >= 0) {
      const current = businesses.value[idx]!
      businesses.value.splice(idx, 1, { ...current, offers: [...current.offers, created] })
    }
    return created
  }

  async function removeBusinessOffer(nif: string, idOferta: number) {
    const idx = businesses.value.findIndex(b => b.resource.nif_nipc === nif)
    const previous = idx >= 0 ? businesses.value[idx] : null
    if (idx >= 0 && previous) {
      businesses.value.splice(idx, 1, { ...previous, offers: previous.offers.filter(o => o.id_oferta !== idOferta) })
    }

    try {
      await $fetch(`/api/business/${nif}/offers/${idOferta}`, { method: 'DELETE' })
    } catch (e) {
      console.error('[useNeeds] Failed to delete offer:', e)
      if (idx >= 0 && previous) businesses.value.splice(idx, 1, previous)
      throw e
    }
  }

  async function updateBusinessOffer(nif: string, idOferta: number, patch: Partial<Pick<BusinessOffer, 'descricao' | 'valor_total' | 'desconto'>>) {
    const idx = businesses.value.findIndex(b => b.resource.nif_nipc === nif)
    if (idx < 0) return
    const current = businesses.value[idx]!
    const next = {
      ...current,
      offers: current.offers.map(o => o.id_oferta === idOferta ? { ...o, ...patch } : o)
    }
    businesses.value.splice(idx, 1, next)

    try {
      await $fetch(`/api/business/${nif}/offers/${idOferta}`, {
        method: 'PATCH',
        body: patch
      })
    } catch (e) {
      console.error('[useNeeds] Failed to update offer:', e)
      businesses.value.splice(idx, 1, current)
      throw e
    }
  }

  return {
    needs,
    needsPagination,
    needsStats,
    page: pag.page,
    sortBy: pag.sortBy,
    sortDir: pag.sortDir,
    setSort: pag.setSort,
    loadNeedsPage,
    searchNeeds,
    needsSearch,
    institutions,
    goodsServices,
    businesses,
    panels,
    createNeed,
    updateNeedStatus,
    setItemMatch,
    setBusinessMatch,
    setBusinessResponse,
    approveNeed,
    rejectNeed,
    addBusiness,
    createBusinessRemote,
    updateBusiness,
    setBusinessStatus,
    removeBusiness,
    addBusinessOffer,
    removeBusinessOffer,
    updateBusinessOffer
  }
}

export const useNeeds = createSharedComposable(_useNeeds)
