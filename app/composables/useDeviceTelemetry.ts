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
}

export interface DeviceTelemetrySample {
  bateria_estado: number
  cpu_temperatura: number
  dnb_sinal: number
  aviso: string | null
  evento: string
  versao: string
  status: { sensor_porta: string, numpad: string }
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
  const tempBaseline = 42 + Math.random() * 4
  const tempOffset = ref(0)
  let tempJitterTimer: ReturnType<typeof setInterval> | null = null

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

  const sample = (): DeviceTelemetrySample => {
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

    return {
      bateria_estado,
      cpu_temperatura,
      dnb_sinal,
      aviso,
      evento: aviso ? 'warn' : 'ping',
      versao: APP_VERSION,
      status: { sensor_porta: 'fechado', numpad: 'ok' }
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
