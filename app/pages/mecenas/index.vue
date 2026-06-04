<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Column, Row, SortingState, Table } from '@tanstack/table-core'

interface Donation {
  id_doacao: number
  mecena_nif_nipc: string
  nome_entidade?: string
  data: string
  valor_transacao: number
  tipo_donativo: 'NUMERARIO' | 'TRANSFERENCIA' | 'REFERENCIA' | 'CHEQUE'
  anonimo: boolean
  url_comprovativo: string
  estado: 'ACEITE' | 'REJEITADO' | 'PENDENTE'
}

interface DonationStats {
  total: number
  totalAceite: number
  aceites: number
  pendentes: number
  rejeitadas: number
}

type DonationTableRef = {
  tableApi?: Table<Donation>
}

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')

const { isAdmin, patronNif } = useAuth()

const statusModalOpen = ref(false)
const selectedDonation = ref<Donation | null>(null)

const serverLimit = 25
const serverOffset = ref(0)

// Search term (debounced) — drives a SERVER-side search so it matches across
// the whole dataset, not just the current page.
const globalFilter = ref('')
const debouncedQ = refDebounced(globalFilter, 350)

// Only admins (all donations) and patrons (their own) have a donations list.
// Guarding the URL also avoids the malformed `/api/patrons//donations` request
// when a non-patron lands here with an empty nif.
const canFetch = computed(() => isAdmin.value || !!patronNif.value)

const fetchUrl = computed<string | null>(() => {
  if (!canFetch.value) return null
  const base = isAdmin.value ? '/api/donations' : `/api/patrons/${patronNif.value}/donations`
  const qParam = debouncedQ.value.trim() ? `&q=${encodeURIComponent(debouncedQ.value.trim())}` : ''
  return `${base}?limit=${serverLimit}&offset=${serverOffset.value}${qParam}`
})

const { data: rawData, status, refresh } = await useFetch<{ items: Donation[], total: number, limit: number, offset: number }>(
  () => fetchUrl.value ?? '',
  { lazy: true, server: false, immediate: false, watch: false, default: () => ({ items: [], total: 0, limit: serverLimit, offset: 0 }) }
)
watch(fetchUrl, (url) => {
  if (url) refresh()
}, { immediate: true })

// Aggregate cards (admin) — independent of pagination, honouring the search term.
const statsUrl = computed<string | null>(() =>
  isAdmin.value ? `/api/donations/stats${debouncedQ.value.trim() ? `?q=${encodeURIComponent(debouncedQ.value.trim())}` : ''}` : null
)
const { data: statsData, refresh: refreshStats } = await useFetch<DonationStats | null>(
  () => statsUrl.value ?? '',
  { lazy: true, server: false, immediate: false, watch: false, default: () => null }
)
watch(statsUrl, (url) => {
  if (url) refreshStats()
}, { immediate: true })

const donations = computed<Donation[]>(() => rawData.value?.items ?? [])
const serverTotal = computed(() => rawData.value?.total ?? 0)

function loadPage(page: number) {
  serverOffset.value = (page - 1) * serverLimit
}

const serverPage = computed(() => Math.floor(serverOffset.value / serverLimit) + 1)

function badgeColor(estado: string): 'warning' | 'success' | 'error' {
  if (estado === 'ACEITE') return 'success'
  if (estado === 'REJEITADO') return 'error'
  return 'warning'
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('pt-PT')
}

function formatEUR(v: number) {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(v)
}

const modoLabel: Record<string, string> = {
  NUMERARIO: 'Numerário',
  TRANSFERENCIA: 'Transferência',
  REFERENCIA: 'Ref. Multibanco',
  CHEQUE: 'Cheque'
}

function formatModo(tipo: string) {
  return modoLabel[tipo] ?? tipo
}

function renderSortableHeader<T>(column: Column<T, unknown>, label: string) {
  const isSorted = column.getIsSorted()
  return h(UButton, {
    color: 'neutral',
    variant: 'ghost',
    label,
    icon: isSorted
      ? isSorted === 'asc'
        ? 'i-lucide-arrow-up-narrow-wide'
        : 'i-lucide-arrow-down-wide-narrow'
      : 'i-lucide-arrow-up-down',
    class: '-mx-2.5',
    onClick: () => column.toggleSorting(column.getIsSorted() === 'asc')
  })
}

function getColumnLabel(columnId: string) {
  return ({
    id_doacao: 'N.º',
    nome_entidade: 'Mecenas',
    data: 'Data',
    valor_transacao: 'Valor',
    tipo_donativo: 'Modo',
    estado: 'Estado'
  }[columnId] || columnId)
}

function openStatusModal(donation: Donation) {
  selectedDonation.value = donation
  statusModalOpen.value = true
}

const toast = useToast()

function downloadPDF(donation: Donation) {
  if (!donation.url_comprovativo) {
    toast.add({
      title: 'Comprovativo não disponível',
      description: 'O comprovativo ainda não foi gerado para esta doação.',
      icon: 'i-lucide-alert-circle',
      color: 'warning'
    })
    return
  }
  const fileName = donation.url_comprovativo.split('/').pop()!
  window.open(`/api/download/files?nome=${encodeURIComponent(fileName)}`, '_blank')
}

function getRowItems(row: Row<Donation>) {
  const items: object[] = []

  items.push({
    label: 'Ver detalhes',
    icon: 'i-lucide-eye',
    to: `/mecenas/${row.original.id_doacao}`
  })

  if (isAdmin.value) {
    items.push({ type: 'separator' })
    items.push({
      label: 'Mudar estado',
      icon: 'i-lucide-refresh-cw',
      onSelect() { openStatusModal(row.original) }
    })
  }

  if (row.original.estado === 'ACEITE') {
    items.push({ type: 'separator' })
    items.push({
      label: 'Descarregar comprovativo',
      icon: 'i-lucide-download',
      onSelect() { downloadPDF(row.original) }
    })
  }

  return items
}

const adminColumns: TableColumn<Donation>[] = [
  {
    accessorKey: 'id_doacao',
    header: ({ column }) => renderSortableHeader(column, 'N.º'),
    cell: ({ row }) => h('span', { class: 'font-mono text-sm text-muted' }, `#${row.original.id_doacao}`)
  },
  {
    accessorKey: 'nome_entidade',
    header: ({ column }) => renderSortableHeader(column, 'Mecenas'),
    cell: ({ row }) =>
      h('div', undefined, [
        h('p', { class: 'font-medium text-highlighted' }, row.original.nome_entidade ?? row.original.mecena_nif_nipc),
        h('p', { class: 'text-xs text-muted font-mono' }, row.original.mecena_nif_nipc)
      ])
  },
  {
    accessorKey: 'data',
    header: ({ column }) => renderSortableHeader(column, 'Data'),
    cell: ({ row }) => h('span', undefined, formatDate(row.original.data))
  },
  {
    accessorKey: 'valor_transacao',
    header: ({ column }) => renderSortableHeader(column, 'Valor'),
    cell: ({ row }) => h('span', { class: 'font-semibold tabular-nums' }, formatEUR(row.original.valor_transacao))
  },
  {
    accessorKey: 'tipo_donativo',
    header: ({ column }) => renderSortableHeader(column, 'Modo'),
    cell: ({ row }) =>
      h(UBadge, { variant: 'subtle', color: 'neutral', size: 'sm' },
        () => formatModo(row.original.tipo_donativo)
      )
  },
  {
    accessorKey: 'estado',
    header: ({ column }) => renderSortableHeader(column, 'Estado'),
    cell: ({ row }) =>
      h(UBadge, { variant: 'subtle', color: badgeColor(row.original.estado), size: 'sm' },
        () => row.original.estado
      )
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: ({ row }) =>
      h('div', { class: 'text-right' },
        h(UDropdownMenu, { content: { align: 'end' }, items: getRowItems(row) },
          () => h(UButton, { icon: 'i-lucide-ellipsis-vertical', color: 'neutral', variant: 'ghost', class: 'ml-auto' })
        )
      )
  }
]

const patronColumns: TableColumn<Donation>[] = [
  {
    accessorKey: 'id_doacao',
    header: ({ column }) => renderSortableHeader(column, 'N.º'),
    cell: ({ row }) => h('span', { class: 'font-mono text-sm text-muted' }, `#${row.original.id_doacao}`)
  },
  {
    accessorKey: 'data',
    header: ({ column }) => renderSortableHeader(column, 'Data'),
    cell: ({ row }) => h('span', undefined, formatDate(row.original.data))
  },
  {
    accessorKey: 'valor_transacao',
    header: ({ column }) => renderSortableHeader(column, 'Valor'),
    cell: ({ row }) => h('span', { class: 'font-semibold tabular-nums' }, formatEUR(row.original.valor_transacao))
  },
  {
    accessorKey: 'tipo_donativo',
    header: ({ column }) => renderSortableHeader(column, 'Modo'),
    cell: ({ row }) =>
      h(UBadge, { variant: 'subtle', color: 'neutral', size: 'sm' },
        () => formatModo(row.original.tipo_donativo)
      )
  },
  {
    accessorKey: 'estado',
    header: ({ column }) => renderSortableHeader(column, 'Estado'),
    cell: ({ row }) =>
      h(UBadge, { variant: 'subtle', color: badgeColor(row.original.estado), size: 'sm' },
        () => row.original.estado
      )
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: ({ row }) =>
      h('div', { class: 'text-right' },
        h(UDropdownMenu, { content: { align: 'end' }, items: getRowItems(row) },
          () => h(UButton, { icon: 'i-lucide-ellipsis-vertical', color: 'neutral', variant: 'ghost', class: 'ml-auto' })
        )
      )
  }
]

const columns = computed(() => isAdmin.value ? adminColumns : patronColumns)
const pageTitle = computed(() => isAdmin.value ? 'Gestão de Doações' : 'As Minhas Doações')
const newDonationPath = computed(() => isAdmin.value ? '/mecenas/doacao_manual' : '/mecenas/doacao')

const stats = computed(() => {
  // Admin: use the server aggregate (whole filtered dataset).
  const s = statsData.value
  if (s) {
    return {
      total: formatEUR(s.totalAceite),
      count: s.total,
      aceites: s.aceites,
      pendentes: s.pendentes,
      rejeitadas: s.rejeitadas
    }
  }
  // Patron: derive from the loaded page (a patron's dataset is small).
  const list = donations.value
  const totalAceite = list.filter(d => d.estado === 'ACEITE').reduce((sum, d) => sum + Number(d.valor_transacao), 0)
  return {
    total: formatEUR(totalAceite),
    count: serverTotal.value,
    aceites: list.filter(d => d.estado === 'ACEITE').length,
    pendentes: list.filter(d => d.estado === 'PENDENTE').length,
    rejeitadas: list.filter(d => d.estado === 'REJEITADO').length
  }
})

const cardUi = { container: 'gap-y-1.5', wrapper: 'items-start', leading: 'p-2.5 rounded-full bg-primary/10 ring ring-inset ring-primary/25', title: 'font-normal text-muted text-xs uppercase' }

const statCards = computed(() => [
  { title: 'Total Aceite', icon: 'i-lucide-circle-dollar-sign', value: stats.value.total, color: 'text-highlighted' },
  { title: 'Doações', icon: 'i-lucide-hand-coins', value: stats.value.count, color: 'text-highlighted' },
  { title: 'Aceites', icon: 'i-lucide-check-circle', value: stats.value.aceites, color: 'text-success' },
  { title: 'Pendentes', icon: 'i-lucide-clock', value: stats.value.pendentes, color: 'text-warning' }
])

const columnVisibility = ref()
const sorting = ref<SortingState>([{ id: 'data', desc: true }])
const tableRef = useTemplateRef<DonationTableRef>('tableRef')

const hideableColumns = computed(() => {
  return (tableRef.value?.tableApi?.getAllColumns() ?? [])
    .filter((column: Column<Donation, unknown>) => column.getCanHide())
    .map((column: Column<Donation, unknown>) => ({
      label: getColumnLabel(column.id),
      type: 'checkbox' as const,
      checked: column.getIsVisible(),
      onUpdateChecked(checked: boolean) {
        tableRef.value?.tableApi
          ?.getColumn(column.id)
          ?.toggleVisibility(!!checked)
      },
      onSelect(e?: Event) {
        e?.preventDefault()
      }
    }))
})

watch(globalFilter, () => {
  serverOffset.value = 0
})
</script>

<template>
  <UDashboardPanel id="mecenas">
    <template #header>
      <UDashboardNavbar :title="pageTitle">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton
            label="Nova Doação"
            icon="i-lucide-plus"
            color="primary"
            :to="newDonationPath"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UPageGrid class="lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-px mb-6">
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
        <div class="flex flex-wrap items-center justify-between gap-1.5">
          <UInput
            v-model="globalFilter"
            class="max-w-sm"
            icon="i-lucide-search"
            :placeholder="isAdmin ? 'Pesquisar por mecenas, valor...' : 'Pesquisar doações...'"
          />

          <div class="flex flex-wrap items-center gap-1.5">
            <UDropdownMenu :items="hideableColumns" :content="{ align: 'end' }">
              <UButton
                label="Colunas"
                color="neutral"
                variant="outline"
                trailing-icon="i-lucide-settings-2"
              />
            </UDropdownMenu>
          </div>
        </div>

        <UTable
          ref="tableRef"
          v-model:column-visibility="columnVisibility"
          v-model:sorting="sorting"
          :data="donations"
          :columns="columns"
          :loading="status === 'pending'"
          class="shrink-0"
          :ui="{
            base: 'table-fixed border-separate border-spacing-0',
            thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
            tbody: '[&>tr]:last:[&>td]:border-b-0',
            th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
            td: 'border-b border-default',
            separator: 'h-0'
          }"
        />

        <div
          v-if="serverTotal > 0"
          class="flex items-center justify-between gap-3 border-t border-default pt-4 mt-auto"
        >
          <div class="text-sm text-muted">
            {{ serverTotal }} registo(s) · página {{ serverPage }} de {{ Math.ceil(serverTotal / serverLimit) || 1 }}
          </div>

          <div class="flex items-center gap-1.5">
            <UPagination
              :page="serverPage"
              :items-per-page="serverLimit"
              :total="serverTotal"
              @update:page="loadPage"
            />
          </div>
        </div>

        <div
          v-if="status !== 'pending' && donations.length === 0"
          class="flex flex-col items-center justify-center py-16 text-center"
        >
          <UIcon name="i-lucide-hand-coins" class="size-12 text-muted mb-3" />
          <p class="font-medium text-highlighted">
            Nenhuma doação encontrada
          </p>
          <p class="text-sm text-muted mt-1">
            {{ isAdmin ? 'Ainda não existem doações registadas.' : 'Ainda não fez nenhuma doação.' }}
          </p>
          <UButton
            label="Nova Doação"
            icon="i-lucide-plus"
            color="primary"
            class="mt-4"
            :to="newDonationPath"
          />
        </div>
      </div>

      <MecenasDonationStatusModal
        v-model:open="statusModalOpen"
        :donation="selectedDonation"
        @updated="() => { refresh(); refreshStats() }"
      />
    </template>
  </UDashboardPanel>
</template>
