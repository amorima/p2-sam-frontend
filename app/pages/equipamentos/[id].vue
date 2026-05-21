<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

interface TelemetryStatus {
  sensor_porta: string
  numpad: string
}

interface TelemetryPing {
  _id: string
  evento: string
  locker_id: number
  tipo: string
  geo_latitude: number
  geo_longitude: number
  bateria_estado: number
  cpu_temperatura: number
  dnb_sinal: number
  aviso: string | null
  status: TelemetryStatus
  versao: string
  timestamp: string
}

interface TelemetryResponse {
  locker_id: number
  pings: TelemetryPing[]
}

const UBadge = resolveComponent('UBadge')
const UIcon = resolveComponent('UIcon')

const route = useRoute()
const lockerId = route.params.id as string

const { data, status, refresh } = await useFetch<TelemetryResponse>(
  `/api/equipamentos/${lockerId}`,
  { lazy: true, server: false }
)

const { pause } = useIntervalFn(() => refresh(), 5000)
onUnmounted(() => pause())

const pings = computed<TelemetryPing[]>(() => data.value?.pings ?? [])
const latestPing = computed(() => pings.value[0] ?? null)

const globalFilter = ref('')

function formatDate(d: string) {
  return new Date(d).toLocaleString('pt-PT')
}

function sinalIcon(sinal: number) {
  if (sinal === 0) return 'i-lucide-wifi-off'
  if (sinal <= 2) return 'i-lucide-signal-low'
  if (sinal <= 3) return 'i-lucide-signal-medium'
  return 'i-lucide-signal-high'
}

function eventoColor(evento: string): 'neutral' | 'info' | 'warning' | 'error' {
  if (!evento) return 'neutral'
  if (evento.includes('error') || evento.includes('fail')) return 'error'
  if (evento.includes('warn') || evento.includes('open')) return 'warning'
  if (evento.includes('ping') || evento.includes('boot')) return 'info'
  return 'neutral'
}

const saudeAtual = computed(() => {
  const p = latestPing.value
  if (!p) return { color: 'neutral' as const, label: 'Desligado' }
  const { bateria_estado: b, cpu_temperatura: t, dnb_sinal: s, aviso } = p
  if (b < 20 || t > 85 || s === 0) return { color: 'error' as const, label: 'Erros' }
  if (b < 50 || t > 70 || s < 3 || aviso) return { color: 'warning' as const, label: 'Com Deficiências' }
  return { color: 'success' as const, label: 'Saudável' }
})

const columns: TableColumn<TelemetryPing>[] = [
  {
    accessorKey: 'timestamp',
    header: 'Timestamp',
    cell: ({ row }) =>
      h('span', { class: 'font-mono text-xs text-muted' }, formatDate(row.original.timestamp))
  },
  {
    accessorKey: 'evento',
    header: 'Evento',
    cell: ({ row }) =>
      h(UBadge, {
        variant: 'subtle',
        color: eventoColor(row.original.evento),
        size: 'sm',
        class: 'font-mono'
      }, () => row.original.evento ?? '—')
  },
  {
    accessorKey: 'bateria_estado',
    header: 'Bateria',
    cell: ({ row }) => {
      const v = row.original.bateria_estado
      const color = v < 20 ? 'text-error' : v < 50 ? 'text-warning' : 'text-success'
      return h('span', { class: `font-mono text-sm ${color}` }, `${v}%`)
    }
  },
  {
    accessorKey: 'cpu_temperatura',
    header: 'Temperatura',
    cell: ({ row }) => {
      const v = row.original.cpu_temperatura
      const color = v > 85 ? 'text-error' : v > 70 ? 'text-warning' : 'text-muted'
      return h('span', { class: `font-mono text-sm ${color}` }, `${v}°C`)
    }
  },
  {
    accessorKey: 'dnb_sinal',
    header: 'Sinal',
    cell: ({ row }) => {
      const v = row.original.dnb_sinal
      const color = v === 0 ? 'text-error' : v < 3 ? 'text-warning' : 'text-success'
      return h('div', { class: `flex items-center gap-1 ${color}` }, [
        h(UIcon, { name: sinalIcon(v), class: 'size-4' }),
        h('span', { class: 'font-mono text-sm' }, String(v))
      ])
    }
  },
  {
    accessorKey: 'aviso',
    header: 'Aviso',
    cell: ({ row }) => {
      const v = row.original.aviso
      return v
        ? h('span', { class: 'text-xs text-warning font-medium' }, v)
        : h('span', { class: 'text-xs text-muted' }, '—')
    }
  },
  {
    accessorKey: 'status',
    header: 'Sensores',
    cell: ({ row }) => {
      const s = row.original.status
      if (!s) return h('span', { class: 'text-xs text-muted' }, '—')
      return h('div', { class: 'space-y-0.5' }, [
        h('p', { class: 'text-xs text-muted' }, `Porta: ${s.sensor_porta ?? '—'}`),
        h('p', { class: 'text-xs text-muted' }, `Numpad: ${s.numpad ?? '—'}`)
      ])
    }
  },
  {
    accessorKey: 'versao',
    header: 'Versão',
    cell: ({ row }) =>
      h('span', { class: 'font-mono text-xs text-muted' }, row.original.versao ?? '—')
  }
]
</script>

<template>
  <UDashboardPanel :id="`equipamento-${lockerId}`">
    <template #header>
      <UDashboardNavbar :title="`Locker #${lockerId} — Telemetria`">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton
            icon="i-lucide-arrow-left"
            label="Equipamentos"
            color="neutral"
            variant="ghost"
            to="/equipamentos"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- Current status cards -->
      <div
        v-if="latestPing"
        class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6"
      >
        <UPageCard variant="subtle" class="p-4">
          <p class="text-xs text-muted uppercase tracking-wide font-medium mb-1">
            Estado Atual
          </p>
          <UBadge :color="saudeAtual.color" variant="subtle" size="lg">
            {{ saudeAtual.label }}
          </UBadge>
        </UPageCard>
        <UPageCard variant="subtle" class="p-4">
          <p class="text-xs text-muted uppercase tracking-wide font-medium mb-1">
            Bateria
          </p>
          <p
            class="text-xl font-bold font-mono"
            :class="latestPing.bateria_estado < 20 ? 'text-error' : latestPing.bateria_estado < 50 ? 'text-warning' : 'text-success'"
          >
            {{ latestPing.bateria_estado }}%
          </p>
        </UPageCard>
        <UPageCard variant="subtle" class="p-4">
          <p class="text-xs text-muted uppercase tracking-wide font-medium mb-1">
            Temperatura CPU
          </p>
          <p
            class="text-xl font-bold font-mono"
            :class="latestPing.cpu_temperatura > 85 ? 'text-error' : latestPing.cpu_temperatura > 70 ? 'text-warning' : 'text-highlighted'"
          >
            {{ latestPing.cpu_temperatura }}°C
          </p>
        </UPageCard>
        <UPageCard variant="subtle" class="p-4">
          <p class="text-xs text-muted uppercase tracking-wide font-medium mb-1">
            Sinal DNB
          </p>
          <div
            class="flex items-center gap-2"
            :class="latestPing.dnb_sinal === 0 ? 'text-error' : latestPing.dnb_sinal < 3 ? 'text-warning' : 'text-success'"
          >
            <UIcon :name="sinalIcon(latestPing.dnb_sinal)" class="size-5" />
            <span class="text-xl font-bold font-mono">{{ latestPing.dnb_sinal }}</span>
          </div>
        </UPageCard>
      </div>

      <!-- Aviso banner -->
      <UAlert
        v-if="latestPing?.aviso"
        icon="i-lucide-triangle-alert"
        color="warning"
        variant="subtle"
        :title="latestPing.aviso"
        class="mb-6"
      />

      <!-- Pings table -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <UInput
            v-model="globalFilter"
            icon="i-lucide-search"
            placeholder="Pesquisar por evento, aviso..."
            class="max-w-sm"
          />
          <div class="flex items-center gap-2 text-xs text-muted">
            <span
              class="inline-block size-2 rounded-full animate-pulse"
              :class="status === 'pending' ? 'bg-warning' : 'bg-success'"
            />
            {{ status === 'pending' ? 'A atualizar...' : `${pings.length} pings · atualiza a cada 5s` }}
          </div>
        </div>

        <UTable
          v-model:global-filter="globalFilter"
          :data="pings"
          :columns="columns"
          :loading="status === 'pending'"
          :ui="{
            base: 'table-fixed border-separate border-spacing-0',
            thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
            tbody: '[&>tr]:last:[&>td]:border-b-0',
            th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
            td: 'border-b border-default'
          }"
        />

        <div
          v-if="status !== 'pending' && pings.length === 0"
          class="flex flex-col items-center justify-center py-16 text-center"
        >
          <UIcon name="i-lucide-radio-tower" class="size-12 text-muted mb-3" />
          <p class="font-medium text-highlighted">
            Nenhum ping encontrado
          </p>
          <p class="text-sm text-muted mt-1">
            Ainda não existem dados de telemetria para o Locker #{{ lockerId }}.
          </p>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
