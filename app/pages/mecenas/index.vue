<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { type Column, type Row, type SortingState, type Table, getPaginationRowModel } from '@tanstack/table-core'

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

type DonationTableRef = {
  tableApi?: Table<Donation>
}

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')

const { isAdmin, patronNif } = useAuth()

const statusModalOpen = ref(false)
const selectedDonation = ref<Donation | null>(null)

const fetchUrl = computed(() =>
  isAdmin.value
    ? '/api/donations'
    : `/api/patrons/${patronNif.value}/donations`
)

const { data: rawData, status, refresh } = await useFetch<{ donations: Donation[] }>(
  fetchUrl,
  { lazy: true, server: false }
)

const donations = computed<Donation[]>(() => rawData.value?.donations ?? [])

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
  const list = donations.value
  const total = list.filter(d => d.estado === 'ACEITE').reduce((s, d) => s + Number(d.valor_transacao), 0)
  return {
    total: formatEUR(total),
    count: list.length,
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

const globalFilter = ref('')
const columnVisibility = ref()
const sorting = ref<SortingState>([])
const pagination = ref({ pageIndex: 0, pageSize: 10 })
const paginationOptions = { getPaginationRowModel: getPaginationRowModel() }
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
  pagination.value = { ...pagination.value, pageIndex: 0 }
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
          v-model:global-filter="globalFilter"
          v-model:column-visibility="columnVisibility"
          v-model:sorting="sorting"
          v-model:pagination="pagination"
          :data="donations"
          :columns="columns"
          :pagination-options="paginationOptions"
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
          v-if="donations.length > 0"
          class="flex items-center justify-between gap-3 border-t border-default pt-4 mt-auto"
        >
          <div class="text-sm text-muted">
            {{ tableRef?.tableApi?.getFilteredRowModel().rows.length || 0 }} registo(s)
          </div>

          <div class="flex items-center gap-1.5">
            <UPagination
              :default-page="(tableRef?.tableApi?.getState().pagination.pageIndex || 0) + 1"
              :items-per-page="tableRef?.tableApi?.getState().pagination.pageSize"
              :total="tableRef?.tableApi?.getFilteredRowModel().rows.length"
              @update:page="(p: number) => tableRef?.tableApi?.setPageIndex(p - 1)"
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
        @updated="refresh()"
      />
    </template>
  </UDashboardPanel>
</template>
