<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { getPaginationRowModel } from '@tanstack/table-core'
import type { Column, SortingState, Table } from '@tanstack/table-core'
import type { VNode } from 'vue'
import { useNeeds } from '~/composables/useNeeds'
import type { BusinessMatchEstado } from '~/utils/domain'

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

interface BusinessPedido {
  id_pedido: number
  id_item: number
  data: string
  nome_entidade: string
  nif_instituicao: string
  tipo_bem_servico: string
  match_ref: string
  business_nif: string
  estado: BusinessMatchEstado
  motivo?: string | null
  urgente: boolean
}

type PedidosTableRef = {
  tableApi?: Table<BusinessPedido>
}

const toast = useToast()
const { isAdmin, isBusiness, businessNif } = useAuth()
const { needs, businesses, setBusinessResponse } = useNeeds()

const filterState = ref<'TODOS' | BusinessMatchEstado>('TODOS')
const globalFilter = ref('')
const columnVisibility = ref()
const sorting = ref<SortingState>([{ id: 'id_pedido', desc: true }])
const pagination = ref({ pageIndex: 0, pageSize: 10 })
const paginationOptions = { getPaginationRowModel: getPaginationRowModel() }
const tableRef = useTemplateRef<PedidosTableRef>('tableRef')

const allBusinessPedidos = computed<BusinessPedido[]>(() => {
  const result: BusinessPedido[] = []
  for (const need of needs.value) {
    if (need.estado !== 'ACEITE') continue
    for (const item of need.items) {
      if (item.match_tipo === 'NEGOCIO' && item.match_business_nif) {
        result.push({
          id_pedido: need.id_pedido,
          id_item: item.id_item,
          data: need.data,
          nome_entidade: need.nome_entidade ?? need.nif_nipc,
          nif_instituicao: need.nif_nipc,
          tipo_bem_servico: item.tipo_bem_servico,
          match_ref: item.match_ref ?? '',
          business_nif: item.match_business_nif,
          estado: item.match_business_estado ?? 'PENDENTE',
          motivo: item.match_business_motivo,
          urgente: need.urgente
        })
      }
    }
  }
  return result
})

const visiblePedidos = computed<BusinessPedido[]>(() => {
  let list = allBusinessPedidos.value
  if (isBusiness.value && businessNif.value) {
    list = list.filter(p => p.business_nif === businessNif.value)
  }
  if (filterState.value !== 'TODOS') {
    list = list.filter(p => p.estado === filterState.value)
  }
  return list
})

const stats = computed(() => {
  const list = isBusiness.value && businessNif.value
    ? allBusinessPedidos.value.filter(p => p.business_nif === businessNif.value)
    : allBusinessPedidos.value
  return {
    total: list.length,
    pendentes: list.filter(p => p.estado === 'PENDENTE').length,
    aceites: list.filter(p => p.estado === 'ACEITE').length,
    recusados: list.filter(p => p.estado === 'RECUSADO').length,
    concluidos: list.filter(p => p.estado === 'CONCLUIDO').length
  }
})

const cardUi = { container: 'gap-y-1.5', wrapper: 'items-start', leading: 'p-2.5 rounded-full bg-primary/10 ring ring-inset ring-primary/25', title: 'font-normal text-muted text-xs uppercase' }

const statCards = computed(() => [
  { title: 'Total', icon: 'i-lucide-briefcase', value: stats.value.total, color: 'text-highlighted' },
  { title: 'Pendentes', icon: 'i-lucide-clock', value: stats.value.pendentes, color: 'text-warning' },
  { title: 'Aceites', icon: 'i-lucide-thumbs-up', value: stats.value.aceites, color: 'text-info' },
  { title: 'Concluídos', icon: 'i-lucide-check-circle', value: stats.value.concluidos, color: 'text-success' },
  { title: 'Recusados', icon: 'i-lucide-thumbs-down', value: stats.value.recusados, color: 'text-error' }
])

const tabItems = computed(() => [
  { label: `Todos (${stats.value.total})`, value: 'TODOS' },
  { label: `Pendentes (${stats.value.pendentes})`, value: 'PENDENTE' },
  { label: `Aceites (${stats.value.aceites})`, value: 'ACEITE' },
  { label: `Concluídos (${stats.value.concluidos})`, value: 'CONCLUIDO' },
  { label: `Recusados (${stats.value.recusados})`, value: 'RECUSADO' }
])

watch([globalFilter, filterState], () => {
  pagination.value = { ...pagination.value, pageIndex: 0 }
})

function estadoBadge(e: BusinessMatchEstado): { color: 'warning' | 'success' | 'error' | 'info', label: string, icon: string } {
  if (e === 'ACEITE') return { color: 'info', label: 'Aceite', icon: 'i-lucide-thumbs-up' }
  if (e === 'RECUSADO') return { color: 'error', label: 'Recusado', icon: 'i-lucide-thumbs-down' }
  if (e === 'CONCLUIDO') return { color: 'success', label: 'Concluído', icon: 'i-lucide-check-circle' }
  return { color: 'warning', label: 'Pendente', icon: 'i-lucide-clock' }
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })
}

function nomeNegocio(nif: string): string {
  return businesses.value.find(b => b.resource.nif_nipc === nif)?.entity.nome_entidade ?? nif
}

function getColumnLabel(columnId: string) {
  return (
    {
      id_pedido: 'Pedido',
      tipo_bem_servico: 'Bem / Serviço',
      nome_entidade: 'Instituição',
      business: 'Negócio',
      urgente: 'Prioridade',
      estado: 'Estado'
    }[columnId] || columnId
  )
}

function renderSortableHeader(column: Column<BusinessPedido, unknown>, label: string) {
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

const hideableColumns = computed<HideableColumnItem[]>(() => {
  return (tableRef.value?.tableApi?.getAllColumns() ?? [])
    .filter((column: Column<BusinessPedido, unknown>) => column.getCanHide())
    .map((column: Column<BusinessPedido, unknown>) => ({
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

const showRefuseModal = ref(false)
const refuseTarget = ref<BusinessPedido | null>(null)
const refuseReason = ref('')

function openRefuse(p: BusinessPedido) {
  refuseTarget.value = p
  refuseReason.value = ''
  showRefuseModal.value = true
}

function confirmRefuse() {
  if (!refuseTarget.value) return
  if (!refuseReason.value.trim()) {
    toast.add({ title: 'Motivo obrigatório', description: 'Indique o motivo da recusa.', icon: 'i-lucide-alert-circle', color: 'warning' })
    return
  }
  setBusinessResponse(refuseTarget.value.id_pedido, refuseTarget.value.id_item, 'RECUSADO', refuseReason.value.trim())
  toast.add({ title: 'Pedido recusado', icon: 'i-lucide-thumbs-down', color: 'error' })
  showRefuseModal.value = false
  refuseTarget.value = null
}

function accept(p: BusinessPedido) {
  setBusinessResponse(p.id_pedido, p.id_item, 'ACEITE')
  toast.add({ title: 'Pedido aceite', description: `${p.tipo_bem_servico} para ${p.nome_entidade}`, icon: 'i-lucide-thumbs-up', color: 'success' })
}

function complete(p: BusinessPedido) {
  setBusinessResponse(p.id_pedido, p.id_item, 'CONCLUIDO')
  toast.add({ title: 'Pedido concluído', description: `Marcado como concluído.`, icon: 'i-lucide-check-circle', color: 'success' })
}

const columns: TableColumn<BusinessPedido>[] = [
  {
    accessorKey: 'id_pedido',
    header: ({ column }) => renderSortableHeader(column, 'Pedido'),
    cell: ({ row }) =>
      h('div', undefined, [
        h('p', { class: 'font-mono text-sm text-muted' }, `#${row.original.id_pedido}`),
        h('p', { class: 'text-xs text-muted' }, formatDate(row.original.data))
      ])
  },
  {
    accessorKey: 'tipo_bem_servico',
    header: ({ column }) => renderSortableHeader(column, 'Bem / Serviço'),
    cell: ({ row }) =>
      h('div', undefined, [
        h('p', { class: 'font-medium text-highlighted' }, row.original.tipo_bem_servico),
        h('p', { class: 'text-xs text-muted truncate' }, row.original.match_ref)
      ])
  },
  {
    accessorKey: 'nome_entidade',
    header: ({ column }) => renderSortableHeader(column, 'Instituição'),
    cell: ({ row }) =>
      h('div', undefined, [
        h('p', { class: 'font-medium' }, row.original.nome_entidade),
        h('p', { class: 'text-xs text-muted font-mono' }, row.original.nif_instituicao)
      ])
  },
  {
    id: 'business',
    accessorFn: row => nomeNegocio(row.business_nif),
    header: ({ column }) => renderSortableHeader(column, 'Negócio'),
    cell: ({ row }) => {
      if (isBusiness.value) return h('span', { class: 'text-xs text-muted italic' }, '—')
      return h('span', { class: 'text-sm' }, nomeNegocio(row.original.business_nif))
    }
  },
  {
    accessorKey: 'urgente',
    header: ({ column }) => renderSortableHeader(column, 'Prioridade'),
    cell: ({ row }) =>
      row.original.urgente
        ? h(UBadge, { variant: 'subtle', color: 'error', size: 'sm', icon: 'i-lucide-zap' }, () => 'Urgente')
        : h('span', { class: 'text-xs text-muted' }, '—')
  },
  {
    accessorKey: 'estado',
    header: ({ column }) => renderSortableHeader(column, 'Estado'),
    filterFn: 'equals',
    cell: ({ row }) => {
      const b = estadoBadge(row.original.estado)
      return h(UBadge, { variant: 'subtle', color: b.color, icon: b.icon, size: 'sm' }, () => b.label)
    }
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: ({ row }) => {
      const p = row.original
      const canAct = isBusiness.value && (!businessNif.value || p.business_nif === businessNif.value)
      if (!canAct) {
        if (p.estado === 'RECUSADO' && p.motivo) {
          return h('span', { class: 'text-xs text-muted italic truncate block' }, `Motivo: ${p.motivo}`)
        }
        return h('span', { class: 'text-xs text-muted italic' }, '—')
      }
      const children: VNode[] = []
      if (p.estado === 'PENDENTE') {
        children.push(
          h(UButton, { label: 'Aceitar', icon: 'i-lucide-check', color: 'primary', variant: 'subtle', size: 'sm', onClick: () => accept(p) }),
          h(UButton, { label: 'Recusar', icon: 'i-lucide-x', color: 'error', variant: 'subtle', size: 'sm', onClick: () => openRefuse(p) })
        )
      } else if (p.estado === 'ACEITE') {
        children.push(
          h(UButton, { label: 'Marcar concluído', icon: 'i-lucide-check-circle', color: 'success', variant: 'subtle', size: 'sm', onClick: () => complete(p) })
        )
      } else if (p.estado === 'RECUSADO') {
        children.push(h('span', { class: 'text-xs text-muted italic' }, p.motivo ?? 'Recusado'))
      } else {
        children.push(h('span', { class: 'text-xs text-success italic' }, 'Concluído'))
      }
      return h('div', { class: 'flex gap-1 justify-end flex-wrap' }, children as import('vue').VNodeArrayChildren)
    }
  }
]
</script>

<template>
  <UDashboardPanel id="negocios">
    <template #header>
      <UDashboardNavbar :title="isAdmin ? 'Gestão de Pedidos a Negócios' : 'Pedidos Atribuídos'">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton
            v-if="isBusiness"
            label="O Meu Negócio"
            icon="i-lucide-store"
            color="primary"
            variant="outline"
            to="/negocios/meu"
          />
          <UButton
            v-if="isAdmin"
            label="Gerir Negócios"
            icon="i-lucide-store"
            color="primary"
            variant="outline"
            to="/negocios/gestao"
          />
          <UButton
            v-if="isAdmin"
            label="Registo Manual"
            icon="i-lucide-plus"
            color="primary"
            to="/negocios/registo"
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
        <UTabs
          v-model="filterState"
          :items="tabItems"
          value-key="value"
          color="primary"
          variant="pill"
          size="sm"
          class="w-full"
        />

        <div class="flex flex-wrap items-center justify-between gap-1.5">
          <UInput
            v-model="globalFilter"
            class="max-w-sm"
            icon="i-lucide-search"
            placeholder="Pesquisar pedidos..."
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
          :data="visiblePedidos"
          :columns="columns"
          :pagination-options="paginationOptions"
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
          v-if="visiblePedidos.length > 0"
          class="flex items-center justify-between gap-3 border-t border-default pt-4 mt-auto"
        >
          <div class="text-sm text-muted">
            {{ tableRef?.tableApi?.getFilteredRowModel().rows.length || 0 }} row(s)
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
          v-if="visiblePedidos.length === 0"
          class="flex flex-col items-center justify-center py-16 text-center"
        >
          <UIcon name="i-lucide-briefcase" class="size-12 text-muted mb-3" />
          <p class="font-medium text-highlighted">
            Sem pedidos atribuídos
          </p>
          <p class="text-sm text-muted mt-1">
            {{ isBusiness ? 'O SAM ainda não atribuiu pedidos ao seu negócio.' : 'Nenhum pedido encontrado com este filtro.' }}
          </p>
        </div>
      </div>

      <UModal
        v-model:open="showRefuseModal"
        title="Recusar Pedido"
        :description="refuseTarget ? `${refuseTarget.tipo_bem_servico} — ${refuseTarget.nome_entidade}` : ''"
      >
        <template #body>
          <div class="space-y-4">
            <UFormField label="Motivo da Recusa" required>
              <UTextarea
                v-model="refuseReason"
                :rows="4"
                placeholder="Indique o motivo pelo qual está a recusar este pedido..."
                class="w-full"
              />
            </UFormField>
            <div class="flex justify-end gap-2">
              <UButton
                label="Cancelar"
                color="neutral"
                variant="subtle"
                @click="showRefuseModal = false"
              />
              <UButton
                label="Confirmar Recusa"
                icon="i-lucide-x"
                color="error"
                @click="confirmRefuse"
              />
            </div>
          </div>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>
