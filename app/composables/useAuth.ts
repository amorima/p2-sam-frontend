export type UserRole = 'admin' | 'patron' | 'institution'

export interface AuthState {
  role: UserRole
  patronNif: string
  patronName: string
  institutionNif: string
  institutionName: string
}

export function useAuth() {
  const role = useState<UserRole>('auth.role', () => 'admin')
  const patronNif = useState<string>('auth.patronNif', () => '')
  const patronName = useState<string>('auth.patronName', () => '')
  const institutionNif = useState<string>('auth.institutionNif', () => '')
  const institutionName = useState<string>('auth.institutionName', () => '')

  const isAdmin = computed(() => role.value === 'admin')
  const isPatron = computed(() => role.value === 'patron')
  const isInstitution = computed(() => role.value === 'institution')

  function setRole(newRole: UserRole, nif = '', name = '') {
    role.value = newRole
    if (newRole === 'patron') {
      patronNif.value = nif
      patronName.value = name
      institutionNif.value = ''
      institutionName.value = ''
    } else if (newRole === 'institution') {
      institutionNif.value = nif
      institutionName.value = name
      patronNif.value = ''
      patronName.value = ''
    } else {
      patronNif.value = ''
      patronName.value = ''
      institutionNif.value = ''
      institutionName.value = ''
    }
  }

  return {
    role,
    patronNif,
    patronName,
    institutionNif,
    institutionName,
    isAdmin,
    isPatron,
    isInstitution,
    setRole
  }
}
