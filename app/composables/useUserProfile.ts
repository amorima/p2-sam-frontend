export const useUserProfile = () => {
  const authCookie = useCookie<{ nif: string; name: string } | null>('auth-session')

  // Always reflects the account name stored in the auth session
  const name = computed(() => authCookie.value?.name ?? 'Utilizador')

  // Avatar persisted in localStorage, keyed by user NIF so different users don't share it
  const avatar = useState<string>('user-profile-avatar', () => '/user.svg')

  function loadStoredAvatar() {
    if (!import.meta.client || !authCookie.value?.nif) return
    const stored = localStorage.getItem(`sam_avatar_${authCookie.value.nif}`)
    avatar.value = stored ?? '/user.svg'
  }

  function updateAvatar(url: string) {
    avatar.value = url
    if (import.meta.client && authCookie.value?.nif) {
      localStorage.setItem(`sam_avatar_${authCookie.value.nif}`, url)
    }
  }

  function clearAvatar() {
    avatar.value = '/user.svg'
    if (import.meta.client && authCookie.value?.nif) {
      localStorage.removeItem(`sam_avatar_${authCookie.value.nif}`)
    }
  }

  onMounted(loadStoredAvatar)

  return { name, avatar, updateAvatar, clearAvatar }
}
