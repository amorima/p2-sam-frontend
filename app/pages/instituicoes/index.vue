<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Row } from '@tanstack/table-core'
import { printVoucher } from '~/utils/voucherPDF'
import type { Need, NeedItem } from '~/utils/mockData'
import { useNeeds } from '~/composables/useNeeds'

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')

const { isAdmin, isInstitution, institutionNif, setRole } = useAuth()
const { needs, institutions } = useNeeds()

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

function openStatusModal(need: Need) {
  selectedNeed.value = need
  statusModalOpen.value = true
}

function nomeInstituicao(nif: string): string {
  return institutions.value.find(i => i.resource.nif_nipc === nif)?.entity.nome_entidade ?? nif
}

function downloadVoucher(need: Need, item: NeedItem) {
  if (!item.match_ref) return
  printVoucher({
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

  if (isAdmin.value) {
    items.push({
      label: 'Mudar estado',
      icon: 'i-lucide-refresh-cw',
      onSelect() { openStatusModal(need) }
    })
    if (need.estado === 'PENDENTE') {
      items.push({
        label: 'Aprovar pedido',
        icon: 'i-lucide-check-circle',
        to: '/instituicoes/aprovacao'
      })
    }
  }

  const vouchers = need.items.filter(i => i.match_tipo === 'VOUCHER' && i.match_ref)
  if (vouchers.length) {
    if (items.length) items.push({ type: 'separator' })
    vouchers.forEach((it) => {
      items.push({
        label: `Voucher: ${it.tipo_bem_servico}`,
        icon: 'i-lucide-download',
        onSelect() { downloadVoucher(need, it) }
      })
    })
  }

  if (items.length === 0) {
    items.push({ type: 'label', label: 'Sem ações disponíveis' })
  }
  return items
}

const adminColumns: TableColumn<Need>[] = [
  {
    accessorKey: 'id_pedido',
    header: 'N.º',
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
    header: 'Data',
    cell: ({ row }) => h('span', undefined, formatDate(row.original.data))
  },
  {
    accessorKey: 'items',
    header: 'Itens',
    cell: ({ row }) =>
      h('span', { class: 'tabular-nums' }, `${row.original.items.length}`)
  },
  {
    accessorKey: 'urgente',
    header: 'Urgente',
    cell: ({ row }) =>
      row.original.urgente
        ? h(UBadge, { variant: 'subtle', color: 'error', size: 'sm', icon: 'i-lucide-zap' }, () => 'Urgente')
        : h('span', { class: 'text-xs text-muted' }, '—')
  },
  {
    accessorKey: 'estado',
    header: 'Estado',
    cell: ({ row }) =>
      h(UBadge, { variant: 'subtle', color: badgeColor(row.original.estado), size: 'sm' },
        () => row.original.estado
      )
  },
  {
    id: 'actions',
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
    header: 'N.º',
    cell: ({ row }) => h('span', { class: 'font-mono text-sm text-muted' }, `#${row.original.id_pedido}`)
  },
  {
    accessorKey: 'data',
    header: 'Data',
    cell: ({ row }) => h('span', undefined, formatDate(row.original.data))
  },
  {
    accessorKey: 'items',
    header: 'Itens',
    cell: ({ row }) => h('span', { class: 'tabular-nums' }, `${row.original.items.length}`)
  },
  {
    accessorKey: 'urgente',
    header: 'Urgente',
    cell: ({ row }) =>
      row.original.urgente
        ? h(UBadge, { variant: 'subtle', color: 'error', size: 'sm', icon: 'i-lucide-zap' }, () => 'Urgente')
        : h('span', { class: 'text-xs text-muted' }, '—')
  },
  {
    accessorKey: 'estado',
    header: 'Estado',
    cell: ({ row }) =>
      h(UBadge, { variant: 'subtle', color: badgeColor(row.original.estado), size: 'sm' },
        () => row.original.estado
      )
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const vouchers = row.original.items.filter(i => i.match_tipo === 'VOUCHER' && i.match_ref)
      if (vouchers.length === 0) {
        return h('div', { class: 'text-right text-xs text-muted italic' },
          row.original.estado === 'PENDENTE' ? 'Aguarda aprovação' : (row.original.estado === 'REJEITADO' ? 'Recusado' : 'Em alocação')
        )
      }
      return h('div', { class: 'flex justify-end' },
        h(UDropdownMenu, {
          content: { align: 'end' },
          items: vouchers.map(it => ({
            label: it.tipo_bem_servico,
            icon: 'i-lucide-download',
            onSelect: () => downloadVoucher(row.original, it)
          }))
        }, () => h(UButton, { icon: 'i-lucide-download', label: 'Vouchers', color: 'primary', variant: 'subtle', size: 'sm' }))
      )
    }
  }
]

const columns = computed(() => isAdmin.value ? adminColumns : institutionColumns)
const pageTitle = computed(() => isAdmin.value ? 'Gestão de Pedidos' : 'Os Meus Pedidos')
const newRequestPath = computed(() => isAdmin.value ? '/instituicoes/pedido_manual' : '/instituicoes/pedido')

const stats = computed(() => {
  const list = filteredNeeds.value
  return {
    total: list.length,
    pendentes: list.filter(n => n.estado === 'PENDENTE').length,
    aceites: list.filter(n => n.estado === 'ACEITE').length,
    urgentes: list.filter(n => n.urgente && n.estado === 'PENDENTE').length
  }
})

const globalFilter = ref('')

const firstInstitution = computed(() => institutions.value[0])
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
      <UAlert
        icon="i-lucide-flask-conical"
        color="info"
        variant="subtle"
        title="Modo de demonstração"
        :description="`Vista atual: ${isAdmin ? 'Administrador' : 'Instituição'}`"
        class="mb-6"
      >
        <template #actions>
          <UButton
            v-if="isAdmin"
            label="Ver como Instituição"
            size="sm"
            color="info"
            variant="subtle"
            icon="i-lucide-building-2"
            @click="setRole('institution', firstInstitution?.resource.nif_nipc ?? '500999888', firstInstitution?.entity.nome_entidade ?? 'Centro Social Bom Samaritano')"
          />
          <UButton
            v-else
            label="Ver como Admin"
            size="sm"
            color="info"
            variant="subtle"
            icon="i-lucide-shield"
            @click="setRole('admin')"
          />
        </template>
      </UAlert>

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <UPageCard variant="subtle" class="p-4">
          <p class="text-xs text-muted uppercase tracking-wide font-medium mb-1">
            Total Pedidos
          </p>
          <p class="text-xl font-bold text-highlighted">
            {{ stats.total }}
          </p>
        </UPageCard>
        <UPageCard variant="subtle" class="p-4">
          <p class="text-xs text-muted uppercase tracking-wide font-medium mb-1">
            Pendentes
          </p>
          <p class="text-xl font-bold text-warning">
            {{ stats.pendentes }}
          </p>
        </UPageCard>
        <UPageCard variant="subtle" class="p-4">
          <p class="text-xs text-muted uppercase tracking-wide font-medium mb-1">
            Aceites
          </p>
          <p class="text-xl font-bold text-success">
            {{ stats.aceites }}
          </p>
        </UPageCard>
        <UPageCard variant="subtle" class="p-4">
          <p class="text-xs text-muted uppercase tracking-wide font-medium mb-1">
            Urgentes
          </p>
          <p class="text-xl font-bold text-error">
            {{ stats.urgentes }}
          </p>
        </UPageCard>
      </div>

      <div class="space-y-4">
        <UInput
          v-model="globalFilter"
          icon="i-lucide-search"
          :placeholder="isAdmin ? 'Pesquisar por instituição, NIF...' : 'Pesquisar pedidos...'"
          class="max-w-sm"
        />

        <UTable
          v-model:global-filter="globalFilter"
          :data="filteredNeeds"
          :columns="columns"
          :ui="{
            base: 'table-fixed border-separate border-spacing-0',
            thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
            tbody: '[&>tr]:last:[&>td]:border-b-0',
            th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
            td: 'border-b border-default'
          }"
        />

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
