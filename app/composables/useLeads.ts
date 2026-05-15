import { createSharedComposable } from '@vueuse/core'
import {
  mockLeads,
  mockSmartLockers,
  LEAD_PIN_VALIDITY_HOURS,
  type Lead,
  type SmartLocker
} from '~/utils/mockData'

const HOUR = 3_600_000

const _useLeads = () => {
  const leads = useState<Lead[]>('leads.list', () => [...mockLeads])
  const smartLockers = useState<SmartLocker[]>('leads.smartLockers', () => [...mockSmartLockers])

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
