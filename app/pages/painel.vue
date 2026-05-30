<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const config = useRuntimeConfig()

definePageMeta({
  layout: false
})

// ID do cacifo de testes no backend (locker_id usado em locker_telemetry)
const PANEL_LOCKER_ID = 1

const panelLat = ref<number | null>(null)
const panelLng = ref<number | null>(null)

const panelCoords = computed(() => {
  if (panelLat.value == null || panelLng.value == null) return 'A detetar localização…'
  const latStr = `${Math.abs(panelLat.value).toFixed(4)}°${panelLat.value >= 0 ? 'N' : 'S'}`
  const lngStr = `${Math.abs(panelLng.value).toFixed(4)}°${panelLng.value >= 0 ? 'E' : 'W'}`
  return `${latStr} · ${lngStr}`
})

interface NeedGood {
  id_item: number
  id_pedido: number
  tipo_bem_servico: string
  nome_entidade: string
}

interface WeatherData {
  temp: number
  description: string
  humidity: number
  windSpeed: number
  icon: string
}

const screen = ref<'panel' | 'donate'>('panel')
const selectedGoodId = ref('')
const donorName = ref('')
const donorEmail = ref('')
const pin = ref('')
const weatherData = ref<WeatherData>({
  temp: 18,
  description: 'Parcialmente nublado',
  humidity: 65,
  windSpeed: 12,
  icon: '02d'
})
const thanksOpen = ref(false)
const currentTime = ref('')
const currentDate = ref('')
const now = ref(new Date())
const isSubmitting = ref(false)
const submitError = ref('')

let modalTimerId: ReturnType<typeof setTimeout> | null = null
let resetTimerId: ReturnType<typeof setTimeout> | null = null
let clockInterval: ReturnType<typeof setInterval> | null = null
let telemetryInterval: ReturnType<typeof setInterval> | null = null

// ── Goods from backend ────────────────────────────────────────────────────────
const { data: goodsData, refresh: refreshGoods } = useFetch<{ goods: NeedGood[] }>('/api/painel/goods', {
  server: false,
  query: { lat: panelLat, lng: panelLng },
  watch: false
})
const goods = computed<NeedGood[]>(() => goodsData.value?.goods ?? [])
const selectedGood = computed(() => goods.value.find(g => String(g.id_item) === selectedGoodId.value) ?? null)

const emailIsValid = computed(() =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(donorEmail.value.trim())
)

const isDonateEnabled = computed(() => {
  return (
    selectedGoodId.value.length > 0
    && donorName.value.trim().length > 0
    && emailIsValid.value
    && !isSubmitting.value
  )
})

const weatherIcon = computed(() => {
  const iconMap: Record<string, string> = {
    '01d': 'i-fa6-solid-sun',
    '01n': 'i-fa6-solid-moon',
    '02d': 'i-fa6-solid-cloud-sun',
    '02n': 'i-fa6-solid-cloud-moon',
    '03d': 'i-fa6-solid-cloud',
    '03n': 'i-fa6-solid-cloud',
    '04d': 'i-fa6-solid-cloud',
    '04n': 'i-fa6-solid-cloud',
    '09d': 'i-fa6-solid-cloud-rain',
    '09n': 'i-fa6-solid-cloud-rain',
    '10d': 'i-fa6-solid-cloud-rain',
    '10n': 'i-fa6-solid-cloud-rain',
    '11d': 'i-fa6-solid-cloud-bolt',
    '11n': 'i-fa6-solid-cloud-bolt',
    '13d': 'i-fa6-solid-snowflake',
    '13n': 'i-fa6-solid-snowflake',
    '50d': 'i-fa6-solid-smog',
    '50n': 'i-fa6-solid-smog'
  }
  return iconMap[weatherData.value.icon] || 'i-fa6-solid-cloud-sun'
})

const updateClock = () => {
  const d = new Date()
  now.value = d
  currentTime.value = d.toLocaleTimeString('pt-PT', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
  currentDate.value = d.toLocaleDateString('pt-PT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  })
}

// ── Dynamic dates so the "static" cards never look stale ───────────────────────
const monthShort = (d: Date) => {
  const m = d.toLocaleDateString('pt-PT', { month: 'short' }).replace('.', '')
  return m.charAt(0).toUpperCase() + m.slice(1)
}

// Anchor agenda/transports to the current minute so they recompute as time
// passes but stay stable within the minute (no per-second flicker).
const minuteAnchor = computed(() => {
  const d = now.value
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}-${d.getMinutes()}`
})

interface AgendaEvent { day: string, month: string, title: string, meta: string }
const agendaEvents = computed<AgendaEvent[]>(() => {
  void minuteAnchor.value
  const base = now.value
  const mk = (offsetDays: number) => {
    const d = new Date(base)
    d.setDate(d.getDate() + offsetDays)
    return { day: String(d.getDate()).padStart(2, '0'), month: monthShort(d) }
  }
  const e1 = mk(2)
  const e2 = mk(5)
  const e3 = mk(12)
  return [
    { ...e1, title: 'Feira Semanal do Mercado', meta: '09:00 – 14:00 · Praça do Município' },
    { ...e2, title: 'Concerto no Auditório Municipal', meta: '21:30 · Auditório Municipal' },
    { ...e3, title: 'Dia do Município – Festas', meta: 'Todo o dia · Centro Histórico' }
  ]
})

interface TransportRow { badge: string, green: boolean, name: string, time: string }
const transportRows = computed<TransportRow[]>(() => {
  void minuteAnchor.value
  const base = now.value
  const at = (offsetMin: number) => {
    const d = new Date(base.getTime() + offsetMin * 60_000)
    return d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit', hour12: false })
  }
  return [
    { badge: 'L1', green: false, name: 'Porto – Vila do Conde', time: at(6) },
    { badge: 'L2', green: false, name: 'Póvoa de Varzim', time: at(19) },
    { badge: 'M', green: true, name: 'Metro – Linha Vermelha', time: at(33) },
    { badge: 'L1', green: false, name: 'Porto – Vila do Conde', time: at(52) }
  ]
})

const todayLabel = computed(() => {
  void minuteAnchor.value
  return now.value.toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })
})

const fetchWeather = async () => {
  try {
    const apiKey = config.public.openweatherApiKey
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=Vila%20do%20Conde,PT&units=metric&lang=pt&appid=${apiKey}`
    )
    if (response.ok) {
      const data = await response.json()
      if (data.main) {
        weatherData.value = {
          temp: Math.round(data.main.temp),
          description: data.weather?.[0]?.main || 'Parcialmente nublado',
          humidity: data.main.humidity || 65,
          windSpeed: Math.round(data.wind?.speed || 12),
          icon: data.weather?.[0]?.icon || '02d'
        }
      }
    } else {
      weatherData.value = { temp: 18, description: 'Parcialmente nublado', humidity: 65, windSpeed: 12, icon: '02d' }
    }
  } catch {
    weatherData.value = { temp: 18, description: 'Parcialmente nublado', humidity: 65, windSpeed: 12, icon: '02d' }
  }
}

// ── Geolocalização ────────────────────────────────────────────────────────────
const detectLocation = () => {
  if (!navigator.geolocation) return
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      panelLat.value = pos.coords.latitude
      panelLng.value = pos.coords.longitude
      await refreshGoods()
    },
    () => { /* permissão negada — bens não serão filtrados por raio */ },
    { enableHighAccuracy: true, timeout: 10000 }
  )
}

// ── Telemetry ─────────────────────────────────────────────────────────────────
const { init: initDeviceTelemetry, dispose: disposeDeviceTelemetry, sample: sampleTelemetry } = useDeviceTelemetry()
const { connected: wsConnected, sendTelemetry: wsSendTelemetry } = useNotifications()

const sendTelemetry = async () => {
  const s = sampleTelemetry()
  const payload = {
    locker_id: PANEL_LOCKER_ID,
    tipo: 'painel',
    geo_latitude: panelLat.value ?? 0,
    geo_longitude: panelLng.value ?? 0,
    bateria_estado: s.bateria_estado,
    cpu_temperatura: s.cpu_temperatura,
    dnb_sinal: s.dnb_sinal,
    aviso: s.aviso,
    evento: s.evento,
    versao: s.versao,
    status: s.status,
    device: s.device,
    timestamp: new Date().toISOString()
  }

  // Prefer WebSocket (zero-overhead, real-time); fall back to HTTP when disconnected
  if (wsConnected.value && wsSendTelemetry(payload)) return

  try {
    await $fetch('/api/painel/telemetry', { method: 'POST', body: payload })
  } catch { /* best-effort */ }
}

const generatePin = (): string => Math.floor(100000 + Math.random() * 900000).toString()

const goToDonate = () => {
  screen.value = 'donate'
}
const goBack = () => {
  screen.value = 'panel'
  resetDonation()
}
const toggleGood = (goodId: string) => {
  selectedGoodId.value = selectedGoodId.value === goodId ? '' : goodId
}

const isPrintEnabled = (): boolean => {
  if (!import.meta.client) return false
  const val = localStorage.getItem('sam_print_receipt_enabled')
  return val === null ? true : val === 'true'
}

const { print: agentPrint, isAvailable: printerAvailable, checkAvailability: refreshPrinter } = usePrintAgent()

type PrintStatus = 'idle' | 'printing' | 'done' | 'disabled' | 'unavailable' | 'error'
const printStatus = ref<PrintStatus>('idle')

const printStatusLabel = computed(() => ({
  idle: '',
  printing: 'A imprimir talão…',
  done: 'Talão impresso',
  disabled: 'Impressão de talão desativada',
  unavailable: 'Agente de impressão offline — talão não impresso',
  error: 'Falha ao imprimir o talão'
}[printStatus.value]))

const printReceipt = async () => {
  if (!isPrintEnabled()) {
    printStatus.value = 'disabled'
    return
  }
  printStatus.value = 'printing'

  // Validação: só imprime se o print-agent estiver ativo (fonte de verdade
  // sobre a disponibilidade da impressora). Se estiver offline, ignora-se.
  await refreshPrinter()
  if (!printerAvailable.value) {
    console.warn('[painel] print-agent offline — talão não impresso')
    printStatus.value = 'unavailable'
    return
  }

  const goodName = selectedGood.value?.tipo_bem_servico ?? selectedGoodId.value

  const now = new Date()
  const date = now.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const time = now.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit', hour12: false })
  const printerName = localStorage.getItem('sam_print_receipt_printer') || undefined

  try {
    const result = await $fetch<{ bytes: number[] }>('/api/print/bytes', {
      method: 'POST',
      body: {
        donorName: donorName.value,
        donorEmail: donorEmail.value,
        goodName,
        date,
        time,
        pin: pin.value
      }
    })
    await agentPrint(result.bytes, printerName)
    printStatus.value = 'done'
  } catch (err: unknown) {
    console.error('[painel] print failed:', err)
    printStatus.value = 'error'
  }
}

const submitDonation = async () => {
  if (!isDonateEnabled.value || !selectedGood.value) return
  isSubmitting.value = true
  submitError.value = ''
  printStatus.value = 'idle'

  const generatedPin = generatePin()

  try {
    await $fetch('/api/leads', {
      method: 'POST',
      body: {
        nome_cidadao: donorName.value,
        contacto_cidadao: donorEmail.value,
        rgpd: 1,
        id_pedido: selectedGood.value.id_pedido,
        id_item: selectedGood.value.id_item,
        item_pedido: selectedGood.value.tipo_bem_servico,
        pin_entrega: generatedPin
      }
    })

    pin.value = generatedPin
    isSubmitting.value = false
    thanksOpen.value = true
    if (modalTimerId) clearTimeout(modalTimerId)
    if (resetTimerId) clearTimeout(resetTimerId)
    modalTimerId = setTimeout(() => {
      thanksOpen.value = false
    }, 8000)
    resetTimerId = setTimeout(() => {
      resetDonation()
      screen.value = 'panel'
    }, 30000)
    printReceipt()
    refreshGoods()
  } catch (err: unknown) {
    console.error('[painel] lead creation failed:', err)
    isSubmitting.value = false
    const e = err as { data?: { description?: string, errors?: Array<Record<string, string>> } }
    const conflict = e?.data?.errors?.[0]
    if (conflict && 'id_item' in conflict) {
      submitError.value = 'Este bem já não está disponível. A lista foi atualizada.'
      selectedGoodId.value = ''
      await refreshGoods()
    } else {
      submitError.value = 'Ocorreu um erro. Tente novamente.'
    }
  }
}

const resetDonation = () => {
  selectedGoodId.value = ''
  donorName.value = ''
  donorEmail.value = ''
  pin.value = ''
}

const clearTimers = () => {
  if (modalTimerId) clearTimeout(modalTimerId)
  if (resetTimerId) clearTimeout(resetTimerId)
  if (clockInterval) clearInterval(clockInterval)
  if (telemetryInterval) clearInterval(telemetryInterval)
}

onMounted(async () => {
  detectLocation()
  fetchWeather()
  updateClock()
  clockInterval = setInterval(updateClock, 1000)
  await initDeviceTelemetry()
  sendTelemetry()
  telemetryInterval = setInterval(sendTelemetry, 5000)
})

onBeforeUnmount(() => {
  clearTimers()
  disposeDeviceTelemetry()
})
</script>

<template>
  <div class="panel-container">
    <!-- HEADER -->
    <header class="panel-header">
      <div class="panel-header-content">
        <div class="panel-header-brand-group">
          <img src="/VCD1.png" alt="Brasão Vila do Conde" class="panel-header-logo">
          <img src="/logo_big.svg" alt="Vila do Conde" class="panel-header-brand">
        </div>
        <div class="panel-header-center">
          <div class="panel-kicker">
            Município de Vila do Conde
          </div>
          <div class="panel-title">
            Painel do Cidadão
          </div>
        </div>
        <div class="panel-header-clock">
          <div class="clock-time">
            {{ currentTime }}
          </div>
          <div class="clock-date">
            {{ currentDate }}
          </div>
        </div>
      </div>
    </header>

    <!-- MAIN PANEL -->
    <main>
      <div
        v-if="screen === 'panel'"
        class="panel-wrap"
      >
        <!-- HERO DONATION CARD -->
        <button class="hero-donate" aria-label="Fazer uma doação" @click="goToDonate">
          <div class="hero-donate-glow" aria-hidden="true" />
          <div class="hero-donate-inner">
            <div class="hero-icon" aria-hidden="true">
              <UIcon name="i-fa6-solid-hand-holding-heart" />
            </div>
            <div class="hero-content">
              <h2 class="hero-title">
                Fazer uma Doação
              </h2>
              <p class="hero-subtitle">
                Ajude a comunidade local. Doe bens essenciais e receba um código de referência para rastreamento.
              </p>
            </div>
            <div class="hero-cta" aria-hidden="true">
              <div class="hero-btn">
                <UIcon name="i-fa6-solid-arrow-right" />
              </div>
            </div>
          </div>
          <div class="hero-label" aria-hidden="true">
            Toque para começar
          </div>
        </button>

        <!-- INFO CARDS GRID -->
        <div class="panel-grid">
          <!-- WEATHER CARD -->
          <div class="glass-card weather-card">
            <div class="glass-card-header">
              <UIcon name="i-fa6-solid-cloud-sun" class="glass-icon" aria-hidden="true" />
              <span>Meteorologia</span>
            </div>
            <div class="weather-body">
              <div class="weather-hero">
                <UIcon :name="weatherIcon" class="weather-main-icon" aria-hidden="true" />
                <div class="weather-temp">
                  {{ weatherData.temp }}°
                </div>
              </div>
              <div class="weather-desc">
                {{ weatherData.description }}
              </div>
              <div class="weather-details">
                <span class="weather-pill">
                  <span class="weather-pill-icon" aria-hidden="true">💧</span>
                  <span class="weather-pill-val">{{ weatherData.humidity }}%</span>
                  <span class="weather-pill-label">Humidade</span>
                </span>
                <span class="weather-pill">
                  <span class="weather-pill-icon" aria-hidden="true">💨</span>
                  <span class="weather-pill-val">{{ weatherData.windSpeed }}</span>
                  <span class="weather-pill-label">km/h</span>
                </span>
              </div>
              <div class="weather-unit-label">
                Temperatura em graus Celsius · Vila do Conde
              </div>
            </div>
          </div>

          <!-- INFO CARD -->
          <div class="glass-card info-card">
            <div class="glass-card-header">
              <UIcon name="i-fa6-solid-circle-info" class="glass-icon" aria-hidden="true" />
              <span>Informações</span>
            </div>
            <div class="info-body">
              <p class="info-text">
                Bem-vindo ao Painel do Cidadão de Vila do Conde.
              </p>
              <div class="info-badges">
                <div class="info-badge">
                  <UIcon name="i-fa6-solid-location-dot" aria-hidden="true" />
                  <span>Vila do Conde, Portugal</span>
                </div>
                <div class="info-badge">
                  <UIcon name="i-fa6-solid-globe" aria-hidden="true" />
                  <span>{{ panelCoords }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- NEWS CARD -->
          <div class="glass-card news-card">
            <div class="glass-card-header">
              <UIcon name="i-fa6-solid-newspaper" class="glass-icon" aria-hidden="true" />
              <span>Notícias</span>
            </div>
            <div class="news-body">
              <div class="news-image-wrap">
                <img
                  src="https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=600&q=80"
                  alt="Notícia"
                  class="news-image"
                >
                <span class="news-date-badge">{{ todayLabel }}</span>
              </div>
              <p class="news-text">
                Últimas novidades da comunidade local e iniciativas comunitárias.
              </p>
            </div>
          </div>

          <!-- TRANSPORT CARD -->
          <div class="glass-card transport-card">
            <div class="glass-card-header">
              <UIcon name="i-fa6-solid-bus" class="glass-icon" aria-hidden="true" />
              <span>Transportes</span>
            </div>
            <div class="transport-body">
              <div
                v-for="(t, idx) in transportRows"
                :key="idx"
                class="transport-row"
              >
                <div class="transport-line">
                  <span class="transport-badge" :class="{ 'transport-badge--green': t.green }">{{ t.badge }}</span>
                  <span class="transport-name">{{ t.name }}</span>
                </div>
                <span class="transport-time">{{ t.time }}</span>
              </div>
            </div>
          </div>

          <!-- CONTACTS CARD -->
          <div class="glass-card contacts-card">
            <div class="glass-card-header">
              <UIcon name="i-fa6-solid-phone" class="glass-icon" aria-hidden="true" />
              <span>Contactos Úteis</span>
            </div>
            <div class="contacts-body">
              <div class="contact-row">
                <div class="contact-icon contact-icon--red" aria-hidden="true">
                  <UIcon name="i-fa6-solid-triangle-exclamation" />
                </div>
                <div class="contact-info">
                  <div class="contact-label">
                    Emergência
                  </div>
                  <div class="contact-number">
                    112
                  </div>
                </div>
              </div>
              <div class="contact-row">
                <div class="contact-icon contact-icon--blue" aria-hidden="true">
                  <UIcon name="i-fa6-solid-shield-halved" />
                </div>
                <div class="contact-info">
                  <div class="contact-label">
                    PSP Vila do Conde
                  </div>
                  <div class="contact-number">
                    252 248 290
                  </div>
                </div>
              </div>
              <div class="contact-row">
                <div class="contact-icon contact-icon--green" aria-hidden="true">
                  <UIcon name="i-fa6-solid-hospital" />
                </div>
                <div class="contact-info">
                  <div class="contact-label">
                    Centro de Saúde
                  </div>
                  <div class="contact-number">
                    252 240 900
                  </div>
                </div>
              </div>
              <div class="contact-row">
                <div class="contact-icon contact-icon--orange" aria-hidden="true">
                  <UIcon name="i-fa6-solid-building-columns" />
                </div>
                <div class="contact-info">
                  <div class="contact-label">
                    Câmara Municipal
                  </div>
                  <div class="contact-number">
                    252 248 400
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- EVENTS CARD -->
          <div class="glass-card events-card">
            <div class="glass-card-header">
              <UIcon name="i-fa6-solid-calendar-days" class="glass-icon" aria-hidden="true" />
              <span>Agenda</span>
            </div>
            <div class="events-body">
              <div
                v-for="(ev, idx) in agendaEvents"
                :key="idx"
                class="event-row"
              >
                <div class="event-date-block" aria-hidden="true">
                  <span class="event-day">{{ ev.day }}</span>
                  <span class="event-month">{{ ev.month }}</span>
                </div>
                <div class="event-detail">
                  <div class="event-title">
                    {{ ev.title }}
                  </div>
                  <div class="event-meta">
                    <UIcon name="i-fa6-solid-clock" aria-hidden="true" />
                    <span>{{ ev.meta }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- MAP CARD -->
          <div class="glass-card map-card">
            <div class="glass-card-header">
              <UIcon name="i-fa6-solid-map-location-dot" class="glass-icon" aria-hidden="true" />
              <span>Localização</span>
            </div>
            <div class="map-wrapper">
              <PainelMap />
            </div>
          </div>
        </div>
      </div>

      <!-- DONATION SCREEN -->
      <div v-else class="donate-screen">
        <button class="donate-back-btn" @click="goBack">
          <UIcon name="i-fa6-solid-arrow-left" aria-hidden="true" />
          <span>Voltar</span>
        </button>

        <div class="donate-container">
          <div class="donate-header">
            <div class="donate-header-icon" aria-hidden="true">
              <UIcon name="i-fa6-solid-hand-holding-heart" />
            </div>
            <h1 class="donate-screen-title">
              Fazer uma Doação
            </h1>
            <p class="donate-screen-subtitle">
              Selecione o tipo de bem e preencha os seus dados.
            </p>
          </div>

          <!-- GOODS GRID -->
          <div class="donate-section">
            <div class="donate-section-label">
              <UIcon name="i-fa6-solid-box-open" aria-hidden="true" />
              Selecione o bem a doar
              <span v-if="goods.length" class="donate-count-badge">{{ goods.length }}</span>
            </div>
            <div class="donate-goods-grid">
              <div v-if="!goodsData" class="goods-status">
                <UIcon name="i-lucide-loader-circle" class="animate-spin" />
                <span>A carregar bens disponíveis…</span>
              </div>
              <div v-else-if="goods.length === 0" class="goods-status">
                <UIcon name="i-lucide-package-open" />
                <span>Nenhum bem disponível na área de cobertura.</span>
              </div>
              <button
                v-for="good in goods"
                :key="good.id_item"
                class="good-chip"
                :class="{ active: selectedGoodId === String(good.id_item) }"
                @click="toggleGood(String(good.id_item))"
              >
                <span class="good-chip-text">
                  <span class="good-name">{{ good.tipo_bem_servico }}</span>
                  <span class="good-institution">{{ good.nome_entidade }}</span>
                </span>
                <UIcon
                  v-if="selectedGoodId === String(good.id_item)"
                  name="i-fa6-solid-circle-check"
                  class="good-check"
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>

          <!-- DONOR FORM -->
          <div class="donate-section donate-form-section">
            <div class="donate-section-label">
              <UIcon name="i-fa6-solid-user" aria-hidden="true" />
              Os seus dados
            </div>

            <UFormField label="Nome completo" required>
              <UInput
                v-model="donorName"
                placeholder="Insira o seu nome"
                size="xl"
              />
            </UFormField>

            <UFormField label="Email" required>
              <UInput
                v-model="donorEmail"
                placeholder="seu@email.pt"
                type="email"
                size="xl"
              />
            </UFormField>

            <div v-if="submitError" class="submit-error">
              <UIcon name="i-fa6-solid-circle-exclamation" aria-hidden="true" />
              {{ submitError }}
            </div>

            <button
              class="donate-submit-btn"
              :disabled="!isDonateEnabled"
              @click="submitDonation"
            >
              Confirmar Doação
            </button>
          </div>
        </div>
      </div>
    </main>

    <!-- SUCCESS MODAL -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div
          v-if="thanksOpen"
          class="modal-overlay"
          @click="thanksOpen = false"
        >
          <div
            class="thanks-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="thanks-title"
            @click.stop
          >
            <div class="thanks-check" aria-hidden="true">
              <UIcon name="i-fa6-solid-circle-check" />
            </div>
            <h2 id="thanks-title" class="thanks-title">
              Doação Confirmada!
            </h2>
            <p class="thanks-label">
              O seu código de referência
            </p>
            <div class="thanks-pin">
              {{ pin }}
            </div>
            <p class="thanks-info">
              Código enviado para {{ donorEmail }}
            </p>
            <p
              v-if="printStatusLabel"
              class="thanks-print"
              :class="`thanks-print--${printStatus}`"
            >
              <UIcon
                :name="printStatus === 'printing' ? 'i-lucide-loader-circle'
                  : printStatus === 'done' ? 'i-fa6-solid-circle-check'
                    : 'i-fa6-solid-triangle-exclamation'"
                :class="printStatus === 'printing' ? 'animate-spin' : ''"
                aria-hidden="true"
              />
              {{ printStatusLabel }}
            </p>
            <p class="thanks-note">
              Obrigado por ajudar a comunidade de Vila do Conde!
            </p>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
* { box-sizing: border-box; }

/* ── BASE ── */
.panel-container {
  min-height: 100vh;
  background: linear-gradient(160deg, #06091a 0%, #0b1535 40%, #0f2050 70%, #0d1a40 100%);
  display: flex;
  flex-direction: column;
  color: #fff;
  font-family: system-ui, -apple-system, sans-serif;
}

/* ── HEADER ── */
.panel-header {
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 14px 20px;
  position: sticky;
  top: 0;
  z-index: 100;
}

.panel-header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  max-width: 1100px;
  margin: 0 auto;
}

.panel-header-brand-group {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.panel-header-logo {
  width: 48px;
  height: 48px;
  object-fit: contain;
  filter: drop-shadow(0 0 8px rgba(96, 165, 250, 0.4));
}

.panel-header-brand {
  width: 56px;
  height: auto;
  object-fit: contain;
  opacity: 0.9;
}

.panel-header-center {
  flex: 1;
  text-align: center;
}

.panel-kicker {
  font-size: 11px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.55);
  text-transform: uppercase;
  letter-spacing: 1.5px;
}

.panel-title {
  font-size: 22px;
  font-weight: 800;
  background: linear-gradient(90deg, #93c5fd, #ffffff, #93c5fd);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.3px;
}

.panel-header-clock {
  flex-shrink: 0;
  text-align: right;
}

.clock-time {
  font-size: 28px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: #60a5fa;
  line-height: 1;
}

.clock-date {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.45);
  text-transform: capitalize;
  margin-top: 3px;
}

/* ── MAIN PANEL ── */
.panel-wrap {
  flex: 1;
  padding: 20px 16px 32px;
  max-width: 1100px;
  margin: 0 auto;
  width: 100%;
}

/* ── HERO DONATION ── */
.hero-donate {
  position: relative;
  margin-bottom: 24px;
  border-radius: 24px;
  overflow: hidden;
  cursor: pointer;
  background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 40%, #3b82f6 70%, #60a5fa 100%);
  box-shadow: 0 20px 60px rgba(37, 99, 235, 0.5), 0 0 0 1px rgba(96, 165, 250, 0.3);
  appearance: none;
  border: none;
  width: 100%;
  text-align: left;
  display: block;
}

.hero-donate-glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at 70% 50%, rgba(255,255,255,0.15) 0%, transparent 60%);
  pointer-events: none;
}

.hero-donate-inner {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 28px 24px 20px;
  position: relative;
}

.hero-icon {
  font-size: 52px;
  flex-shrink: 0;
  filter: drop-shadow(0 4px 12px rgba(0,0,0,0.3));
  animation: pulse-icon 2.5s ease-in-out infinite;
}

@keyframes pulse-icon {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.07); }
}

.hero-content {
  flex: 1;
}

.hero-title {
  font-size: 26px;
  font-weight: 800;
  color: #fff;
  margin: 0 0 6px;
  text-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

.hero-subtitle {
  font-size: 14px;
  color: rgba(255,255,255,0.85);
  margin: 0;
  line-height: 1.5;
}

.hero-cta {
  flex-shrink: 0;
}

.hero-btn {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(255,255,255,0.2);
  border: 2px solid rgba(255,255,255,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  color: white;
}

.hero-label {
  text-align: center;
  font-size: 12px;
  color: rgba(255,255,255,0.6);
  padding: 0 24px 16px;
  letter-spacing: 1px;
  text-transform: uppercase;
  font-weight: 500;
}

/* ── GLASS CARDS ── */
.panel-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.glass-card {
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  overflow: hidden;
  transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
  animation: card-rise 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.glass-card:hover {
  transform: translateY(-3px);
  border-color: rgba(96, 165, 250, 0.35);
  box-shadow: 0 16px 40px rgba(6, 9, 26, 0.45);
}

.panel-grid > .glass-card:nth-child(1) { animation-delay: 0.04s; }
.panel-grid > .glass-card:nth-child(2) { animation-delay: 0.10s; }
.panel-grid > .glass-card:nth-child(3) { animation-delay: 0.16s; }
.panel-grid > .glass-card:nth-child(4) { animation-delay: 0.22s; }
.panel-grid > .glass-card:nth-child(5) { animation-delay: 0.28s; }
.panel-grid > .glass-card:nth-child(6) { animation-delay: 0.34s; }
.panel-grid > .glass-card:nth-child(7) { animation-delay: 0.40s; }

@keyframes card-rise {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (prefers-reduced-motion: reduce) {
  .glass-card { animation: none; }
  .hero-icon { animation: none; }
}

.glass-card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 20px 12px;
  font-size: 14px;
  font-weight: 600;
  color: rgba(255,255,255,0.7);
  border-bottom: 1px solid rgba(255,255,255,0.07);
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

.glass-icon {
  font-size: 18px;
  color: #60a5fa;
}

/* ── WEATHER CARD ── */
.weather-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  padding: 24px 20px 20px;
  text-align: center;
}

.weather-hero {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 14px;
}

.weather-main-icon {
  font-size: 80px;
  color: #fbbf24;
  filter: drop-shadow(0 0 24px rgba(251, 191, 36, 0.55));
  flex-shrink: 0;
}

.weather-temp {
  font-size: 96px;
  font-weight: 800;
  color: #fff;
  letter-spacing: -4px;
  line-height: 1;
}

.weather-desc {
  font-size: 17px;
  color: rgba(255,255,255,0.75);
  font-weight: 500;
  margin-bottom: 16px;
  text-transform: capitalize;
}

.weather-details {
  display: flex;
  flex-direction: row;
  gap: 10px;
  margin-bottom: 14px;
}

.weather-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 14px;
  padding: 8px 14px;
  font-size: 13px;
  color: rgba(255,255,255,0.85);
}

.weather-pill-icon { font-size: 15px; }

.weather-pill-val {
  font-size: 15px;
  font-weight: 700;
  color: #fff;
  font-variant-numeric: tabular-nums;
}

.weather-pill-label {
  font-size: 11px;
  font-weight: 500;
  color: rgba(255,255,255,0.45);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.weather-unit-label {
  font-size: 10px;
  color: rgba(255,255,255,0.28);
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 500;
}

/* ── INFO CARD ── */
.info-body {
  padding: 20px;
}

.info-text {
  font-size: 15px;
  color: rgba(255,255,255,0.75);
  line-height: 1.6;
  margin: 0 0 16px;
}

.info-badges {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.info-badge {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(96, 165, 250, 0.1);
  border: 1px solid rgba(96, 165, 250, 0.2);
  border-radius: 12px;
  padding: 10px 14px;
  font-size: 13px;
  color: #93c5fd;
  font-weight: 500;
}

.info-badge :deep(svg) { font-size: 16px; flex-shrink: 0; }

/* ── NEWS CARD ── */
.news-body {
  padding: 16px 20px 20px;
}

.news-image-wrap {
  position: relative;
  margin-bottom: 14px;
}

.news-image {
  width: 100%;
  height: 160px;
  object-fit: cover;
  border-radius: 12px;
  display: block;
}

.news-date-badge {
  position: absolute;
  bottom: 10px;
  left: 10px;
  background: rgba(6, 9, 26, 0.72);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.14);
  color: #cfe0ff;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.3px;
  padding: 4px 10px;
  border-radius: 999px;
  text-transform: capitalize;
}

.news-text {
  font-size: 14px;
  color: rgba(255,255,255,0.65);
  line-height: 1.6;
  margin: 0;
}

/* ── MAP CARD ── */
.map-wrapper {
  height: 320px;
  overflow: hidden;
}

/* ── DONATION SCREEN ── */
.donate-screen {
  flex: 1;
  padding: 16px;
  position: relative;
}

.donate-back-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.15);
  color: #93c5fd;
  border-radius: 50px;
  padding: 10px 20px 10px 16px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 24px;
}

.donate-container {
  max-width: 600px;
  margin: 0 auto;
}

.donate-header {
  text-align: center;
  margin-bottom: 32px;
}

.donate-header-icon {
  font-size: 48px;
  margin-bottom: 12px;
  display: inline-block;
  background: linear-gradient(135deg, #2563eb, #60a5fa);
  border-radius: 20px;
  padding: 16px;
  color: white;
  box-shadow: 0 12px 32px rgba(37, 99, 235, 0.4);
}

.donate-screen-title {
  font-size: 30px;
  font-weight: 800;
  background: linear-gradient(90deg, #93c5fd, #ffffff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 8px;
}

.donate-screen-subtitle {
  font-size: 15px;
  color: rgba(255,255,255,0.55);
  margin: 0;
  line-height: 1.6;
}

.donate-section {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 20px;
  padding: 24px;
  margin-bottom: 20px;
}

.donate-section-label {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  font-weight: 700;
  color: #60a5fa;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 18px;
}

.donate-section-label :deep(svg) { font-size: 16px; }

/* ── GOODS GRID ── */
.donate-goods-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 380px;
  overflow-y: auto;
  padding-right: 4px;
}

.good-chip {
  width: 100%;
  padding: 14px 18px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.8);
  font-size: 15px;
  font-weight: 500;
  text-align: left;
  min-height: 52px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  transition: transform 0.15s ease, background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.good-chip:not(.active):hover {
  background: rgba(255, 255, 255, 0.09);
  border-color: rgba(96, 165, 250, 0.4);
}

.good-chip-text { min-width: 0; flex: 1; }

.good-chip.active {
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  border-color: #60a5fa;
  color: #fff;
  box-shadow: 0 4px 16px rgba(37, 99, 235, 0.4);
}

.good-check {
  font-size: 20px;
  color: #fff;
  flex-shrink: 0;
  filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.5));
}

.donate-count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 22px;
  padding: 0 7px;
  margin-left: auto;
  background: rgba(96, 165, 250, 0.18);
  border: 1px solid rgba(96, 165, 250, 0.35);
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  color: #93c5fd;
  letter-spacing: 0;
  text-transform: none;
}

.good-name {
  display: block;
  line-height: 1.2;
}

/* ── DONATE FORM ── */
.donate-form-section {
  display: flex;
  flex-direction: column;
  gap: 0;
}

:deep(.u-form-field) {
  margin-bottom: 28px;
}

:deep(label) {
  color: rgba(255, 255, 255, 0.7);
  font-weight: 600;
  font-size: 13px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  margin-bottom: 4px;
  display: block;
}

:deep(input) {
  width: 100%;
  background: rgba(255, 255, 255, 0.08) !important;
  color: #fff !important;
  border: 1px solid rgba(255, 255, 255, 0.18) !important;
  border-radius: 12px !important;
  font-size: 16px !important;
  padding: 14px 18px !important;
  min-height: 54px !important;
  transition: all 0.2s ease !important;
  outline: none;
}

:deep(input::placeholder) {
  color: rgba(255, 255, 255, 0.3) !important;
}

:deep(input:focus) {
  border-color: #3b82f6 !important;
  background: rgba(59, 130, 246, 0.12) !important;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25) !important;
}

.submit-error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 12px;
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #fca5a5;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
}

.donate-submit-btn {
  width: 100%;
  min-height: 56px;
  margin-top: 12px;
  border-radius: 14px;
  border: none;
  cursor: pointer;
  font-weight: 700;
  font-size: 16px;
  letter-spacing: 0.5px;
  transition: all 0.25s ease;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  color: white;
  box-shadow: 0 8px 24px rgba(37, 99, 235, 0.5);
}

.donate-submit-btn:not(:disabled):active {
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
}

.donate-submit-btn:disabled {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.25);
  box-shadow: none;
  cursor: not-allowed;
}

/* ── MODAL OVERLAY ── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 24px;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.25s ease;
}

.modal-fade-enter-active .thanks-modal,
.modal-fade-leave-active .thanks-modal {
  transition: transform 0.25s ease, opacity 0.25s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-from .thanks-modal {
  transform: scale(0.92) translateY(16px);
}

.modal-fade-leave-to .thanks-modal {
  transform: scale(0.95);
  opacity: 0;
}

/* ── THANKS MODAL ── */
.thanks-modal {
  background: linear-gradient(160deg, #0d1535 0%, #0f2050 100%);
  border: 1px solid rgba(96, 165, 250, 0.25);
  border-radius: 24px;
  padding: 40px 32px;
  text-align: center;
  color: white;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 32px 80px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(96, 165, 250, 0.15);
}

.thanks-check {
  font-size: 56px;
  color: #34d399;
  margin-bottom: 16px;
  filter: drop-shadow(0 0 20px rgba(52, 211, 153, 0.4));
}

.thanks-title {
  font-size: 28px;
  font-weight: 800;
  color: #fff;
  margin: 0 0 24px;
}

.thanks-label {
  font-size: 13px;
  color: rgba(255,255,255,0.5);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin: 0 0 12px;
}

.thanks-pin {
  font-size: 52px;
  font-weight: 800;
  color: #60a5fa;
  letter-spacing: 10px;
  font-variant-numeric: tabular-nums;
  margin: 0 0 24px;
  text-shadow: 0 0 30px rgba(96, 165, 250, 0.5);
}

.thanks-info {
  font-size: 14px;
  color: rgba(255,255,255,0.6);
  margin: 0 0 8px;
}

.thanks-note {
  font-size: 13px;
  color: rgba(255,255,255,0.4);
  font-style: italic;
  margin: 0;
}

.thanks-print {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 500;
  margin: 0 0 12px;
  padding: 6px 14px;
  border-radius: 999px;
}
.thanks-print--printing { color: #93c5fd; background: rgba(96,165,250,0.12); }
.thanks-print--done { color: #6ee7b7; background: rgba(52,211,153,0.12); }
.thanks-print--unavailable,
.thanks-print--error,
.thanks-print--disabled { color: #fcd34d; background: rgba(251,191,36,0.12); }

/* ── GOODS STATUS (loading / empty) ── */
.goods-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 24px;
  color: rgba(255, 255, 255, 0.4);
  font-size: 14px;
}

.goods-status :deep(svg) { font-size: 20px; flex-shrink: 0; }

.good-institution {
  display: block;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.38);
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── SCROLLBAR ── */
.donate-goods-grid::-webkit-scrollbar { width: 5px; }
.donate-goods-grid::-webkit-scrollbar-track { background: transparent; }
.donate-goods-grid::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 4px; }

/* ── RESPONSIVE ── */
@media (min-width: 480px) {
  .panel-title { font-size: 26px; }
  .clock-time { font-size: 32px; }
  .hero-title { font-size: 30px; }
  .weather-temp { font-size: 108px; }
  .weather-main-icon { font-size: 88px; }
}

@media (min-width: 640px) {
  .panel-wrap { padding: 24px 20px 40px; }
  .panel-grid { grid-template-columns: repeat(2, 1fr); }
  .map-card { grid-column: span 2; }
  .donate-goods-grid { max-height: 400px; }
  .map-wrapper { height: 380px; }
  .hero-donate-inner { padding: 36px 32px 24px; }
  .hero-icon { font-size: 64px; }
}

@media (min-width: 768px) {
  .panel-header { padding: 16px 32px; }
  .panel-header-logo { width: 60px; height: 60px; }
  .panel-header-brand { width: 68px; }
  .panel-title { font-size: 30px; }
  .panel-wrap { padding: 28px 24px 48px; }
  .map-wrapper { height: 420px; }
  .donate-goods-grid { max-height: 420px; }
}

@media (min-width: 1024px) {
  .panel-grid { grid-template-columns: repeat(3, 1fr); }
  .map-card { grid-column: span 3; }
  .map-wrapper { height: 440px; }
  .donate-goods-grid { max-height: 440px; }
  .news-image { height: 200px; }
}

/* ── TRANSPORT CARD ── */
.transport-body {
  padding: 12px 20px 20px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.transport-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.transport-line {
  display: flex;
  align-items: center;
  gap: 10px;
}

.transport-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 30px;
  height: 22px;
  padding: 0 6px;
  background: rgba(96, 165, 250, 0.2);
  border: 1px solid rgba(96, 165, 250, 0.35);
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  color: #93c5fd;
  letter-spacing: 0.5px;
}

.transport-badge--green {
  background: rgba(52, 211, 153, 0.15);
  border-color: rgba(52, 211, 153, 0.3);
  color: #6ee7b7;
}

.transport-name {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.75);
  font-weight: 500;
}

.transport-time {
  font-size: 15px;
  font-weight: 700;
  color: #60a5fa;
  font-variant-numeric: tabular-nums;
}

.transport-time--next {
  color: rgba(255, 255, 255, 0.35);
}

/* ── CONTACTS CARD ── */
.contacts-body {
  padding: 12px 20px 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.contact-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.contact-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}

.contact-icon--red    { background: rgba(239, 68, 68, 0.15);  color: #f87171; }
.contact-icon--blue   { background: rgba(96, 165, 250, 0.15); color: #60a5fa; }
.contact-icon--green  { background: rgba(52, 211, 153, 0.15); color: #34d399; }
.contact-icon--orange { background: rgba(251, 146, 60, 0.15); color: #fb923c; }

.contact-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.45);
  text-transform: uppercase;
  letter-spacing: 0.7px;
  font-weight: 600;
}

.contact-number {
  font-size: 15px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.9);
  font-variant-numeric: tabular-nums;
}

/* ── EVENTS CARD ── */
.events-body {
  padding: 12px 20px 20px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.event-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.event-date-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 42px;
  flex-shrink: 0;
  background: rgba(96, 165, 250, 0.15);
  border: 1px solid rgba(96, 165, 250, 0.25);
  border-radius: 10px;
  padding: 6px 4px;
}

.event-day {
  font-size: 20px;
  font-weight: 800;
  color: #60a5fa;
  line-height: 1;
}

.event-month {
  font-size: 10px;
  font-weight: 600;
  color: rgba(96, 165, 250, 0.7);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.event-detail {
  flex: 1;
  min-width: 0;
}

.event-title {
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.85);
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.event-meta {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
}

.event-meta :deep(svg) { font-size: 11px; flex-shrink: 0; }

/* responsive span adjustments for new cards */
@media (min-width: 640px) {
  .contacts-card { grid-column: span 1; }
}

@media (min-width: 1024px) {
  .transport-card,
  .contacts-card,
  .events-card { grid-column: span 1; }
}

/* ── UCard overrides ── */
:deep(.u-card) {
  background: transparent !important;
  color: inherit !important;
  border: none !important;
}

html, body { color-scheme: dark; }
</style>
