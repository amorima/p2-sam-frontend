export type UserRole = 'admin' | 'patron' | 'institution' | 'business'

export interface AuthSession {
  role: UserRole
  nif: string
  name: string
  accessToken?: string
  refreshToken?: string
}

export function useAuth() {
  const session = useCookie<AuthSession | null>('auth-session', {
    default: () => null,
    maxAge: 60 * 60 * 24 * 7,
    sameSite: 'lax'
  })

  const role = useState<UserRole>('auth.role', () => session.value?.role ?? 'admin')
  const patronNif = useState<string>('auth.patronNif', () => (session.value?.role === 'patron' ? session.value.nif : ''))
  const patronName = useState<string>('auth.patronName', () => (session.value?.role === 'patron' ? session.value.name : ''))
  const institutionNif = useState<string>('auth.institutionNif', () => (session.value?.role === 'institution' ? session.value.nif : ''))
  const institutionName = useState<string>('auth.institutionName', () => (session.value?.role === 'institution' ? session.value.name : ''))
  const businessNif = useState<string>('auth.businessNif', () => (session.value?.role === 'business' ? session.value.nif : ''))
  const businessName = useState<string>('auth.businessName', () => (session.value?.role === 'business' ? session.value.name : ''))

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

  async function login(nif_nipc: string, password: string, loginRole: UserRole) {
    const result = await $fetch<AuthSession>('/api/auth/login', {
      method: 'POST',
      body: { nif_nipc, password, role: loginRole }
    })
    session.value = result
    setRole(result.role, result.nif, result.name)

    // Sync display name in profile
    const profile = useState<{ name: string, avatar: string }>('user-profile')
    if (profile.value && result.name) {
      profile.value.name = result.name
    }

    return result
  }

  async function logout() {
    session.value = null
    setRole('admin')
    const profile = useState<{ name: string, avatar: string }>('user-profile')
    if (profile.value) {
      profile.value.name = 'António Amorim'
    }
    await navigateTo('/login')
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
    setRole,
    login,
    logout
  }
}
