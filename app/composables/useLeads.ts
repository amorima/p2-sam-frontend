import { createSharedComposable } from '@vueuse/core'
import {
  LEAD_PIN_VALIDITY_HOURS,
  type Lead,
  type SmartLocker
} from '~/utils/domain'

const HOUR = 3_600_000

const _useLeads = () => {
  const leads = useState<Lead[]>('leads.list', () => [])
  const smartLockers = useState<SmartLocker[]>('leads.smartLockers', () => [])

  const fetchLeads = async () => {
    try {
      const data = await $fetch<Lead[]>('/api/leads')
      leads.value = data ?? []
    } catch (e) {
      console.error('[useLeads] Failed to load leads:', e)
    }
  }

  // Initial load (client-only — no SSR needed for admin dashboard)
  useAsyncData('leads-initial-data', fetchLeads, { server: false })

  // Poll every 30 seconds so new leads from the panel appear automatically
  if (import.meta.client) {
    const interval = setInterval(fetchLeads, 30000)
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
    effectiveEstado,
    expiresAt,
    hoursRemaining
  }
}

export const useLeads = createSharedComposable(_useLeads)
