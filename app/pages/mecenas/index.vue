<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Row } from '@tanstack/table-core'
import { printDonationReceipt, type ReceiptDonation } from '~/utils/donationPDF'
import { mockApprovedDonation } from '~/utils/mockData'

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

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')

const { isAdmin, patronNif, setRole } = useAuth()

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

const donations = computed<Donation[]>(() => {
  const real = rawData.value?.donations ?? []
  // Inject mock approved donation for demo (removed when real data is available)
  const alreadyHasMock = real.some(d => d.id_doacao === mockApprovedDonation.id_doacao)
  return alreadyHasMock ? real : [mockApprovedDonation as Donation, ...real]
})

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

function openStatusModal(donation: Donation) {
  selectedDonation.value = donation
  statusModalOpen.value = true
}

function downloadPDF(donation: Donation) {
  // TODO: When Minio integration is ready, fetch the file from bucket "files"
  // using the donation ID. For now, generate the PDF locally.
  const receipt: ReceiptDonation = {
    id_doacao: donation.id_doacao,
    mecena_nif_nipc: donation.mecena_nif_nipc,
    nome_entidade: donation.nome_entidade,
    data: donation.data,
    valor_transacao: donation.valor_transacao,
    tipo_donativo: donation.tipo_donativo,
    estado: donation.estado
  }
  printDonationReceipt(receipt)
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
    header: 'N.º',
    cell: ({ row }) => h('span', { class: 'font-mono text-sm text-muted' }, `#${row.original.id_doacao}`)
  },
  {
    accessorKey: 'nome_entidade',
    header: 'Mecenas',
    cell: ({ row }) =>
      h('div', undefined, [
        h('p', { class: 'font-medium text-highlighted' }, row.original.nome_entidade ?? row.original.mecena_nif_nipc),
        h('p', { class: 'text-xs text-muted font-mono' }, row.original.mecena_nif_nipc)
      ])
  },
  {
    accessorKey: 'data',
    header: 'Data',
    cell: ({ row }) => h('span', undefined, formatDate(row.original.data))
  },
  {
    accessorKey: 'valor_transacao',
    header: 'Valor',
    cell: ({ row }) => h('span', { class: 'font-semibold tabular-nums' }, formatEUR(row.original.valor_transacao))
  },
  {
    accessorKey: 'tipo_donativo',
    header: 'Modo',
    cell: ({ row }) =>
      h(UBadge, { variant: 'subtle', color: 'neutral', size: 'sm' },
        () => formatModo(row.original.tipo_donativo)
      )
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

const patronColumns: TableColumn<Donation>[] = [
  {
    accessorKey: 'id_doacao',
    header: 'N.º',
    cell: ({ row }) => h('span', { class: 'font-mono text-sm text-muted' }, `#${row.original.id_doacao}`)
  },
  {
    accessorKey: 'data',
    header: 'Data',
    cell: ({ row }) => h('span', undefined, formatDate(row.original.data))
  },
  {
    accessorKey: 'valor_transacao',
    header: 'Valor',
    cell: ({ row }) => h('span', { class: 'font-semibold tabular-nums' }, formatEUR(row.original.valor_transacao))
  },
  {
    accessorKey: 'tipo_donativo',
    header: 'Modo',
    cell: ({ row }) =>
      h(UBadge, { variant: 'subtle', color: 'neutral', size: 'sm' },
        () => formatModo(row.original.tipo_donativo)
      )
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

const globalFilter = ref('')
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
      <!-- Demo role switcher -->
      <UAlert
        icon="i-lucide-flask-conical"
        color="info"
        variant="subtle"
        title="Modo de demonstração"
        :description="`Vista atual: ${isAdmin ? 'Administrador' : 'Mecenas'}`"
        class="mb-6"
      >
        <template #actions>
          <UButton
            v-if="isAdmin"
            label="Ver como Mecenas"
            size="sm"
            color="info"
            variant="subtle"
            icon="i-lucide-user"
            @click="setRole('patron', '123456789', 'Patron Organization, Lda.')"
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

      <!-- Stats -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <UPageCard variant="subtle" class="p-4">
          <p class="text-xs text-muted uppercase tracking-wide font-medium mb-1">
            Total Aceite
          </p>
          <p class="text-xl font-bold text-highlighted">
            {{ stats.total }}
          </p>
        </UPageCard>
        <UPageCard variant="subtle" class="p-4">
          <p class="text-xs text-muted uppercase tracking-wide font-medium mb-1">
            Doações
          </p>
          <p class="text-xl font-bold text-highlighted">
            {{ stats.count }}
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
            Pendentes
          </p>
          <p class="text-xl font-bold text-warning">
            {{ stats.pendentes }}
          </p>
        </UPageCard>
      </div>

      <!-- Table -->
      <div class="space-y-4">
        <UInput
          v-model="globalFilter"
          icon="i-lucide-search"
          :placeholder="isAdmin ? 'Pesquisar por mecenas, valor...' : 'Pesquisar doações...'"
          class="max-w-sm"
        />

        <UTable
          v-model:global-filter="globalFilter"
          :data="donations"
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
