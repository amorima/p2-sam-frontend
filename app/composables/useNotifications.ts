import { io, type Socket } from 'socket.io-client'
import { createSharedComposable } from '@vueuse/core'

export interface AppNotification {
  _id: string
  tipo: string
  titulo: string
  corpo: string
  destinatario: string
  data_envio: string
  lida: boolean
  payload?: Record<string, unknown>
}

export interface TelemetryFrame {
  locker_id?: number
  bateria_estado?: number
  cpu_temperatura?: number
  dnb_sinal?: number
  aviso?: string | null
  evento?: string
  timestamp?: string
  [key: string]: unknown
}

const _useNotifications = () => {
  const config = useRuntimeConfig()

  const notifications = ref<AppNotification[]>([])
  const latestTelemetry = ref<TelemetryFrame | null>(null)
  const connected = ref(false)
  const loading = ref(false)
  let socket: Socket | null = null
  // Track whether we have an authenticated connection so loadHistory
  // only runs when there is actually a user session to query.
  let authed = false

  const unreadCount = computed(() =>
    notifications.value.filter(n => !n.lida).length
  )

  function addNotification(n: AppNotification) {
    if (!n?._id) return
    // Update in-place if already present (e.g. telemetry upsert), else prepend
    const idx = notifications.value.findIndex(x => x._id === n._id)
    if (idx !== -1) {
      notifications.value[idx] = n
    } else {
      notifications.value.unshift(n)
    }
  }

  /**
   * Load notification history from MongoDB via the REST API.
   * Can be called explicitly (e.g. on inbox mount) or implicitly on socket connect.
   * No-ops silently when the user is not authenticated.
   */
  async function loadHistory() {
    if (!authed) return
    loading.value = true
    try {
      const data = await $fetch<AppNotification[]>('/api/notifications/inbox')
      for (const n of data) {
        const idx = notifications.value.findIndex(x => x._id === n._id)
        if (idx !== -1) {
          notifications.value[idx] = n
        } else {
          notifications.value.push(n)
        }
      }
    } catch (e) {
      console.warn('[notifications] loadHistory failed:', e)
    } finally {
      loading.value = false
    }
  }

  async function markAsRead(id: string) {
    const n = notifications.value.find(x => x._id === id)
    if (!n || n.lida) return
    n.lida = true
    try {
      await $fetch(`/api/notifications/${id}/read`, { method: 'PATCH' })
    } catch {
      n.lida = false
    }
  }

  async function markAllAsRead() {
    notifications.value.forEach((n) => {
      n.lida = true
    })
    try {
      await $fetch('/api/notifications/read-all', { method: 'PATCH' })
    } catch {
      notifications.value.forEach((n) => {
        n.lida = false
      })
    }
  }

  function connect(token?: string) {
    // Don't reconnect if already connected with the same auth state
    if (socket?.connected && authed === !!token) return

    // Disconnect any existing socket before creating a new one
    if (socket) {
      socket.disconnect()
      socket = null
      connected.value = false
    }

    authed = !!token
    const backendUrl = config.public.backendBase as string

    socket = io(backendUrl, {
      auth: token ? { token } : {},
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 10
    })

    socket.on('connect', () => {
      connected.value = true
      // Load history from MongoDB on every (re)connect
      loadHistory()
    })

    socket.on('disconnect', () => {
      connected.value = false
    })

    socket.on('connect_error', (err) => {
      console.warn('[notifications] socket connect error:', err.message)
    })

    socket.on('notification:new', (notif: AppNotification) => {
      addNotification(notif)
    })

    socket.on('telemetry:update', (frame: TelemetryFrame) => {
      latestTelemetry.value = frame
    })
  }

  function disconnect() {
    socket?.disconnect()
    socket = null
    connected.value = false
    authed = false
  }

  // Send telemetry frame via WebSocket (used by the panel kiosk)
  function sendTelemetry(data: TelemetryFrame, ack?: (res: { ok: boolean }) => void) {
    if (!socket?.connected) return false
    socket.emit('telemetry:send', data, ack)
    return true
  }

  return {
    notifications,
    latestTelemetry,
    connected,
    loading,
    unreadCount,
    connect,
    disconnect,
    sendTelemetry,
    markAsRead,
    markAllAsRead,
    loadHistory
  }
}

export const useNotifications = createSharedComposable(_useNotifications)
