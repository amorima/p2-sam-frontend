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

  // updateAvatar receives the fileName returned by whichever upload endpoint was used.
  // DB persistence is handled server-side by `PATCH /api/auth/avatar` for entity users;
  // for admins (no entity row) the avatar lives in localStorage only.
  function updateAvatar(fileName: string) {
    avatar.value = toProxyUrl(fileName)

    const session = authCookie.value
    if (!import.meta.client || !session) return

    if (session.nif) {
      localStorage.setItem(`sam_avatar_${session.nif}`, fileName)
    }

    if (session.role !== 'admin') {
      authCookie.value = { ...session, profile_pic: fileName }
    }
  }

  // React to account switches (login/logout) — nif changes when a different
  // account is loaded, so watching it is sufficient to reload the avatar.
  watch(
    () => authCookie.value?.nif,
    () => { if (import.meta.client) loadStoredAvatar() },
    { immediate: true }
  )

  return { name, avatar, updateAvatar }
}
