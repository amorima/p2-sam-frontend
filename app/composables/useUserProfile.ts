export const useUserProfile = () => {
  const authCookie = useCookie<import('./useAuth').AuthSession | null>('auth-session')

  // Name always reflects the account name from the auth session
  const name = computed(() => authCookie.value?.name ?? 'Utilizador')

  const avatar = useState<string>('user-profile-avatar', () => {
    const pic = authCookie.value?.profile_pic
    return pic ? `/api/download/avatar?nome=${encodeURIComponent(pic)}` : '/user.svg'
  })

  function toProxyUrl(fileName: string) {
    return `/api/download/avatar?nome=${encodeURIComponent(fileName)}`
  }

  function loadStoredAvatar() {
    if (!import.meta.client) return
    const session = authCookie.value
    if (!session) return

    // DB value (stored in auth session cookie after login) takes priority
    if (session.profile_pic) {
      avatar.value = toProxyUrl(session.profile_pic)
      return
    }

    // localStorage as fallback (for admin or first login before DB is updated)
    if (session.nif) {
      const cached = localStorage.getItem(`sam_avatar_${session.nif}`)
      if (cached) avatar.value = toProxyUrl(cached)
    }
  }

  // updateAvatar receives the fileName returned by the upload endpoint
  function updateAvatar(fileName: string) {
    avatar.value = toProxyUrl(fileName)

    const session = authCookie.value
    if (!import.meta.client || !session) return

    // Cache in localStorage
    if (session.nif) {
      localStorage.setItem(`sam_avatar_${session.nif}`, fileName)
    }

    // Persist in DB (not needed for admin who has no entity row)
    if (session.role !== 'admin') {
      $fetch('/api/auth/profile-pic', {
        method: 'PATCH',
        body: { profile_pic: fileName }
      }).then(() => {
        // Keep cookie in sync so next load doesn't need localStorage fallback
        if (authCookie.value) {
          authCookie.value = { ...authCookie.value, profile_pic: fileName }
        }
      }).catch(console.error)
    }
  }

  onMounted(loadStoredAvatar)

  return { name, avatar, updateAvatar }
}
