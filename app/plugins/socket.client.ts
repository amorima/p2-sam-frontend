export default defineNuxtPlugin(() => {
  const session = useCookie<{ accessToken?: string } | null>('auth-session')
  const { connect, disconnect } = useNotifications()

  // Connect immediately with whatever token is available
  connect(session.value?.accessToken)

  // Re-connect when the session changes (login / logout)
  watch(
    () => session.value?.accessToken,
    (token) => {
      disconnect()
      if (token !== undefined) {
        connect(token)
      }
    }
  )
})
