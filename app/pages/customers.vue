<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Column, Row, SortingState, Table } from '@tanstack/table-core'
import type { User } from '~/types'
import type { AuthSession } from '~/composables/useAuth'

definePageMeta({ middleware: 'admin-only' })

const UAvatar = resolveComponent('UAvatar')
const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const UCheckbox = resolveComponent('UCheckbox')

type HideableColumnItem = {
  label: string
  type: 'checkbox'
  checked: boolean
  onUpdateChecked: (checked: boolean) => void
  onSelect: (e?: Event) => void
}

type CustomersTableRef = {
  tableApi?: Table<User>
}

const toast = useToast()
const router = useRouter()
const table = useTemplateRef<CustomersTableRef>('table')

const globalFilter = ref('')
const columnVisibility = ref()
const rowSelection = ref<Record<string, boolean>>({})
const sorting = ref<SortingState>([])
const selectedActorTypes = ref<string[]>([])
const ACTOR_TYPES: User['actorType'][] = ['Mecenas', 'Negócio', 'Instituição', 'Cidadão']

const serverLimit = 25
const serverOffset = ref(0)

const customersUrl = computed(() => `/api/customers?limit=${serverLimit}&offset=${serverOffset.value}`)

const { data: rawCustomersData, status, refresh } = await useFetch<{ items: User[], total: number, limit: number, offset: number }>(
  customersUrl,
  { lazy: true }
)

const data = computed<User[]>(() => rawCustomersData.value?.items ?? [])
const serverTotal = computed(() => rawCustomersData.value?.total ?? 0)
const serverPage = computed(() => Math.floor(serverOffset.value / serverLimit) + 1)

function loadCustomersPage(page: number) {
  serverOffset.value = (page - 1) * serverLimit
}

const session = useCookie<AuthSession | null>('auth-session')
const authHeader = computed(() =>
  session.value?.accessToken
    ? { authorization: `Bearer ${session.value.accessToken}` }
    : undefined
)

function getColumnLabel(columnId: string) {
  return (
    {
      id: 'ID',
      name: 'Nome',
      email: 'Email',
      actorType: 'Tipo',
      status: 'Estado'
    }[columnId] || columnId
  )
}

function renderSortableHeader(column: Column<User, unknown>, label: string) {
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
  return (table.value?.tableApi?.getAllColumns() ?? [])
    .filter((column: Column<User, unknown>) => column.getCanHide())
    .map((column: Column<User, unknown>) => ({
      label: getColumnLabel(column.id),
      type: 'checkbox' as const,
      checked: column.getIsVisible(),
      onUpdateChecked(checked: boolean) {
        table.value?.tableApi
          ?.getColumn(column.id)
          ?.toggleVisibility(!!checked)
      },
      onSelect(e?: Event) {
        e?.preventDefault()
      }
    }))
})

async function deleteCustomer(user: User) {
  if (!user.kind) return
  if (!confirm(`Eliminar ${user.name}? Esta ação não pode ser anulada.`)) return

  try {
    await $fetch(`/api/customers/${user.kind}/${encodeURIComponent(String(user.id))}`, {
      method: 'DELETE',
      headers: authHeader.value
    })
    toast.add({
      title: 'Utilizador eliminado',
      description: `${user.name} foi removido.`,
      color: 'success'
    })
    await refresh()
  } catch (err: unknown) {
    const e = err as { statusMessage?: string, data?: { description?: string } }
    toast.add({
      title: 'Erro ao eliminar',
      description: e?.data?.description ?? e?.statusMessage ?? 'Tente novamente.',
      color: 'error'
    })
  }
}

interface BlockTarget {
  users: User[]
  mode: 'block' | 'unblock'
  defaultReason: string | null
  subject: string | null
}
const blockModalOpen = ref(false)
const blockTarget = shallowRef<BlockTarget | null>(null)

function openBlockModal(users: User[]) {
  if (!users.length) return
  blockTarget.value = {
    users,
    mode: 'block',
    defaultReason: users.length === 1 ? users[0]!.reason ?? null : null,
    subject: users.length === 1 ? users[0]!.name : null
  }
  blockModalOpen.value = true
}

function openUnblockModal(users: User[]) {
  if (!users.length) return
  blockTarget.value = {
    users,
    mode: 'unblock',
    defaultReason: users.length === 1 ? users[0]!.reason ?? null : null,
    subject: users.length === 1 ? users[0]!.name : null
  }
  blockModalOpen.value = true
}

async function applyBlock(users: User[], blocked: boolean, reason: string | null) {
  const valid = users.filter(u => !!u.kind)
  if (!valid.length) return

  const results = await Promise.allSettled(
    valid.map(u =>
      $fetch(`/api/customers/${u.kind}/${encodeURIComponent(String(u.id))}/block`, {
        method: 'PATCH',
        body: { blocked: blocked ? 1 : 0, reason },
        headers: authHeader.value
      })
    )
  )
  const failed = results.filter(r => r.status === 'rejected').length
  if (failed) {
    toast.add({
      title: `${failed} de ${valid.length} atualizações falharam`,
      color: 'error'
    })
  } else if (valid.length === 1) {
    toast.add({
      title: blocked ? 'Utilizador bloqueado' : 'Utilizador desbloqueado',
      description: valid[0]!.name,
      color: 'success'
    })
  } else {
    toast.add({
      title: blocked
        ? `${valid.length} utilizadores bloqueados`
        : `${valid.length} utilizadores desbloqueados`,
      color: 'success'
    })
  }
  rowSelection.value = {}
  await refresh()
}

async function onBlockConfirm(reason: string) {
  const target = blockTarget.value
  blockTarget.value = null
  if (!target) return
  await applyBlock(target.users, true, reason)
}

async function onUnblockConfirm() {
  const target = blockTarget.value
  blockTarget.value = null
  if (!target) return
  await applyBlock(target.users, false, null)
}

async function setUserBlocked(user: User, blocked: boolean) {
  if (!user.kind) return
  if (blocked) {
    openBlockModal([user])
    return
  }
  if (user.reason) {
    openUnblockModal([user])
    return
  }
  await applyBlock([user], false, null)
}

async function bulkDelete() {
  const rows = table.value?.tableApi?.getFilteredSelectedRowModel().rows ?? []
  if (!rows.length) return
  if (!confirm(`Eliminar ${rows.length} utilizadores selecionados?`)) return

  const results = await Promise.allSettled(
    rows.map((r) => {
      const u = r.original
      if (!u.kind) return Promise.resolve()
      return $fetch(`/api/customers/${u.kind}/${encodeURIComponent(String(u.id))}`, {
        method: 'DELETE',
        headers: authHeader.value
      })
    })
  )
  const failed = results.filter(r => r.status === 'rejected').length
  if (failed) {
    toast.add({ title: `${failed} eliminações falharam`, color: 'error' })
  } else {
    toast.add({ title: `${rows.length} utilizadores eliminados`, color: 'success' })
  }
  rowSelection.value = {}
  await refresh()
}

const selectedRows = computed(() =>
  table.value?.tableApi?.getFilteredSelectedRowModel().rows ?? []
)
const isSingleSelection = computed(() => selectedRows.value.length === 1)
const singleSelected = computed(() =>
  isSingleSelection.value ? selectedRows.value[0]!.original : null
)
const showBulkBlock = computed(() => {
  if (selectedRows.value.length === 0) return false
  if (isSingleSelection.value) return !singleSelected.value?.blocked
  return true
})
const showBulkUnblock = computed(() => {
  if (selectedRows.value.length === 0) return false
  if (isSingleSelection.value) return !!singleSelected.value?.blocked
  return true
})

async function bulkSetBlocked(blocked: boolean) {
  const users = selectedRows.value.map(r => r.original).filter(u => !!u.kind)
  if (!users.length) return
  if (blocked) {
    openBlockModal(users)
    return
  }
  await applyBlock(users, false, null)
}

function getRowItems(row: Row<User>): Array<Record<string, unknown>> {
  const u = row.original
  const items: Array<Record<string, unknown>> = [
    { type: 'label', label: 'Ações' },
    {
      label: 'Copiar ID',
      icon: 'i-lucide-copy',
      onSelect() {
        navigator.clipboard.writeText(String(u.id))
        toast.add({ title: 'ID copiado', description: String(u.id) })
      }
    },
    {
      label: 'Copiar email',
      icon: 'i-lucide-mail',
      onSelect() {
        navigator.clipboard.writeText(u.email)
        toast.add({ title: 'Email copiado', description: u.email })
      }
    },
    { type: 'separator' }
  ]

  if (u.kind) {
    items.push({
      label: 'Abrir perfil',
      icon: 'i-lucide-external-link',
      onSelect: () => router.push(`/utilizadores/${u.kind}/${encodeURIComponent(String(u.id))}`)
    })
  }

  if (u.kind) {
    items.push({
      label: u.blocked ? 'Desbloquear utilizador' : 'Bloquear utilizador',
      icon: u.blocked ? 'i-lucide-shield-check' : 'i-lucide-shield-off',
      color: u.blocked ? undefined : 'warning',
      onSelect: () => setUserBlocked(u, !u.blocked)
    })
  }

  items.push({
    label: 'Eliminar',
    icon: 'i-lucide-trash',
    color: 'error',
    onSelect: () => deleteCustomer(u)
  })

  return items
}

const columns: TableColumn<User>[] = [
  {
    id: 'select',
    header: ({ table }) =>
      h(UCheckbox, {
        'modelValue': table.getIsSomePageRowsSelected()
          ? 'indeterminate'
          : table.getIsAllPageRowsSelected(),
        'onUpdate:modelValue': (value: boolean | 'indeterminate') =>
          table.toggleAllPageRowsSelected(!!value),
        'ariaLabel': 'Selecionar tudo'
      }),
    cell: ({ row }) =>
      h(UCheckbox, {
        'modelValue': row.getIsSelected(),
        'onUpdate:modelValue': (value: boolean | 'indeterminate') =>
          row.toggleSelected(!!value),
        'ariaLabel': 'Selecionar linha'
      })
  },
  {
    accessorKey: 'id',
    header: ({ column }) => renderSortableHeader(column, 'ID'),
    cell: ({ row }) =>
      h('span', { class: 'font-mono text-xs text-muted' }, String(row.original.id))
  },
  {
    accessorKey: 'name',
    header: ({ column }) => renderSortableHeader(column, 'Nome'),
    cell: ({ row }) => {
      return h('div', { class: 'flex items-center gap-3' }, [
        h(UAvatar, {
          ...row.original.avatar,
          size: 'lg'
        }),
        h('div', undefined, [
          h('p', { class: 'font-medium text-highlighted' }, row.original.name),
          h('p', { class: 'text-xs text-muted' }, row.original.email)
        ])
      ])
    }
  },
  {
    accessorKey: 'email',
    header: ({ column }) => renderSortableHeader(column, 'Email')
  },
  {
    accessorKey: 'actorType',
    filterFn: (row, columnId, value) => {
      if (!Array.isArray(value) || value.length === 0) return true
      return value.includes(row.getValue(columnId))
    },
    header: ({ column }) => {
      const isActive = selectedActorTypes.value.length > 0
      return h(
        UDropdownMenu,
        {
          content: { align: 'start' },
          items: ACTOR_TYPES.map(t => ({
            label: t,
            type: 'checkbox' as const,
            checked: selectedActorTypes.value.includes(t),
            onUpdateChecked(checked: boolean) {
              const next = new Set(selectedActorTypes.value)
              if (checked) next.add(t)
              else next.delete(t)
              selectedActorTypes.value = Array.from(next)
              column.setFilterValue(selectedActorTypes.value.length ? selectedActorTypes.value : undefined)
            },
            onSelect(e?: Event) { e?.preventDefault() }
          }))
        },
        () =>
          h(UButton, {
            color: isActive ? 'primary' : 'neutral',
            variant: 'ghost',
            label: 'Tipo',
            trailingIcon: isActive ? 'i-lucide-filter-x' : 'i-lucide-filter',
            class: '-mx-2.5'
          })
      )
    },
    cell: ({ row }) =>
      h(
        UBadge,
        { variant: 'subtle', color: 'neutral' },
        () => row.original.actorType
      )
  },
  {
    accessorKey: 'status',
    header: ({ column }) => renderSortableHeader(column, 'Estado'),
    filterFn: 'equals',
    cell: ({ row }) => {
      const u = row.original
      const color = u.blocked ? ('error' as const) : ('success' as const)
      const label = u.blocked ? 'Bloqueado' : 'Ativo'
      const badge = h(UBadge, { class: 'capitalize self-start', variant: 'subtle', color }, () => label)
      if (u.blocked && u.reason) {
        return h('div', { class: 'flex flex-col gap-0.5' }, [
          badge,
          h('span', { class: 'text-xs text-[var(--ui-text-muted)] max-w-[10rem] truncate', title: u.reason }, u.reason)
        ])
      }
      return badge
    }
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      return h(
        'div',
        { class: 'text-right' },
        h(
          UDropdownMenu,
          {
            content: { align: 'end' },
            items: getRowItems(row)
          },
          () =>
            h(UButton, {
              icon: 'i-lucide-ellipsis-vertical',
              color: 'neutral',
              variant: 'ghost',
              class: 'ml-auto'
            })
        )
      )
    }
  }
]
</script>

<template>
  <UDashboardPanel id="users">
    <template #header>
      <UDashboardNavbar title="Utilizadores">
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
          <CustomersAddModal @created="refresh()" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-wrap items-center justify-between gap-1.5">
        <UInput
          v-model="globalFilter"
          class="max-w-sm"
          icon="i-lucide-search"
          placeholder="Pesquisar utilizadores..."
        />

        <div class="flex flex-wrap items-center gap-1.5">
          <UButton
            v-if="showBulkBlock"
            label="Bloquear"
            color="warning"
            variant="subtle"
            icon="i-lucide-shield-off"
            @click="bulkSetBlocked(true)"
          >
            <template #trailing>
              <UKbd>{{ selectedRows.length }}</UKbd>
            </template>
          </UButton>

          <UButton
            v-if="showBulkUnblock"
            label="Desbloquear"
            color="success"
            variant="subtle"
            icon="i-lucide-shield-check"
            @click="bulkSetBlocked(false)"
          >
            <template #trailing>
              <UKbd>{{ selectedRows.length }}</UKbd>
            </template>
          </UButton>

          <UButton
            v-if="table?.tableApi?.getFilteredSelectedRowModel().rows.length"
            label="Eliminar selecionados"
            color="error"
            variant="subtle"
            icon="i-lucide-trash"
            @click="bulkDelete"
          >
            <template #trailing>
              <UKbd>
                {{ table?.tableApi?.getFilteredSelectedRowModel().rows.length }}
              </UKbd>
            </template>
          </UButton>

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
        ref="table"
        v-model:global-filter="globalFilter"
        v-model:column-visibility="columnVisibility"
        v-model:row-selection="rowSelection"
        v-model:sorting="sorting"
        class="shrink-0"
        :data="data"
        :columns="columns"
        :loading="status === 'pending'"
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
          {{ serverTotal }} utilizador(es) · página {{ serverPage }} de {{ Math.ceil(serverTotal / serverLimit) || 1 }}
        </div>

        <div class="flex items-center gap-1.5">
          <UPagination
            :page="serverPage"
            :items-per-page="serverLimit"
            :total="serverTotal"
            @update:page="loadCustomersPage"
          />
        </div>
      </div>

      <CustomersBlockReasonModal
        v-model:open="blockModalOpen"
        :mode="blockTarget?.mode ?? 'block'"
        :count="blockTarget?.users.length ?? 1"
        :subject="blockTarget?.subject ?? null"
        :default-reason="blockTarget?.defaultReason ?? null"
        @confirm="onBlockConfirm"
        @unblock="onUnblockConfirm"
      />
    </template>
  </UDashboardPanel>
</template>
