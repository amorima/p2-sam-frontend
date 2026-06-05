<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Column, Row, Table } from '@tanstack/table-core'
import type { Need, NeedItem } from '~/utils/domain'
import { useNeeds } from '~/composables/useNeeds'
import { useVouchers } from '~/composables/useVouchers'

const { openVoucher } = useVouchers()

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')

type HideableColumnItem = {
  label: string
  type: 'checkbox'
  checked: boolean
  onUpdateChecked: (checked: boolean) => void
  onSelect: (e?: Event) => void
}

type NeedsTableRef = {
  tableApi?: Table<Need>
}

const { isAdmin, isInstitution, institutionNif } = useAuth()
const toast = useToast()
const { needs, needsPagination, needsStats, page: needsPage, sortBy, sortDir, setSort, loadNeedsPage, searchNeeds, institutions, approveNeed } = useNeeds()

async function handleApprove(need: Need) {
  await approveNeed(need.id_pedido)
  toast.add({ title: 'Pedido aprovado', description: `#${need.id_pedido} — ${need.nome_entidade ?? need.nif_nipc}`, color: 'success' })
}

const statusModalOpen = ref(false)
const selectedNeed = ref<Need | null>(null)

const filteredNeeds = computed<Need[]>(() => {
  if (isInstitution.value && institutionNif.value) {
    return needs.value.filter(n => n.nif_nipc === institutionNif.value)
  }
  return needs.value
})

function badgeColor(estado: string): 'warning' | 'success' | 'error' {
  if (estado === 'ACEITE') return 'success'
  if (estado === 'REJEITADO') return 'error'
  return 'warning'
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('pt-PT')
}

function renderSortableHeader(field: string, label: string) {
  const isActive = sortBy.value === field
  const dir = isActive ? sortDir.value : null
  return h(UButton, {
    color: 'neutral',
    variant: 'ghost',
    label,
    icon: dir === 'asc'
      ? 'i-lucide-arrow-up-narrow-wide'
      : dir === 'desc'
        ? 'i-lucide-arrow-down-wide-narrow'
        : 'i-lucide-arrow-up-down',
    class: '-mx-2.5',
    onClick: () => setSort(field, isActive && dir === 'desc' ? 'asc' : 'desc')
  })
}

function getColumnLabel(columnId: string) {
  return (
    {
      id_pedido: 'N.º',
      nome_entidade: 'Instituição',
      data: 'Data',
      items: 'Itens',
      urgente: 'Urgente',
      estado: 'Estado'
    }[columnId] || columnId
  )
}

function openStatusModal(need: Need) {
  selectedNeed.value = need
  statusModalOpen.value = true
}

function nomeInstituicao(nif: string): string {
  return institutions.value.find(i => i.resource.nif_nipc === nif)?.entity.nome_entidade ?? nif
}

function downloadVoucher(need: Need, item: NeedItem) {
  if (!item.match_ref) return
  openVoucher({
    voucher_ref: item.match_ref,
    id_pedido: need.id_pedido,
    nif_nipc: need.nif_nipc,
    nome_entidade: need.nome_entidade ?? nomeInstituicao(need.nif_nipc),
    tipo_bem_servico: item.tipo_bem_servico
  })
}

function getRowItems(row: Row<Need>) {
  const items: object[] = []
  const need = row.original

  items.push({
    label: 'Ver detalhes',
    icon: 'i-lucide-eye',
    to: `/instituicoes/${need.id_pedido}`
  })

  if (isAdmin.value) {
    items.push({ type: 'separator' })
    items.push({
      label: 'Mudar estado',
      icon: 'i-lucide-refresh-cw',
      onSelect() { openStatusModal(need) }
    })
    if (need.estado === 'PENDENTE') {
      items.push({
        label: 'Aprovar pedido',
        icon: 'i-lucide-check-circle',
        onSelect() { handleApprove(need) }
      })
      items.push({
        label: 'Rejeitar pedido',
        icon: 'i-lucide-x-circle',
        onSelect() { openStatusModal(need) }
      })
    }
  }

  const vouchers = need.items.filter(i => i.match_tipo === 'VOUCHER' && i.match_ref)
  if (vouchers.length) {
    items.push({ type: 'separator' })
    vouchers.forEach((it) => {
      items.push({
        label: `Voucher: ${it.tipo_bem_servico}`,
        icon: 'i-lucide-download',
        onSelect() { downloadVoucher(need, it) }
      })
    })
  }

  return items
}

const adminColumns: TableColumn<Need>[] = [
  {
    accessorKey: 'id_pedido',
    header: () => renderSortableHeader('id_pedido', 'N.º'),
    cell: ({ row }) => h('span', { class: 'font-mono text-sm text-muted' }, `#${row.original.id_pedido}`)
  },
  {
    accessorKey: 'nome_entidade',
    header: 'Instituição',
    cell: ({ row }) =>
      h('div', undefined, [
        h('p', { class: 'font-medium text-highlighted' }, row.original.nome_entidade ?? nomeInstituicao(row.original.nif_nipc)),
        h('p', { class: 'text-xs text-muted font-mono' }, row.original.nif_nipc)
      ])
  },
  {
    accessorKey: 'data',
    header: () => renderSortableHeader('data', 'Data'),
    cell: ({ row }) => h('span', undefined, formatDate(row.original.data))
  },
  {
    id: 'items',
    accessorFn: row => row.items.length,
    header: 'Itens',
    cell: ({ row }) =>
      h('span', { class: 'tabular-nums' }, `${row.original.items.length}`)
  },
  {
    accessorKey: 'urgente',
    header: () => renderSortableHeader('urgente', 'Urgente'),
    cell: ({ row }) =>
      row.original.urgente
        ? h(UBadge, { variant: 'subtle', color: 'error', size: 'sm', icon: 'i-lucide-zap' }, () => 'Urgente')
        : h('span', { class: 'text-xs text-muted' }, '—')
  },
  {
    accessorKey: 'estado',
    header: () => renderSortableHeader('estado', 'Estado'),
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

const institutionColumns: TableColumn<Need>[] = [
  {
    accessorKey: 'id_pedido',
    header: () => renderSortableHeader('id_pedido', 'N.º'),
    cell: ({ row }) => h('span', { class: 'font-mono text-sm text-muted' }, `#${row.original.id_pedido}`)
  },
  {
    accessorKey: 'data',
    header: () => renderSortableHeader('data', 'Data'),
    cell: ({ row }) => h('span', undefined, formatDate(row.original.data))
  },
  {
    id: 'items',
    accessorFn: row => row.items.length,
    header: 'Itens',
    cell: ({ row }) => h('span', { class: 'tabular-nums' }, `${row.original.items.length}`)
  },
  {
    accessorKey: 'urgente',
    header: () => renderSortableHeader('urgente', 'Urgente'),
    cell: ({ row }) =>
      row.original.urgente
        ? h(UBadge, { variant: 'subtle', color: 'error', size: 'sm', icon: 'i-lucide-zap' }, () => 'Urgente')
        : h('span', { class: 'text-xs text-muted' }, '—')
  },
  {
    accessorKey: 'estado',
    header: () => renderSortableHeader('estado', 'Estado'),
    cell: ({ row }) =>
      h(UBadge, { variant: 'subtle', color: badgeColor(row.original.estado), size: 'sm' },
        () => row.original.estado
      )
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: ({ row }) => {
      const need = row.original
      const vouchers = need.items.filter(i => i.match_tipo === 'VOUCHER' && i.match_ref)
      const items: object[] = [{
        label: 'Ver detalhes',
        icon: 'i-lucide-eye',
        to: `/instituicoes/${need.id_pedido}`
      }]
      if (vouchers.length) {
        items.push({ type: 'separator' })
        vouchers.forEach((it) => {
          items.push({
            label: `Voucher: ${it.tipo_bem_servico}`,
            icon: 'i-lucide-download',
            onSelect: () => downloadVoucher(need, it)
          })
        })
      }
      return h('div', { class: 'text-right' },
        h(UDropdownMenu, { content: { align: 'end' }, items },
          () => h(UButton, { icon: 'i-lucide-ellipsis-vertical', color: 'neutral', variant: 'ghost', class: 'ml-auto' })
        )
      )
    }
  }
]

const columns = computed(() => isAdmin.value ? adminColumns : institutionColumns)
const pageTitle = computed(() => isAdmin.value ? 'Gestão de Pedidos' : 'Os Meus Pedidos')
const newRequestPath = computed(() => isAdmin.value ? '/instituicoes/pedido_manual' : '/instituicoes/pedido')

const stats = computed(() => {
  if (isAdmin.value) {
    return {
      total: needsStats.value.total,
      pendentes: needsStats.value.pendentes,
      aceites: needsStats.value.aceites,
      urgentes: needsStats.value.urgentes
    }
  }
  const list = filteredNeeds.value
  return {
    total: needsPagination.value.total,
    pendentes: list.filter(n => n.estado === 'PENDENTE').length,
    aceites: list.filter(n => n.estado === 'ACEITE').length,
    urgentes: list.filter(n => n.urgente && n.estado === 'PENDENTE').length
  }
})

const cardUi = { container: 'gap-y-1.5', wrapper: 'items-start', leading: 'p-2.5 rounded-full bg-primary/10 ring ring-inset ring-primary/25', title: 'font-normal text-muted text-xs uppercase' }

const statCards = computed(() => [
  { title: 'Total Pedidos', icon: 'i-lucide-clipboard-list', value: stats.value.total, color: 'text-highlighted' },
  { title: 'Pendentes', icon: 'i-lucide-clock', value: stats.value.pendentes, color: 'text-warning' },
  { title: 'Aceites', icon: 'i-lucide-check-circle', value: stats.value.aceites, color: 'text-success' },
  { title: 'Urgentes', icon: 'i-lucide-zap', value: stats.value.urgentes, color: 'text-error' }
])

const globalFilter = ref('')
// Server-side search (debounced): matches NIF + institution name across the
// whole dataset, not just the loaded page.
const debouncedQ = refDebounced(globalFilter, 350)
watch(debouncedQ, q => searchNeeds(q))
const columnVisibility = ref()
const tableRef = useTemplateRef<NeedsTableRef>('tableRef')

function onPageChange(page: number) {
  loadNeedsPage((page - 1) * needsPagination.value.limit)
}

const hideableColumns = computed<HideableColumnItem[]>(() => {
  return (tableRef.value?.tableApi?.getAllColumns() ?? [])
    .filter((column: Column<Need, unknown>) => column.getCanHide())
    .map((column: Column<Need, unknown>) => ({
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
</script>

<template>
  <UDashboardPanel id="instituicoes">
    <template #header>
      <UDashboardNavbar :title="pageTitle">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton
            label="Novo Pedido"
            icon="i-lucide-plus"
            color="primary"
            :to="newRequestPath"
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

      <div class="space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-1.5">
          <UInput
            v-model="globalFilter"
            class="max-w-sm"
            icon="i-lucide-search"
            :placeholder="isAdmin ? 'Pesquisar por instituição, NIF...' : 'Pesquisar pedidos...'"
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
          :data="filteredNeeds"
          :columns="columns"
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
          v-if="needsPagination.total > 0"
          class="flex items-center justify-between gap-3 border-t border-default pt-4 mt-auto"
        >
          <div class="text-sm text-muted">
            {{ needsPagination.total }} registo(s) · página {{ needsPage }} de {{ Math.ceil(needsPagination.total / needsPagination.limit) || 1 }}
          </div>

          <div class="flex items-center gap-1.5">
            <UPagination
              :page="needsPage"
              :items-per-page="needsPagination.limit"
              :total="needsPagination.total"
              @update:page="onPageChange"
            />
          </div>
        </div>

        <div
          v-if="filteredNeeds.length === 0"
          class="flex flex-col items-center justify-center py-16 text-center"
        >
          <UIcon name="i-lucide-clipboard-list" class="size-12 text-muted mb-3" />
          <p class="font-medium text-highlighted">
            Nenhum pedido encontrado
          </p>
          <p class="text-sm text-muted mt-1">
            {{ isAdmin ? 'Ainda não existem pedidos registados.' : 'Ainda não fez nenhum pedido.' }}
          </p>
          <UButton
            label="Novo Pedido"
            icon="i-lucide-plus"
            color="primary"
            class="mt-4"
            :to="newRequestPath"
          />
        </div>
      </div>

      <InstituicoesNeedStatusModal
        v-model:open="statusModalOpen"
        :need="selectedNeed"
      />
    </template>
  </UDashboardPanel>
</template>
