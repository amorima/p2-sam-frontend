export default defineNuxtPlugin(() => {
  const session = useCookie<{ accessToken?: string } | null>('auth-session')
  const { connect, disconnect } = useNotifications()

  // Only connect when the user has a valid session — the socket needs auth
  // to join the right room and to call loadHistory (which needs a JWT).
  // The panel kiosk manages its own unauthenticated socket via painel.vue.
  if (session.value?.accessToken) {
    connect(session.value.accessToken)
  }

  // Reconnect/disconnect when the session changes (login / logout)
  watch(
    () => session.value?.accessToken,
    (token) => {
      disconnect()
      if (token) connect(token)
    }
  )
})
