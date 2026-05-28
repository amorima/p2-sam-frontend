<script setup lang="ts">
import { formatDistanceToNow } from 'date-fns'
import { pt } from 'date-fns/locale'

interface BackendDonation {
  id_doacao: number
  nome_entidade?: string
  mecena_nif_nipc: string
  valor_transacao: number
  estado: string
  data: string
  tipo_donativo?: string
  anonimo?: boolean
}

interface BackendNeed {
  id_pedido: number
  nome_entidade?: string
  nif_nipc: string
  items: unknown[]
  estado: string
  data: string
}

interface BackendLead {
  id_lead: number
  nome_cidadao: string
  item_pedido: string
  estado: string
  data: string
}

interface ActivityEntry {
  key: string
  tipo: 'doacao_mecenas' | 'pedido' | 'lead'
  titulo: string
  detalhe: string
  estado: string
  data: string
  href: string
}

const ICON: Record<ActivityEntry['tipo'], string> = {
  doacao_mecenas: 'i-lucide-hand-coins',
  pedido: 'i-lucide-clipboard-list',
  lead: 'i-lucide-heart-handshake'
}

const COLOR: Record<ActivityEntry['tipo'], 'primary' | 'info' | 'success'> = {
  doacao_mecenas: 'primary',
  pedido: 'info',
  lead: 'success'
}

const LABEL: Record<ActivityEntry['tipo'], string> = {
  doacao_mecenas: 'Doação',
  pedido: 'Pedido',
  lead: 'Lead'
}

const ESTADO_COLOR: Record<string, 'success' | 'warning' | 'error' | 'neutral'> = {
  ACEITE: 'success',
  ENTREGUE: 'success',
  PENDENTE: 'warning',
  REJEITADO: 'error',
  EXPIRADO: 'error'
}

function estadoColor(e: string): 'success' | 'warning' | 'error' | 'neutral' {
  return ESTADO_COLOR[e] ?? 'neutral'
}

function relativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return '—'
  return formatDistanceToNow(date, { addSuffix: true, locale: pt })
}

const { data: activity, status } = await useAsyncData('home-activity', async () => {
  const [donationsRes, needsRes, leadsRes] = await Promise.all([
    $fetch<{ donations: BackendDonation[] }>('/api/donations').catch(() => ({ donations: [] })),
    $fetch<{ needs: BackendNeed[] }>('/api/needs').catch(() => ({ needs: [] })),
    $fetch<BackendLead[]>('/api/leads').catch(() => [] as BackendLead[])
  ])

  const formatEUR = (v: number) =>
    new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(Number(v))

  // Take the 7 most recent of each type independently so no type drowns the others
  const donations: ActivityEntry[] = (donationsRes.donations ?? [])
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
    .slice(0, 7)
    .map(d => ({
      key: `d-${d.id_doacao}`,
      tipo: 'doacao_mecenas',
      titulo: d.anonimo ? 'Doação anónima' : (d.nome_entidade ?? d.mecena_nif_nipc),
      detalhe: formatEUR(d.valor_transacao),
      estado: d.estado,
      data: d.data,
      href: `/mecenas/${d.id_doacao}`
    }))

  const needs: ActivityEntry[] = (needsRes.needs ?? [])
    .sort((a, b) => b.id_pedido - a.id_pedido)
    .slice(0, 7)
    .map(n => ({
      key: `n-${n.id_pedido}`,
      tipo: 'pedido',
      titulo: n.nome_entidade ?? n.nif_nipc,
      detalhe: `${Array.isArray(n.items) ? n.items.length : 0} item(s)`,
      estado: n.estado,
      data: n.data,
      href: `/instituicoes/${n.id_pedido}`
    }))

  const leads: ActivityEntry[] = (leadsRes ?? [])
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
    .slice(0, 7)
    .map(l => ({
      key: `l-${l.id_lead}`,
      tipo: 'lead',
      titulo: l.nome_cidadao,
      detalhe: l.item_pedido,
      estado: l.estado,
      data: l.data,
      href: `/doacoes`
    }))

  // Merge all and sort by date (needs fallback to today)
  return [...donations, ...needs, ...leads]
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
    .slice(0, 20)
}, { server: false, default: () => [] as ActivityEntry[] })
</script>

<template>
  <div class="space-y-3">
    <div class="flex items-center gap-2">
      <UIcon name="i-lucide-activity" class="size-4 text-muted" />
      <h2 class="text-sm font-semibold text-highlighted uppercase tracking-wide">
        Atividade Recente
      </h2>
    </div>

    <UCard :ui="{ body: '!p-0' }">
      <!-- Loading skeleton -->
      <div v-if="status === 'pending'" class="divide-y divide-default">
        <div v-for="i in 8" :key="i" class="flex items-center gap-3 px-4 py-3">
          <USkeleton class="size-8 rounded-full shrink-0" />
          <div class="flex-1 space-y-1.5">
            <USkeleton class="h-3.5 w-40" />
            <USkeleton class="h-3 w-24" />
          </div>
          <USkeleton class="h-5 w-16 rounded-full" />
          <USkeleton class="h-3 w-20" />
        </div>
      </div>

      <!-- Empty state -->
      <div
        v-else-if="!activity?.length"
        class="flex flex-col items-center justify-center py-12 text-center"
      >
        <UIcon name="i-lucide-inbox" class="size-10 text-muted mb-2" />
        <p class="text-sm text-muted">
          Sem atividade registada.
        </p>
      </div>

      <!-- Activity feed -->
      <ul v-else class="divide-y divide-default">
        <li v-for="entry in activity" :key="entry.key">
          <NuxtLink
            :to="entry.href"
            class="flex items-center gap-3 px-4 py-3 hover:bg-elevated/50 transition-colors cursor-pointer"
          >
            <!-- Type icon -->
            <div
              class="size-8 rounded-full flex items-center justify-center shrink-0"
              :class="{
                'bg-primary/10': entry.tipo === 'doacao_mecenas',
                'bg-info/10': entry.tipo === 'pedido',
                'bg-success/10': entry.tipo === 'lead'
              }"
            >
              <UIcon
                :name="ICON[entry.tipo]"
                class="size-4"
                :class="{
                  'text-primary': entry.tipo === 'doacao_mecenas',
                  'text-info': entry.tipo === 'pedido',
                  'text-success': entry.tipo === 'lead'
                }"
              />
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <UBadge
                  :color="COLOR[entry.tipo]"
                  variant="subtle"
                  size="xs"
                >
                  {{ LABEL[entry.tipo] }}
                </UBadge>
                <span class="text-sm font-medium text-highlighted truncate">
                  {{ entry.titulo }}
                </span>
              </div>
              <p class="text-xs text-muted truncate mt-0.5">
                {{ entry.detalhe }}
              </p>
            </div>

            <!-- Status + time -->
            <div class="flex flex-col items-end gap-1 shrink-0">
              <UBadge
                :color="estadoColor(entry.estado)"
                variant="subtle"
                size="xs"
              >
                {{ entry.estado }}
              </UBadge>
              <span class="text-xs text-dimmed tabular-nums whitespace-nowrap">
                {{ relativeTime(entry.data) }}
              </span>
            </div>

            <!-- Chevron hint -->
            <UIcon name="i-lucide-chevron-right" class="size-4 text-dimmed shrink-0" />
          </NuxtLink>
        </li>
      </ul>
    </UCard>
  </div>
</template>
