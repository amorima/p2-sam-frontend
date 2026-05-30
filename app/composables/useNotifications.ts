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
  let socket: Socket | null = null

  const unreadCount = computed(() =>
    notifications.value.filter(n => !n.lida).length
  )

  function addNotification(n: AppNotification) {
    // Prevent duplicates by _id
    if (!notifications.value.find(x => x._id === n._id)) {
      notifications.value.unshift(n)
    }
  }

  async function loadHistory() {
    try {
      const data = await $fetch<AppNotification[]>('/api/notifications/inbox')
      // Merge without duplicates, history goes after any already-received live ones
      for (const n of data) {
        if (!notifications.value.find(x => x._id === n._id)) {
          notifications.value.push(n)
        }
      }
    } catch { /* non-fatal */ }
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
    if (socket?.connected) return

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
      loadHistory()
    })

    socket.on('disconnect', () => {
      connected.value = false
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
    unreadCount,
    connect,
    disconnect,
    sendTelemetry,
    markAsRead,
    markAllAsRead
  }
}

export const useNotifications = createSharedComposable(_useNotifications)
