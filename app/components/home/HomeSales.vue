<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

const UBadge = resolveComponent('UBadge')
const UIcon = resolveComponent('UIcon')

interface ActivityEntry {
  key: string
  tipo: 'doacao' | 'pedido' | 'lead'
  entidade: string
  detalhe: string
  estado: string
  data: string
}

interface Donation {
  id_doacao: number
  nome_entidade?: string
  mecena_nif_nipc: string
  valor_transacao: number
  estado: string
  data: string
}

interface Need {
  id_pedido: number
  nome_entidade?: string
  nif_nipc: string
  items: unknown[]
  estado: string
  data: string
}

interface Lead {
  id_lead: number
  nome_cidadao: string
  item_pedido: string
  estado: string
  data: string
}

const { data: activity, status } = await useAsyncData('home-activity', async () => {
  const [donationsRes, needsRes, leadsRes] = await Promise.all([
    $fetch<{ donations: Donation[] }>('/api/donations').catch(() => ({ donations: [] })),
    $fetch<{ needs: Need[] }>('/api/needs').catch(() => ({ needs: [] })),
    $fetch<Lead[]>('/api/leads').catch(() => [])
  ])

  const entries: ActivityEntry[] = [
    ...(donationsRes.donations ?? []).map(d => ({
      key: `d-${d.id_doacao}`,
      tipo: 'doacao' as const,
      entidade: d.nome_entidade ?? d.mecena_nif_nipc,
      detalhe: new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(Number(d.valor_transacao)),
      estado: d.estado,
      data: d.data
    })),
    ...(needsRes.needs ?? []).map(n => ({
      key: `n-${n.id_pedido}`,
      tipo: 'pedido' as const,
      entidade: n.nome_entidade ?? n.nif_nipc,
      detalhe: `${Array.isArray(n.items) ? n.items.length : 0} item(s)`,
      estado: n.estado,
      data: n.data
    })),
    ...(leadsRes ?? []).map(l => ({
      key: `l-${l.id_lead}`,
      tipo: 'lead' as const,
      entidade: l.nome_cidadao,
      detalhe: l.item_pedido,
      estado: l.estado,
      data: l.data
    }))
  ]

  return entries
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
    .slice(0, 15)
}, { server: false, default: () => [] })

function tipoConfig(tipo: ActivityEntry['tipo']) {
  if (tipo === 'doacao') return { icon: 'i-lucide-hand-coins', label: 'Doação', color: 'primary' as const }
  if (tipo === 'pedido') return { icon: 'i-lucide-clipboard-list', label: 'Pedido', color: 'info' as const }
  return { icon: 'i-lucide-heart-handshake', label: 'Lead', color: 'secondary' as const }
}

function estadoColor(estado: string): 'success' | 'warning' | 'error' | 'neutral' {
  if (estado === 'ACEITE' || estado === 'ENTREGUE') return 'success'
  if (estado === 'REJEITADO' || estado === 'EXPIRADO') return 'error'
  return 'warning'
}

function formatDate(d: string) {
  return new Date(d).toLocaleString('pt-PT', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false
  })
}

const columns: TableColumn<ActivityEntry>[] = [
  {
    accessorKey: 'tipo',
    header: 'Tipo',
    cell: ({ row }) => {
      const cfg = tipoConfig(row.original.tipo)
      return h(UBadge, { variant: 'subtle', color: cfg.color, size: 'sm', icon: cfg.icon }, () => cfg.label)
    }
  },
  {
    accessorKey: 'entidade',
    header: 'Entidade / Cidadão',
    cell: ({ row }) => h('span', { class: 'font-medium text-highlighted' }, row.original.entidade)
  },
  {
    accessorKey: 'detalhe',
    header: 'Detalhe',
    cell: ({ row }) => h('span', { class: 'text-sm text-muted' }, row.original.detalhe)
  },
  {
    accessorKey: 'estado',
    header: 'Estado',
    cell: ({ row }) =>
      h(UBadge, { variant: 'subtle', color: estadoColor(row.original.estado), size: 'sm' }, () => row.original.estado)
  },
  {
    accessorKey: 'data',
    header: 'Data',
    cell: ({ row }) => h('span', { class: 'text-sm text-muted tabular-nums' }, formatDate(row.original.data))
  }
]
</script>

<template>
  <div class="space-y-3">
    <div class="flex items-center gap-2">
      <UIcon name="i-lucide-activity" class="size-4 text-muted" />
      <h2 class="text-sm font-semibold text-highlighted uppercase tracking-wide">
        Atividade Recente
      </h2>
    </div>

    <div v-if="status === 'pending'" class="space-y-2">
      <USkeleton v-for="i in 5" :key="i" class="h-10 w-full" />
    </div>

    <UTable
      v-else
      :data="activity"
      :columns="columns"
      class="shrink-0"
      :ui="{
        base: 'table-fixed border-separate border-spacing-0',
        thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
        tbody: '[&>tr]:last:[&>td]:border-b-0',
        th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
        td: 'border-b border-default'
      }"
    />

    <div
      v-if="status !== 'pending' && activity.length === 0"
      class="flex flex-col items-center justify-center py-10 text-center"
    >
      <UIcon name="i-lucide-inbox" class="size-10 text-muted mb-2" />
      <p class="text-sm text-muted">
        Sem atividade registada.
      </p>
    </div>
  </div>
</template>
