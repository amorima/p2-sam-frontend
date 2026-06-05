import { createSharedComposable } from '@vueuse/core'
import {
  LEAD_PIN_VALIDITY_HOURS,
  type Lead,
  type SmartLocker
} from '~/utils/domain'
import { usePagination } from './usePagination'

const HOUR = 3_600_000

interface PaginatedResponse<T> {
  items: T[]
  total: number
  limit: number
  offset: number
}

interface LeadsStats {
  total: number
  entregues: number
  pendentes: number
  expirados: number
  expiraBreve: number
}

const _useLeads = () => {
  const leads = useState<Lead[]>('leads.list', () => [])
  const smartLockers = useState<SmartLocker[]>('leads.smartLockers', () => [])
  const leadsStats = useState<LeadsStats>('leads.stats', () => ({ total: 0, entregues: 0, pendentes: 0, expirados: 0, expiraBreve: 0 }))

  const pag = usePagination('leads', 25)

  // Backward-compat wrapper so pages using leadsPagination.value.{total,limit,offset} still work
  const leadsPagination = computed(() => ({
    total: pag.total.value,
    limit: pag.limit,
    offset: pag.offset.value
  }))

  const fetchLeads = async (offset = 0) => {
    try {
      const data = await $fetch<PaginatedResponse<Lead>>(
        `/api/leads?limit=${pag.limit}&offset=${offset}${pag.sortQs.value}`
      )
      leads.value = data.items ?? []
      pag.total.value = data.total
      pag.offset.value = offset
    } catch (e) {
      console.error('[useLeads] Failed to load leads:', e)
    }
  }

  const fetchLeadsStats = async () => {
    try {
      leadsStats.value = await $fetch<LeadsStats>('/api/leads/stats')
    } catch (e) {
      console.error('[useLeads] Failed to load stats:', e)
    }
  }

  async function loadLeadsPage(offset: number) {
    await fetchLeads(offset)
  }

  // Initial load (client-only)
  useAsyncData('leads-initial-data', () => Promise.all([fetchLeads(0), fetchLeadsStats()]), { server: false })

  // Poll every 30 seconds
  if (import.meta.client) {
    const interval = setInterval(
      () => Promise.all([fetchLeads(pag.offset.value), fetchLeadsStats()]),
      30000
    )
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
    leadsStats,
    page: pag.page,
    sortBy: pag.sortBy,
    sortDir: pag.sortDir,
    setSort: pag.setSort,
    loadLeadsPage,
    effectiveEstado,
    expiresAt,
    hoursRemaining
  }
}

export const useLeads = createSharedComposable(_useLeads)
