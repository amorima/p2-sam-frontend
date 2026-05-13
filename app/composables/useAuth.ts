export type UserRole = 'admin' | 'patron'

export interface AuthState {
  role: UserRole
  patronNif: string
  patronName: string
}

export function useAuth() {
  const role = useState<UserRole>('auth.role', () => 'admin')
  const patronNif = useState<string>('auth.patronNif', () => '')
  const patronName = useState<string>('auth.patronName', () => '')

  const isAdmin = computed(() => role.value === 'admin')
  const isPatron = computed(() => role.value === 'patron')

  function setRole(newRole: UserRole, nif = '', name = '') {
    role.value = newRole
    patronNif.value = nif
    patronName.value = name
  }

  return { role, patronNif, patronName, isAdmin, isPatron, setRole }
}
