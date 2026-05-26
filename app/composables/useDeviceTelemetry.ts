interface BatteryManager extends EventTarget {
  level: number
  charging: boolean
  chargingTime: number
  dischargingTime: number
}

interface NavigatorWithBattery extends Navigator {
  getBattery?: () => Promise<BatteryManager>
}

interface NetworkInformation extends EventTarget {
  effectiveType?: '2g' | '3g' | '4g' | 'slow-2g'
  downlink?: number
  rtt?: number
  saveData?: boolean
  type?: string
}

interface NavigatorWithConnection extends Navigator {
  connection?: NetworkInformation
  mozConnection?: NetworkInformation
  webkitConnection?: NetworkInformation
  deviceMemory?: number
}

interface PerformanceWithMemory extends Performance {
  memory?: {
    usedJSHeapSize: number
    totalJSHeapSize: number
    jsHeapSizeLimit: number
  }
}

export interface DeviceInfo {
  platform: string | null
  user_agent: string | null
  language: string | null
  timezone: string | null
  hardware_concurrency: number | null
  device_memory_gb: number | null
  screen_resolution: string | null
  viewport: string | null
  pixel_ratio: number | null
  online: boolean | null
  connection_type: string | null
  connection_downlink_mbps: number | null
  connection_rtt_ms: number | null
  save_data: boolean | null
  battery_charging: boolean | null
  battery_level_pct: number | null
  jsheap_used_mb: number | null
  jsheap_total_mb: number | null
  uptime_seconds: number
  visibility: string | null
}

export interface DeviceTelemetrySample {
  bateria_estado: number
  cpu_temperatura: number
  dnb_sinal: number
  aviso: string | null
  evento: string
  versao: string
  status: { sensor_porta: string, numpad: string }
  device: DeviceInfo
}

const APP_VERSION = '1.0.0'

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function signalFromConnection(c?: NetworkInformation): number {
  if (!c?.effectiveType) return 4
  switch (c.effectiveType) {
    case 'slow-2g': return 1
    case '2g': return 2
    case '3g': return 3
    case '4g': return 4
  }
  return 4
}

export function useDeviceTelemetry() {
  const battery = ref<BatteryManager | null>(null)
  // CPU temp não é acessível via APIs de browser — mantemos uma estimativa.
  const tempBaseline = 42 + Math.random() * 4
  const tempOffset = ref(0)
  let tempJitterTimer: ReturnType<typeof setInterval> | null = null
  const bootTimestamp = import.meta.client ? performance.now() : 0

  const setupBattery = async () => {
    if (!import.meta.client) return
    const nav = navigator as NavigatorWithBattery
    if (typeof nav.getBattery !== 'function') return
    try {
      battery.value = await nav.getBattery()
    } catch { /* not supported */ }
  }

  const startTempSim = () => {
    if (!import.meta.client || tempJitterTimer) return
    tempJitterTimer = setInterval(() => {
      const delta = (Math.random() - 0.5) * 1.5
      tempOffset.value = clamp(tempOffset.value + delta, -6, 8)
    }, 4000)
  }

  const stopTempSim = () => {
    if (tempJitterTimer) {
      clearInterval(tempJitterTimer)
      tempJitterTimer = null
    }
  }

  const collectDevice = (): DeviceInfo => {
    if (!import.meta.client) {
      return {
        platform: null, user_agent: null, language: null, timezone: null,
        hardware_concurrency: null, device_memory_gb: null,
        screen_resolution: null, viewport: null, pixel_ratio: null,
        online: null, connection_type: null,
        connection_downlink_mbps: null, connection_rtt_ms: null, save_data: null,
        battery_charging: null, battery_level_pct: null,
        jsheap_used_mb: null, jsheap_total_mb: null,
        uptime_seconds: 0, visibility: null,
      }
    }

    const nav = navigator as NavigatorWithConnection
    const conn = nav.connection ?? nav.mozConnection ?? nav.webkitConnection
    const perf = performance as PerformanceWithMemory
    const mem = perf.memory

    return {
      platform: navigator.platform || null,
      user_agent: navigator.userAgent || null,
      language: navigator.language || null,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || null,
      hardware_concurrency: navigator.hardwareConcurrency ?? null,
      device_memory_gb: nav.deviceMemory ?? null,
      screen_resolution: `${window.screen.width}x${window.screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      pixel_ratio: window.devicePixelRatio ?? null,
      online: navigator.onLine,
      connection_type: conn?.effectiveType ?? conn?.type ?? null,
      connection_downlink_mbps: conn?.downlink ?? null,
      connection_rtt_ms: conn?.rtt ?? null,
      save_data: conn?.saveData ?? null,
      battery_charging: battery.value?.charging ?? null,
      battery_level_pct: battery.value
        ? Math.round(clamp(battery.value.level * 100, 0, 100))
        : null,
      jsheap_used_mb: mem ? Math.round(mem.usedJSHeapSize / 1048576) : null,
      jsheap_total_mb: mem ? Math.round(mem.totalJSHeapSize / 1048576) : null,
      uptime_seconds: Math.round((performance.now() - bootTimestamp) / 1000),
      visibility: document.visibilityState || null,
    }
  }

  const sample = (): DeviceTelemetrySample => {
    const device = collectDevice()

    let bateria_estado = 100
    if (battery.value) {
      bateria_estado = Math.round(clamp(battery.value.level * 100, 0, 100))
    } else if (import.meta.client) {
      bateria_estado = 80 + Math.floor(Math.random() * 20)
    }

    const cpu_temperatura = Math.round(clamp(tempBaseline + tempOffset.value, 30, 95))

    let dnb_sinal = 4
    if (import.meta.client) {
      const nav = navigator as NavigatorWithConnection
      dnb_sinal = signalFromConnection(nav.connection ?? nav.mozConnection ?? nav.webkitConnection)
    }

    let aviso: string | null = null
    if (bateria_estado < 20) aviso = 'bateria baixa'
    else if (cpu_temperatura > 80) aviso = 'temperatura elevada'
    else if (dnb_sinal === 0) aviso = 'sem sinal'
    else if (device.online === false) aviso = 'offline'

    return {
      bateria_estado,
      cpu_temperatura,
      dnb_sinal,
      aviso,
      evento: aviso ? 'warn' : 'ping',
      versao: APP_VERSION,
      status: { sensor_porta: 'fechado', numpad: 'ok' },
      device,
    }
  }

  const init = async () => {
    await setupBattery()
    startTempSim()
  }

  const dispose = () => {
    stopTempSim()
  }

  return { init, dispose, sample }
}
