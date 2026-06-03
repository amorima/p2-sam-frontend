import { createSharedComposable } from '@vueuse/core'
import {
  LEAD_PIN_VALIDITY_HOURS,
  type Lead,
  type SmartLocker
} from '~/utils/domain'

const HOUR = 3_600_000

interface PaginationMeta {
  total: number
  limit: number
  offset: number
}

interface PaginatedResponse<T> {
  items: T[]
  total: number
  limit: number
  offset: number
}

const _useLeads = () => {
  const leads = useState<Lead[]>('leads.list', () => [])
  const smartLockers = useState<SmartLocker[]>('leads.smartLockers', () => [])
  const leadsPagination = useState<PaginationMeta>('leads.pagination', () => ({ total: 0, limit: 25, offset: 0 }))

  const fetchLeads = async (offset = 0) => {
    const limit = leadsPagination.value.limit
    try {
      const data = await $fetch<PaginatedResponse<Lead>>(`/api/leads?limit=${limit}&offset=${offset}`)
      leads.value = data.items ?? []
      leadsPagination.value = { total: data.total, limit: data.limit, offset: data.offset }
    } catch (e) {
      console.error('[useLeads] Failed to load leads:', e)
    }
  }

  async function loadLeadsPage(offset: number) {
    await fetchLeads(offset)
  }

  // Initial load (client-only — no SSR needed for admin dashboard)
  useAsyncData('leads-initial-data', () => fetchLeads(0), { server: false })

  // Poll every 30 seconds so new leads from the panel appear automatically
  if (import.meta.client) {
    const interval = setInterval(() => fetchLeads(leadsPagination.value.offset), 30000)
    onScopeDispose(() => clearInterval(interval))
  }

  function effectiveEstado(lead: Lead): 'PENDENTE' | 'ENTREGUE' | 'EXPIRADO' {
    if (lead.estado === 'ENTREGUE') return 'ENTREGUE'
    const created = new Date(lead.data).getTime()
    const expiresAt = created + LEAD_PIN_VALIDITY_HOURS * HOUR
    if (Date.now() > expiresAt) return 'EXPIRADO'
    return lead.estado
  }

  function expiresAt(lead: Lead): Date {
    return new Date(new Date(lead.data).getTime() + LEAD_PIN_VALIDITY_HOURS * HOUR)
  }

  function hoursRemaining(lead: Lead): number {
    return Math.max(0, (expiresAt(lead).getTime() - Date.now()) / HOUR)
  }

  return {
    leads,
    smartLockers,
    leadsPagination,
    loadLeadsPage,
    effectiveEstado,
    expiresAt,
    hoursRemaining
  }
}

export const useLeads = createSharedComposable(_useLeads)
