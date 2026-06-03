<script setup lang="ts">
import type { AppNotification } from '~/composables/useNotifications'

const props = defineProps<{ notification: AppNotification }>()
const { isAdmin, patronNif } = useAuth()
const toast = useToast()

interface Donation {
  id_doacao: number
  mecena_nif_nipc: string
  nome_entidade?: string
  data: string
  valor_transacao: number
  tipo_donativo: string
  anonimo: boolean
  url_comprovativo: string
  estado: 'ACEITE' | 'REJEITADO' | 'PENDENTE'
}

const donationId = computed(() => props.notification.payload?.id_doacao as number | undefined)
// Admin fetches all; patron fetches own
const fetchUrl = computed(() =>
  isAdmin.value ? '/api/donations' : `/api/patrons/${patronNif.value}/donations`
)

// No await — keeps this a synchronous component so refs (statusModalOpen)
// remain reactive and modals can open correctly.
const { data: rawData, status, refresh } = useFetch<{ items: Donation[] }>(
  fetchUrl,
  { lazy: true, server: false }
)

const donation = computed<Donation | null>(() =>
  (rawData.value?.items ?? []).find(d => d.id_doacao === donationId.value) ?? null
)

const estadoColor = (e: string) =>
  e === 'ACEITE' ? 'success' : e === 'REJEITADO' ? 'error' : 'warning'
const estadoLabel = (e: string) =>
  e === 'ACEITE' ? 'Aceite' : e === 'REJEITADO' ? 'Rejeitado' : 'Pendente'

const modoLabel: Record<string, string> = {
  NUMERARIO: 'Numerário',
  TRANSFERENCIA: 'Transferência Bancária',
  REFERENCIA: 'Referência Multibanco',
  CHEQUE: 'Cheque'
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('pt-PT', { year: 'numeric', month: 'long', day: 'numeric' })
}

function formatEUR(v: number) {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(v)
}

const statusModalOpen = ref(false)

function downloadPDF() {
  if (!donation.value?.url_comprovativo) {
    toast.add({ title: 'Comprovativo não disponível', icon: 'i-lucide-alert-circle', color: 'warning' })
    return
  }
  const fileName = donation.value.url_comprovativo.split('/').pop()!
  window.open(`/api/download/files?nome=${encodeURIComponent(fileName)}`, '_blank')
}
</script>

<template>
  <div v-if="status === 'pending'" class="p-6 space-y-6 animate-pulse">
    <div class="flex items-start justify-between gap-4">
      <div class="space-y-2">
        <USkeleton class="h-3 w-16" />
        <USkeleton class="h-5 w-44" />
        <USkeleton class="h-3.5 w-28" />
      </div>
      <USkeleton class="h-5 w-16 rounded-full" />
    </div>
    <div class="grid grid-cols-2 gap-4">
      <div v-for="i in 4" :key="i" class="space-y-1.5">
        <USkeleton class="h-3 w-16" />
        <USkeleton class="h-4 w-24" />
      </div>
    </div>
    <div class="flex gap-2 pt-2 border-t border-default">
      <USkeleton class="h-8 w-28 rounded-md" />
      <USkeleton class="h-8 w-36 rounded-md" />
    </div>
  </div>

  <div v-else-if="!donation" class="p-6 text-center text-muted text-sm">
    Doação não encontrada
  </div>

  <div v-else class="p-6 space-y-6">
    <div class="flex items-start justify-between gap-4">
      <div>
        <p class="text-xs text-muted uppercase tracking-wide mb-1">
          Mecenas
        </p>
        <p class="font-semibold text-highlighted text-lg">
          {{ donation.nome_entidade ?? donation.mecena_nif_nipc }}
        </p>
        <p class="text-muted text-sm font-mono">
          {{ donation.mecena_nif_nipc }}
        </p>
      </div>
      <UBadge :color="estadoColor(donation.estado)" variant="subtle" :label="estadoLabel(donation.estado)" />
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div>
        <p class="text-xs text-muted uppercase tracking-wide mb-1">
          Valor
        </p>
        <p class="font-bold text-xl text-highlighted">
          {{ formatEUR(donation.valor_transacao) }}
        </p>
      </div>
      <div>
        <p class="text-xs text-muted uppercase tracking-wide mb-1">
          Modo
        </p>
        <p class="font-medium">
          {{ modoLabel[donation.tipo_donativo] ?? donation.tipo_donativo }}
        </p>
      </div>
      <div>
        <p class="text-xs text-muted uppercase tracking-wide mb-1">
          Data
        </p>
        <p class="text-sm">
          {{ formatDate(donation.data) }}
        </p>
      </div>
      <div>
        <p class="text-xs text-muted uppercase tracking-wide mb-1">
          Nº Doação
        </p>
        <p class="font-mono text-sm text-muted">
          DOA-{{ new Date(donation.data).getFullYear() }}-{{ String(donation.id_doacao).padStart(4, '0') }}
        </p>
      </div>
    </div>

    <div v-if="donation.anonimo" class="flex items-center gap-2 text-sm text-muted">
      <UIcon name="i-lucide-eye-off" class="size-4" />
      Doação anónima
    </div>

    <div class="flex flex-wrap gap-2 pt-2 border-t border-default">
      <template v-if="isAdmin">
        <UButton
          icon="i-lucide-check-circle"
          color="success"
          variant="soft"
          @click="statusModalOpen = true"
        >
          Alterar Estado
        </UButton>
        <UButton
          icon="i-lucide-external-link"
          color="neutral"
          variant="ghost"
          :to="`/mecenas/${donation.id_doacao}`"
        >
          Ver detalhe completo
        </UButton>
      </template>
      <template v-else>
        <UButton
          icon="i-lucide-download"
          color="primary"
          variant="soft"
          :disabled="!donation.url_comprovativo"
          @click="downloadPDF"
        >
          Descarregar Comprovativo
        </UButton>
        <UButton
          icon="i-lucide-external-link"
          color="neutral"
          variant="ghost"
          :to="`/mecenas/${donation.id_doacao}`"
        >
          Ver detalhe
        </UButton>
      </template>
    </div>
  </div>

  <MecenasDonationStatusModal
    v-if="isAdmin && donation"
    v-model:open="statusModalOpen"
    :donation="donation"
    @updated="refresh()"
  />
</template>
