<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { getPaginationRowModel } from '@tanstack/table-core'
import type { Column, Row, SortingState, Table } from '@tanstack/table-core'
import { useNeeds } from '~/composables/useNeeds'
import type { Business, BusinessStatus } from '~/utils/mockData'

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

type BusinessesTableRef = {
  tableApi?: Table<Business>
}

const toast = useToast()
const { isAdmin } = useAuth()
const { needs, businesses, updateBusiness, setBusinessStatus, removeBusiness } = useNeeds()

if (!isAdmin.value) {
  await navigateTo('/negocios')
}

const globalFilter = ref('')
const columnVisibility = ref()
const sorting = ref<SortingState>([])
const pagination = ref({ pageIndex: 0, pageSize: 10 })
const paginationOptions = { getPaginationRowModel: getPaginationRowModel() }
const tableRef = useTemplateRef<BusinessesTableRef>('tableRef')

function businessStatus(b: Business): BusinessStatus {
  return b.status ?? 'ATIVO'
}

function pedidosCount(nif: string) {
  let total = 0
  for (const need of needs.value) {
    for (const item of need.items) {
      if (item.match_tipo === 'NEGOCIO' && item.match_business_nif === nif) {
        total++
      }
    }
  }
  return total
}

const stats = computed(() => {
  const list = businesses.value
  return {
    total: list.length,
    ativos: list.filter(b => businessStatus(b) === 'ATIVO').length,
    suspensos: list.filter(b => businessStatus(b) === 'SUSPENSO').length,
    ofertas: list.reduce((acc, b) => acc + b.offers.length, 0)
  }
})

function renderSortableHeader(column: Column<Business, unknown>, label: string) {
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
  return (
    {
      nif_nipc: 'NIF/NIPC',
      nome_entidade: 'Nome',
      email_login: 'Email',
      iban: 'IBAN',
      offers: 'Ofertas',
      pedidos: 'Pedidos',
      status: 'Estado'
    }[columnId] || columnId
  )
}

// Edit modal state
const editOpen = ref(false)
const editTarget = ref<Business | null>(null)
const editName = ref('')
const editEmail = ref('')
const editIban = ref('')
const editLat = ref<number>(0)
const editLng = ref<number>(0)

function openEdit(b: Business) {
  editTarget.value = b
  editName.value = b.entity.nome_entidade
  editEmail.value = b.entity.email_login
  editIban.value = b.entity.iban
  editLat.value = b.resource.geo_latitude
  editLng.value = b.resource.geo_longitude
  editOpen.value = true
}

function saveEdit() {
  if (!editTarget.value) return
  if (!editName.value.trim() || !editEmail.value.trim() || !editIban.value.trim()) {
    toast.add({ title: 'Campos obrigatórios', description: 'Preencha nome, email e IBAN.', icon: 'i-lucide-alert-circle', color: 'warning' })
    return
  }
  updateBusiness(editTarget.value.resource.nif_nipc, b => ({
    ...b,
    entity: {
      ...b.entity,
      nome_entidade: editName.value.trim(),
      email_login: editEmail.value.trim(),
      iban: editIban.value.trim()
    },
    resource: {
      ...b.resource,
      geo_latitude: editLat.value,
      geo_longitude: editLng.value
    }
  }))
  toast.add({ title: 'Negócio atualizado', icon: 'i-lucide-check', color: 'success' })
  editOpen.value = false
  editTarget.value = null
}

// Suspend / remove modals
const removeOpen = ref(false)
const removeTarget = ref<Business | null>(null)

function openRemove(b: Business) {
  removeTarget.value = b
  removeOpen.value = true
}

function confirmRemove() {
  if (!removeTarget.value) return
  const nome = removeTarget.value.entity.nome_entidade
  removeBusiness(removeTarget.value.resource.nif_nipc)
  toast.add({ title: 'Negócio removido', description: `${nome} foi removido.`, icon: 'i-lucide-trash', color: 'error' })
  removeOpen.value = false
  removeTarget.value = null
}

function toggleSuspend(b: Business) {
  const next: BusinessStatus = businessStatus(b) === 'ATIVO' ? 'SUSPENSO' : 'ATIVO'
  setBusinessStatus(b.resource.nif_nipc, next)
  toast.add({
    title: next === 'SUSPENSO' ? 'Negócio suspenso' : 'Negócio reativado',
    description: `${b.entity.nome_entidade} — ${next === 'SUSPENSO' ? 'não receberá novos pedidos.' : 'voltou a receber pedidos.'}`,
    icon: next === 'SUSPENSO' ? 'i-lucide-pause' : 'i-lucide-play',
    color: next === 'SUSPENSO' ? 'warning' : 'success'
  })
}

function getRowItems(row: Row<Business>) {
  const b = row.original
  const suspended = businessStatus(b) === 'SUSPENSO'
  return [
    { type: 'label', label: 'Ações' },
    {
      label: 'Copiar NIF/NIPC',
      icon: 'i-lucide-copy',
      onSelect() {
        navigator.clipboard.writeText(b.resource.nif_nipc)
        toast.add({ title: 'NIF/NIPC copiado', icon: 'i-lucide-clipboard-check' })
      }
    },
    {
      label: 'Editar dados',
      icon: 'i-lucide-pencil',
      onSelect() { openEdit(b) }
    },
    { type: 'separator' },
    {
      label: suspended ? 'Reativar negócio' : 'Suspender negócio',
      icon: suspended ? 'i-lucide-play' : 'i-lucide-pause',
      onSelect() { toggleSuspend(b) }
    },
    {
      label: 'Remover negócio',
      icon: 'i-lucide-trash',
      color: 'error',
      onSelect() { openRemove(b) }
    }
  ]
}

const hideableColumns = computed<HideableColumnItem[]>(() => {
  return (tableRef.value?.tableApi?.getAllColumns() ?? [])
    .filter((column: Column<Business, unknown>) => column.getCanHide())
    .map((column: Column<Business, unknown>) => ({
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

const columns: TableColumn<Business>[] = [
  {
    id: 'nif_nipc',
    accessorFn: row => row.resource.nif_nipc,
    header: ({ column }) => renderSortableHeader(column, 'NIF/NIPC'),
    cell: ({ row }) => h('span', { class: 'font-mono text-sm text-muted' }, row.original.resource.nif_nipc)
  },
  {
    id: 'nome_entidade',
    accessorFn: row => row.entity.nome_entidade,
    header: ({ column }) => renderSortableHeader(column, 'Nome'),
    cell: ({ row }) =>
      h('div', undefined, [
        h('p', { class: 'font-medium text-highlighted' }, row.original.entity.nome_entidade)
      ])
  },
  {
    id: 'email_login',
    accessorFn: row => row.entity.email_login,
    header: ({ column }) => renderSortableHeader(column, 'Email'),
    cell: ({ row }) => h('span', { class: 'text-sm' }, row.original.entity.email_login)
  },
  {
    id: 'iban',
    accessorFn: row => row.entity.iban,
    header: ({ column }) => renderSortableHeader(column, 'IBAN'),
    cell: ({ row }) => h('span', { class: 'font-mono text-xs' }, row.original.entity.iban)
  },
  {
    id: 'offers',
    accessorFn: row => row.offers.length,
    header: ({ column }) => renderSortableHeader(column, 'Ofertas'),
    cell: ({ row }) => h('span', { class: 'tabular-nums' }, `${row.original.offers.length}`)
  },
  {
    id: 'pedidos',
    accessorFn: row => pedidosCount(row.resource.nif_nipc),
    header: ({ column }) => renderSortableHeader(column, 'Pedidos'),
    cell: ({ row }) => h('span', { class: 'tabular-nums' }, `${pedidosCount(row.original.resource.nif_nipc)}`)
  },
  {
    id: 'status',
    accessorFn: row => businessStatus(row),
    header: ({ column }) => renderSortableHeader(column, 'Estado'),
    filterFn: 'equals',
    cell: ({ row }) => {
      const s = businessStatus(row.original)
      const config = s === 'SUSPENSO'
        ? { color: 'warning' as const, label: 'Suspenso', icon: 'i-lucide-pause' }
        : { color: 'success' as const, label: 'Ativo', icon: 'i-lucide-check-circle' }
      return h(UBadge, { variant: 'subtle', color: config.color, icon: config.icon, size: 'sm' }, () => config.label)
    }
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
</script>

<template>
  <UDashboardPanel id="negocios-gestao">
    <template #header>
      <UDashboardNavbar title="Gestão de Negócios">
        <template #leading>
          <UDashboardSidebarCollapse />
          <UButton
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="ghost"
            to="/negocios"
            class="hidden lg:flex"
          />
        </template>
        <template #right>
          <UButton
            label="Registo Manual"
            icon="i-lucide-plus"
            color="primary"
            to="/negocios/registo"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <UPageCard variant="subtle" class="p-4">
          <p class="text-xs text-muted uppercase tracking-wide font-medium mb-1">
            Total
          </p>
          <p class="text-xl font-bold text-highlighted">
            {{ stats.total }}
          </p>
        </UPageCard>
        <UPageCard variant="subtle" class="p-4">
          <p class="text-xs text-muted uppercase tracking-wide font-medium mb-1">
            Ativos
          </p>
          <p class="text-xl font-bold text-success">
            {{ stats.ativos }}
          </p>
        </UPageCard>
        <UPageCard variant="subtle" class="p-4">
          <p class="text-xs text-muted uppercase tracking-wide font-medium mb-1">
            Suspensos
          </p>
          <p class="text-xl font-bold text-warning">
            {{ stats.suspensos }}
          </p>
        </UPageCard>
        <UPageCard variant="subtle" class="p-4">
          <p class="text-xs text-muted uppercase tracking-wide font-medium mb-1">
            Ofertas
          </p>
          <p class="text-xl font-bold text-info">
            {{ stats.ofertas }}
          </p>
        </UPageCard>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-1.5">
        <UInput
          v-model="globalFilter"
          class="max-w-sm"
          icon="i-lucide-search"
          placeholder="Pesquisar por NIF, nome, email..."
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
        :data="businesses"
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
        v-if="businesses.length > 0"
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
        v-if="businesses.length === 0"
        class="flex flex-col items-center justify-center py-16 text-center"
      >
        <UIcon name="i-lucide-store-off" class="size-12 text-muted mb-3" />
        <p class="font-medium text-highlighted">
          Sem negócios registados
        </p>
        <p class="text-sm text-muted mt-1">
          Use o registo manual para adicionar negócios à plataforma.
        </p>
        <UButton
          label="Registo Manual"
          icon="i-lucide-plus"
          color="primary"
          class="mt-4"
          to="/negocios/registo"
        />
      </div>

      <!-- Edit Modal -->
      <UModal
        v-model:open="editOpen"
        title="Editar Negócio"
        :description="editTarget ? editTarget.entity.nome_entidade : ''"
      >
        <template #body>
          <div class="space-y-4">
            <UFormField label="NIF / NIPC">
              <UInput
                :model-value="editTarget?.resource.nif_nipc"
                disabled
                class="w-full font-mono"
              />
            </UFormField>
            <UFormField label="Nome do Negócio" required>
              <UInput v-model="editName" class="w-full" />
            </UFormField>
            <UFormField label="Email" required>
              <UInput v-model="editEmail" type="email" class="w-full" />
            </UFormField>
            <UFormField label="IBAN" required>
              <UInput v-model="editIban" class="w-full font-mono" />
            </UFormField>
            <div class="grid grid-cols-2 gap-3">
              <UFormField label="Latitude">
                <UInput
                  v-model.number="editLat"
                  type="number"
                  step="0.0001"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Longitude">
                <UInput
                  v-model.number="editLng"
                  type="number"
                  step="0.0001"
                  class="w-full"
                />
              </UFormField>
            </div>
            <div class="flex justify-end gap-2 pt-2">
              <UButton
                label="Cancelar"
                color="neutral"
                variant="subtle"
                @click="editOpen = false"
              />
              <UButton
                label="Guardar"
                icon="i-lucide-check"
                color="primary"
                @click="saveEdit"
              />
            </div>
          </div>
        </template>
      </UModal>

      <!-- Remove confirmation modal -->
      <UModal
        v-model:open="removeOpen"
        title="Remover Negócio"
        :description="removeTarget ? `Tem a certeza que pretende remover ${removeTarget.entity.nome_entidade}?` : ''"
      >
        <template #body>
          <div class="space-y-4">
            <UAlert
              icon="i-lucide-alert-triangle"
              color="error"
              variant="subtle"
              title="Esta ação é irreversível"
              description="O negócio será removido permanentemente. Pedidos em andamento serão libertados para reatribuição."
            />
            <div class="flex justify-end gap-2">
              <UButton
                label="Cancelar"
                color="neutral"
                variant="subtle"
                @click="removeOpen = false"
              />
              <UButton
                label="Remover"
                icon="i-lucide-trash"
                color="error"
                @click="confirmRemove"
              />
            </div>
          </div>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>
