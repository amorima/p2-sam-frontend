<script setup lang="ts">
interface Donation {
  estado: 'ACEITE' | 'REJEITADO' | 'PENDENTE'
  valor_transacao: number
}
interface Need {
  estado: 'ACEITE' | 'REJEITADO' | 'PENDENTE'
}
interface Lead {
  estado: string
}

const { data, status } = await useAsyncData('home-stats', async () => {
  const [donationsRes, needsRes, leadsRes] = await Promise.all([
    $fetch<{ items: Donation[] }>('/api/donations?limit=200').catch(() => ({ items: [] })),
    $fetch<{ items: Need[] }>('/api/needs?limit=200').catch(() => ({ items: [] })),
    $fetch<{ items: Lead[] }>('/api/leads?limit=200').catch(() => ({ items: [] }))
  ])
  const donations = donationsRes.items ?? []
  const needs = needsRes.items ?? []
  const leads = leadsRes.items ?? []

  return {
    totalAceite: donations.filter(d => d.estado === 'ACEITE').reduce((s, d) => s + Number(d.valor_transacao), 0),
    doacoesPendentes: donations.filter(d => d.estado === 'PENDENTE').length,
    pedidosPendentes: needs.filter(n => n.estado === 'PENDENTE').length,
    leadsAtivos: leads.filter(l => l.estado !== 'ENTREGUE').length
  }
}, { server: false, default: () => null })

function formatEUR(v: number) {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v)
}

const cards = computed(() => [
  { title: 'Total Doado', icon: 'i-lucide-circle-dollar-sign', value: data.value ? formatEUR(data.value.totalAceite) : '—', color: 'text-highlighted', to: '/mecenas' },
  { title: 'Doações Pendentes', icon: 'i-lucide-hand-coins', value: data.value?.doacoesPendentes ?? '—', color: 'text-warning', to: '/mecenas' },
  { title: 'Pedidos Pendentes', icon: 'i-lucide-clipboard-list', value: data.value?.pedidosPendentes ?? '—', color: 'text-warning', to: '/instituicoes' },
  { title: 'Leads Ativos', icon: 'i-lucide-heart-handshake', value: data.value?.leadsAtivos ?? '—', color: 'text-primary', to: '/doacoes' }
])
</script>

<template>
  <UPageGrid class="lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-px mb-6">
    <UPageCard
      v-for="card in cards"
      :key="card.title"
      :icon="card.icon"
      :title="card.title"
      :to="card.to"
      variant="subtle"
      :ui="{
        container: 'gap-y-1.5',
        wrapper: 'items-start',
        leading: 'p-2.5 rounded-full bg-primary/10 ring ring-inset ring-primary/25 flex-col',
        title: 'font-normal text-muted text-xs uppercase'
      }"
      class="lg:rounded-none first:rounded-l-lg last:rounded-r-lg hover:z-1"
    >
      <USkeleton v-if="status === 'pending'" class="h-8 w-24 mt-1" />
      <span v-else :class="['text-2xl font-semibold', card.color]">{{ card.value }}</span>
    </UPageCard>
  </UPageGrid>
</template>
