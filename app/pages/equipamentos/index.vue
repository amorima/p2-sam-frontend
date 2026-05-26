<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

interface Locker {
  locker_id: number
  tipo: string
  geo_latitude: number
  geo_longitude: number
  bateria_estado: number
  cpu_temperatura: number
  dnb_sinal: number
  aviso: string | null
  evento: string | null
  versao: string
  ultimo_ping: string
  saude: 'saudavel' | 'com_deficiencias' | 'erros' | 'desligado'
}

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')
const UIcon = resolveComponent('UIcon')

const { data: rawData, status, refresh } = await useFetch<{ lockers: Locker[] }>(
  '/api/equipamentos',
  { lazy: true, server: false }
)

useIntervalFn(() => refresh(), 15000)

const lockers = computed<Locker[]>(() => rawData.value?.lockers ?? [])

const globalFilter = ref('')

const saudeConfig: Record<string, { color: 'success' | 'warning' | 'error' | 'neutral', label: string }> = {
  saudavel: { color: 'success', label: 'Saudável' },
  com_deficiencias: { color: 'warning', label: 'Com Deficiências' },
  erros: { color: 'error', label: 'Erros' },
  desligado: { color: 'neutral', label: 'Desligado' }
}

function formatDate(d: string) {
  return new Date(d).toLocaleString('pt-PT')
}

function sinalIcon(sinal: number) {
  if (sinal === 0) return 'i-lucide-wifi-off'
  if (sinal <= 2) return 'i-lucide-signal-low'
  if (sinal <= 3) return 'i-lucide-signal-medium'
  return 'i-lucide-signal-high'
}

const stats = computed(() => {
  const list = lockers.value
  return {
    total: list.length,
    saudaveis: list.filter(l => l.saude === 'saudavel').length,
    deficiencias: list.filter(l => l.saude === 'com_deficiencias').length,
    erros: list.filter(l => l.saude === 'erros').length,
    desligados: list.filter(l => l.saude === 'desligado').length
  }
})

const cardUi = { container: 'gap-y-1.5', wrapper: 'items-start', leading: 'p-2.5 rounded-full bg-primary/10 ring ring-inset ring-primary/25', title: 'font-normal text-muted text-xs uppercase' }

const statCards = computed(() => [
  { title: 'Total', icon: 'i-lucide-server', value: stats.value.total, color: 'text-highlighted' },
  { title: 'Saudáveis', icon: 'i-lucide-heart-pulse', value: stats.value.saudaveis, color: 'text-success' },
  { title: 'Com Deficiências', icon: 'i-lucide-triangle-alert', value: stats.value.deficiencias, color: 'text-warning' },
  { title: 'Erros', icon: 'i-lucide-circle-x', value: stats.value.erros, color: 'text-error' },
  { title: 'Desligados', icon: 'i-lucide-power-off', value: stats.value.desligados, color: 'text-muted' }
])

const columns: TableColumn<Locker>[] = [
  {
    accessorKey: 'locker_id',
    header: 'ID',
    cell: ({ row }) => h('span', { class: 'font-mono text-sm text-muted' }, `#${row.original.locker_id}`)
  },
  {
    accessorKey: 'tipo',
    header: 'Equipamento',
    cell: ({ row }) => {
      const label = row.original.tipo === 'painel' ? 'Painel' : 'Locker'
      return h('div', undefined, [
        h('p', { class: 'font-medium text-highlighted' }, `${label} #${row.original.locker_id}`),
        h('p', { class: 'text-xs text-muted capitalize' }, row.original.tipo ?? '—')
      ])
    }
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
    accessorKey: 'ultimo_ping',
    header: 'Último Ping',
    cell: ({ row }) => h('span', { class: 'text-xs text-muted' }, formatDate(row.original.ultimo_ping))
  },
  {
    accessorKey: 'saude',
    header: 'Estado',
    cell: ({ row }) => {
      const cfg = saudeConfig[row.original.saude] ?? { color: 'neutral' as const, label: 'Desligado' }
      return h(UBadge, { variant: 'subtle', color: cfg.color, size: 'sm' }, () => cfg.label)
    }
  },
  {
    id: 'actions',
    cell: ({ row }) =>
      h('div', { class: 'text-right' },
        h(UButton, {
          icon: 'i-lucide-activity',
          label: 'Telemetria',
          color: 'neutral',
          variant: 'ghost',
          size: 'sm',
          to: `/equipamentos/${row.original.locker_id}`
        })
      )
  }
]
</script>

<template>
  <UDashboardPanel id="equipamentos">
    <template #header>
      <UDashboardNavbar title="Estado de Equipamentos">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton
            icon="i-lucide-refresh-cw"
            color="neutral"
            variant="ghost"
            :loading="status === 'pending'"
            @click="refresh()"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UPageGrid class="lg:grid-cols-5 gap-4 sm:gap-6 lg:gap-px mb-6">
        <UPageCard
          v-for="card in statCards"
          :key="card.title"
          variant="subtle"
          :icon="card.icon"
          :title="card.title"
          :ui="cardUi"
          class="lg:rounded-none first:rounded-l-lg last:rounded-r-lg hover:z-1"
        >
          <span :class="['text-2xl font-semibold', card.color]">{{ card.value }}</span>
        </UPageCard>
      </UPageGrid>

      <!-- Table -->
      <div class="space-y-4">
        <UInput
          v-model="globalFilter"
          icon="i-lucide-search"
          placeholder="Pesquisar por ID, tipo, estado..."
          class="max-w-sm"
        />

        <UTable
          v-model:global-filter="globalFilter"
          :data="lockers"
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
          v-if="status !== 'pending' && lockers.length === 0"
          class="flex flex-col items-center justify-center py-16 text-center"
        >
          <UIcon name="i-lucide-monitor-off" class="size-12 text-muted mb-3" />
          <p class="font-medium text-highlighted">
            Nenhum equipamento encontrado
          </p>
          <p class="text-sm text-muted mt-1">
            Ainda não existem dados de telemetria registados.
          </p>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
