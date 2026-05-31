<script setup lang="ts">
import type { AppNotification } from '~/composables/useNotifications'

const props = defineProps<{ notification: AppNotification }>()
const { isAdmin } = useAuth()
const toast = useToast()

interface Lead {
  id_lead: number
  nome_cidadao: string
  contacto_cidadao: string
  item_pedido: string
  estado: string
  pin_entrega: string
  data: string
  id_pedido: number
  id_item: number
}

const leadId = computed(() => props.notification.payload?.id_lead as number | undefined)

const { data: lead, status, refresh } = useFetch<Lead>(
  () => `/api/leads/${leadId.value}`,
  { lazy: true, server: false, watch: [leadId] }
)

const estadoColor = (e: string) =>
  e === 'ENTREGUE' ? 'success' : e === 'EXPIRADO' ? 'error' : 'warning'
const estadoLabel = (e: string) =>
  e === 'ENTREGUE' ? 'Entregue' : e === 'EXPIRADO' ? 'Expirado' : 'Pendente'

function formatDate(d: string) {
  return new Date(d).toLocaleString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const validating = ref(false)
async function validateLead() {
  if (!lead.value) return
  validating.value = true
  try {
    await $fetch('/api/leads/validate', {
      method: 'POST',
      body: { id_lead: lead.value.id_lead, pin_entrega: lead.value.pin_entrega }
    })
    await refresh()
    toast.add({ title: 'Lead validada com sucesso', icon: 'i-lucide-check-circle', color: 'success' })
  } catch {
    toast.add({ title: 'Erro ao validar', icon: 'i-lucide-alert-circle', color: 'error' })
  } finally {
    validating.value = false
  }
}
</script>

<template>
  <div v-if="status === 'pending'" class="p-6 space-y-6 animate-pulse">
    <div class="flex items-start justify-between gap-4">
      <div class="space-y-2">
        <USkeleton class="h-3 w-16" />
        <USkeleton class="h-5 w-40" />
        <USkeleton class="h-3.5 w-32" />
      </div>
      <USkeleton class="h-5 w-16 rounded-full" />
    </div>
    <div class="grid grid-cols-2 gap-4">
      <div v-for="i in 4" :key="i" class="space-y-1.5">
        <USkeleton class="h-3 w-20" />
        <USkeleton class="h-4 w-24" />
      </div>
    </div>
    <div class="flex gap-2 pt-2 border-t border-default">
      <USkeleton class="h-8 w-36 rounded-md" />
      <USkeleton class="h-8 w-32 rounded-md" />
    </div>
  </div>

  <div v-else-if="!lead" class="p-6 text-center text-muted text-sm">
    Lead não encontrada
  </div>

  <div v-else class="p-6 space-y-6">
    <div class="flex items-start justify-between gap-4">
      <div>
        <p class="text-xs text-muted uppercase tracking-wide mb-1">
          Cidadão
        </p>
        <p class="font-semibold text-highlighted text-lg">
          {{ lead.nome_cidadao }}
        </p>
        <p class="text-muted text-sm">
          {{ lead.contacto_cidadao }}
        </p>
      </div>
      <UBadge :color="estadoColor(lead.estado)" variant="subtle" :label="estadoLabel(lead.estado)" />
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div>
        <p class="text-xs text-muted uppercase tracking-wide mb-1">
          Bem Solicitado
        </p>
        <p class="font-medium">
          {{ lead.item_pedido }}
        </p>
        <p class="text-xs text-muted">
          Pedido #{{ lead.id_pedido }}
        </p>
      </div>
      <div>
        <p class="text-xs text-muted uppercase tracking-wide mb-1">
          PIN de Entrega
        </p>
        <p class="font-mono font-bold tracking-widest text-lg">
          {{ lead.pin_entrega }}
        </p>
      </div>
      <div>
        <p class="text-xs text-muted uppercase tracking-wide mb-1">
          Data
        </p>
        <p class="text-sm">
          {{ formatDate(lead.data) }}
        </p>
      </div>
      <div>
        <p class="text-xs text-muted uppercase tracking-wide mb-1">
          Nº Lead
        </p>
        <p class="font-mono text-sm text-muted">
          #{{ lead.id_lead }}
        </p>
      </div>
    </div>

    <div v-if="isAdmin" class="flex gap-2 pt-2 border-t border-default">
      <UButton
        v-if="lead.estado === 'PENDENTE'"
        icon="i-lucide-package-check"
        color="success"
        variant="soft"
        :loading="validating"
        @click="validateLead"
      >
        Marcar como Entregue
      </UButton>
      <UButton
        icon="i-lucide-external-link"
        color="neutral"
        variant="ghost"
        :to="`/doacoes`"
      >
        Ver todas as leads
      </UButton>
    </div>
  </div>
</template>
