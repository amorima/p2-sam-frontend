export type UserRole = 'admin' | 'patron' | 'institution' | 'business'

export interface AuthState {
  role: UserRole
  patronNif: string
  patronName: string
  institutionNif: string
  institutionName: string
  businessNif: string
  businessName: string
}

export function useAuth() {
  const role = useState<UserRole>('auth.role', () => 'admin')
  const patronNif = useState<string>('auth.patronNif', () => '')
  const patronName = useState<string>('auth.patronName', () => '')
  const institutionNif = useState<string>('auth.institutionNif', () => '')
  const institutionName = useState<string>('auth.institutionName', () => '')
  const businessNif = useState<string>('auth.businessNif', () => '')
  const businessName = useState<string>('auth.businessName', () => '')

  const isAdmin = computed(() => role.value === 'admin')
  const isPatron = computed(() => role.value === 'patron')
  const isInstitution = computed(() => role.value === 'institution')
  const isBusiness = computed(() => role.value === 'business')

  function setRole(newRole: UserRole, nif = '', name = '') {
    role.value = newRole
    patronNif.value = ''
    patronName.value = ''
    institutionNif.value = ''
    institutionName.value = ''
    businessNif.value = ''
    businessName.value = ''
    if (newRole === 'patron') {
      patronNif.value = nif
      patronName.value = name
    } else if (newRole === 'institution') {
      institutionNif.value = nif
      institutionName.value = name
    } else if (newRole === 'business') {
      businessNif.value = nif
      businessName.value = name
    }
  }

  return {
    role,
    patronNif,
    patronName,
    institutionNif,
    institutionName,
    businessNif,
    businessName,
    isAdmin,
    isPatron,
    isInstitution,
    isBusiness,
    setRole
  }
}
