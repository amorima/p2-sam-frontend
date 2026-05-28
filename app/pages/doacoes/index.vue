<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { getPaginationRowModel } from '@tanstack/table-core'
import { useLeads } from '~/composables/useLeads'
import type { Lead, LeadEstado } from '~/utils/domain'
import { printPickupReport, type PickupReportLead } from '~/utils/pickupReportPDF'

const UBadge = resolveComponent('UBadge')

const { leads, effectiveEstado, expiresAt, hoursRemaining } = useLeads()

interface TableInstance {
  tableApi?: {
    getFilteredRowModel: () => { rows: unknown[] }
  }
}

const filterState = ref<'TODOS' | LeadEstado | 'EXPIRA_BREVE'>('TODOS')
const globalFilter = ref('')
const pagination = ref({ pageIndex: 0, pageSize: 20 })
const paginationOptions = { getPaginationRowModel: getPaginationRowModel() }
const tableRef = useTemplateRef<TableInstance>('tableRef')

interface EnrichedLead extends Lead {
  estadoEfetivo: LeadEstado
  expira_em: Date
  horas_restantes: number
}

const enrichedLeads = computed<EnrichedLead[]>(() =>
  leads.value.map(l => ({
    ...l,
    estadoEfetivo: effectiveEstado(l),
    expira_em: expiresAt(l),
    horas_restantes: hoursRemaining(l)
  }))
)

const filteredLeads = computed<EnrichedLead[]>(() => {
  if (filterState.value === 'TODOS') return enrichedLeads.value
  if (filterState.value === 'EXPIRA_BREVE') {
    return enrichedLeads.value.filter(l => l.estadoEfetivo === 'PENDENTE' && l.horas_restantes < 24)
  }
  return enrichedLeads.value.filter(l => l.estadoEfetivo === filterState.value)
})

const filteredCount = computed<number>(() => tableRef.value?.tableApi?.getFilteredRowModel().rows.length ?? filteredLeads.value.length)

watch([globalFilter, filterState], () => {
  pagination.value = { ...pagination.value, pageIndex: 0 }
})

const stats = computed(() => {
  const list = enrichedLeads.value
  return {
    total: list.length,
    entregues: list.filter(l => l.estadoEfetivo === 'ENTREGUE').length,
    pendentes: list.filter(l => l.estadoEfetivo === 'PENDENTE').length,
    expirados: list.filter(l => l.estadoEfetivo === 'EXPIRADO').length,
    expiraBreve: list.filter(l => l.estadoEfetivo === 'PENDENTE' && l.horas_restantes < 24).length
  }
})

const cardUi = { container: 'gap-y-1.5', wrapper: 'items-start', leading: 'p-2.5 rounded-full bg-primary/10 ring ring-inset ring-primary/25', title: 'font-normal text-muted text-xs uppercase' }

const statCards = computed(() => [
  { title: 'Total Leads', icon: 'i-lucide-heart-handshake', value: stats.value.total, color: 'text-highlighted' },
  { title: 'No Locker', icon: 'i-lucide-package-check', value: stats.value.entregues, color: 'text-success' },
  { title: 'No Prazo', icon: 'i-lucide-clock', value: stats.value.pendentes, color: 'text-warning' },
  { title: 'A Expirar <24h', icon: 'i-lucide-timer', value: stats.value.expiraBreve, color: 'text-warning' },
  { title: 'Vencidos', icon: 'i-lucide-clock-alert', value: stats.value.expirados, color: 'text-error' }
])

const tabItems = computed(() => [
  { label: `Todos (${stats.value.total})`, value: 'TODOS' },
  { label: `No locker (${stats.value.entregues})`, value: 'ENTREGUE' },
  { label: `Dentro do prazo (${stats.value.pendentes})`, value: 'PENDENTE' },
  { label: `A expirar (${stats.value.expiraBreve})`, value: 'EXPIRA_BREVE' },
  { label: `Vencidos (${stats.value.expirados})`, value: 'EXPIRADO' }
])

function estadoBadge(estado: LeadEstado): { color: 'success' | 'warning' | 'error', label: string, icon: string } {
  if (estado === 'ENTREGUE') return { color: 'success', label: 'No locker', icon: 'i-lucide-package-check' }
  if (estado === 'EXPIRADO') return { color: 'error', label: 'Vencido', icon: 'i-lucide-clock-alert' }
  return { color: 'warning', label: 'Dentro do prazo', icon: 'i-lucide-clock' }
}

function formatDate(d: string | Date) {
  const date = typeof d === 'string' ? new Date(d) : d
  return date.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatDateTime(d: string | Date) {
  const date = typeof d === 'string' ? new Date(d) : d
  return date.toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function formatRemaining(hours: number): string {
  if (hours <= 0) return 'Expirado'
  if (hours < 1) return `${Math.round(hours * 60)} min`
  if (hours < 48) return `${Math.floor(hours)}h ${Math.round((hours % 1) * 60)}m`
  return `${Math.floor(hours / 24)} dias`
}

const columns: TableColumn<EnrichedLead>[] = [
  {
    accessorKey: 'id_lead',
    header: 'N.º',
    cell: ({ row }) => h('span', { class: 'font-mono text-sm text-muted' }, `#${row.original.id_lead}`)
  },
  {
    accessorKey: 'item_pedido',
    header: 'Bem',
    cell: ({ row }) =>
      h('div', undefined, [
        h('p', { class: 'font-medium text-highlighted' }, row.original.item_pedido),
        h('p', { class: 'text-xs text-muted' }, `Pedido #${row.original.id_pedido}`)
      ])
  },
  {
    accessorKey: 'nome_entidade',
    header: 'Destino',
    cell: ({ row }) =>
      h('span', { class: 'text-sm' }, row.original.nome_entidade ?? '—')
  },
  {
    accessorKey: 'nome_cidadao',
    header: 'Cidadão',
    cell: ({ row }) =>
      h('div', undefined, [
        h('p', { class: 'font-medium' }, row.original.nome_cidadao),
        h('p', { class: 'text-xs text-muted truncate' }, row.original.contacto_cidadao)
      ])
  },
  {
    accessorKey: 'painel_nome',
    header: 'Painel',
    cell: ({ row }) =>
      h('span', { class: 'text-sm text-muted' }, row.original.painel_nome ?? `#${row.original.id_painel}`)
  },
  {
    accessorKey: 'pin_entrega',
    header: 'PIN',
    cell: ({ row }) => {
      const expired = row.original.estadoEfetivo === 'EXPIRADO'
      return h('span', {
        class: `font-mono tracking-widest text-sm ${expired ? 'line-through text-muted' : 'text-highlighted font-semibold'}`
      }, row.original.pin_entrega)
    }
  },
  {
    accessorKey: 'estadoEfetivo',
    header: 'Estado',
    cell: ({ row }) => {
      const e = estadoBadge(row.original.estadoEfetivo)
      return h(UBadge, { variant: 'subtle', color: e.color, icon: e.icon, size: 'sm' }, () => e.label)
    }
  },
  {
    id: 'localizacao',
    header: 'Localização',
    cell: ({ row }) => {
      const l = row.original
      if (l.estadoEfetivo === 'ENTREGUE' && l.locker_nome && l.porta != null) {
        return h('div', undefined, [
          h('p', { class: 'font-medium text-sm' }, l.locker_nome),
          h('p', { class: 'text-xs text-muted' }, `Porta ${String(l.porta).padStart(2, '0')}`)
        ])
      }
      if (l.estadoEfetivo === 'PENDENTE') {
        return h('div', undefined, [
          h('p', { class: 'text-sm' }, l.locker_nome ?? '—'),
          h('p', { class: 'text-xs text-muted' }, `Expira ${formatDate(l.expira_em)}`)
        ])
      }
      return h('span', { class: 'text-xs text-muted italic' }, 'Volta aos painéis')
    }
  },
  {
    id: 'tempo',
    header: 'Restante',
    cell: ({ row }) => {
      const l = row.original
      if (l.estadoEfetivo === 'ENTREGUE') {
        return h('span', { class: 'text-xs text-success' }, l.data_entrega ? `Depositado ${formatDateTime(l.data_entrega)}` : '—')
      }
      if (l.estadoEfetivo === 'EXPIRADO') {
        return h('span', { class: 'text-xs text-error' }, 'Vencido')
      }
      const urgent = l.horas_restantes < 24
      return h('span', { class: urgent ? 'text-xs font-semibold text-warning' : 'text-xs text-muted' }, formatRemaining(l.horas_restantes))
    }
  }
]

const pickupReady = computed<PickupReportLead[]>(() =>
  enrichedLeads.value
    .filter(l => l.estadoEfetivo === 'ENTREGUE')
    .map(l => ({
      id_lead: l.id_lead,
      data_entrega: l.data_entrega ?? null,
      nome_cidadao: l.nome_cidadao,
      item_pedido: l.item_pedido,
      nome_entidade: l.nome_entidade,
      locker_nome: l.locker_nome,
      porta: l.porta ?? null,
      pin_entrega: l.pin_entrega
    }))
)

function downloadReport() {
  printPickupReport(pickupReady.value)
}
</script>

<template>
  <UDashboardPanel id="doacoes-cidadaos">
    <template #header>
      <UDashboardNavbar title="Doações de Cidadãos">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton
            label="Relatório de Levantamento"
            icon="i-lucide-file-down"
            color="primary"
            :disabled="pickupReady.length === 0"
            @click="downloadReport"
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

      <div class="space-y-4">
        <div class="flex flex-wrap gap-2 items-center justify-between">
          <UTabs
            v-model="filterState"
            :items="tabItems"
            value-key="value"
            color="primary"
            variant="pill"
            size="sm"
            class="w-full sm:w-auto"
          />
          <UInput
            v-model="globalFilter"
            icon="i-lucide-search"
            placeholder="Pesquisar por cidadão, email, PIN, bem..."
            class="w-full sm:w-72"
          />
        </div>

        <UTable
          ref="tableRef"
          v-model:global-filter="globalFilter"
          v-model:pagination="pagination"
          :data="filteredLeads"
          :columns="columns"
          :pagination-options="paginationOptions"
          :ui="{
            base: 'table-fixed border-separate border-spacing-0',
            thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
            tbody: '[&>tr]:last:[&>td]:border-b-0',
            th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
            td: 'border-b border-default'
          }"
        />

        <TablePagination
          v-if="filteredLeads.length > 0"
          v-model="pagination"
          :total="filteredCount"
        />

        <div
          v-if="filteredLeads.length === 0"
          class="flex flex-col items-center justify-center py-16 text-center"
        >
          <UIcon name="i-lucide-heart-handshake" class="size-12 text-muted mb-3" />
          <p class="font-medium text-highlighted">
            Sem leads neste filtro
          </p>
          <p class="text-sm text-muted mt-1">
            Tente outro estado, ou aguarde que mais cidadãos interajam com os painéis.
          </p>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
