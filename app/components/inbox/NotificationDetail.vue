<script setup lang="ts">
import type { AppNotification } from '~/composables/useNotifications'

const props = defineProps<{ notification: AppNotification }>()
const emit = defineEmits<{ close: [] }>()
const { markAsRead } = useNotifications()

onMounted(() => markAsRead(props.notification._id))
watch(() => props.notification._id, id => markAsRead(id))

const tipoTitle: Record<string, string> = {
  lead_criado: 'Solicitação no Painel',
  lead_entregue: 'Entrega Confirmada',
  doacao_criada: 'Nova Doação',
  doacao_atualizada: 'Doação Atualizada',
  pedido_criado: 'Novo Pedido',
  pedido_atualizado: 'Pedido Atualizado',
  telemetria_alerta: 'Alertas de Telemetria'
}
</script>

<template>
  <UDashboardPanel id="inbox-detail">
    <UDashboardNavbar :title="tipoTitle[notification.tipo] ?? notification.titulo" :toggle="false">
      <template #leading>
        <UButton
          icon="i-lucide-x"
          color="neutral"
          variant="ghost"
          class="-ms-1.5"
          @click="emit('close')"
        />
      </template>
    </UDashboardNavbar>

    <div class="overflow-y-auto flex-1">
      <InboxNotificationDetailLead
        v-if="notification.tipo === 'lead_criado' || notification.tipo === 'lead_entregue'"
        :notification="notification"
      />
      <InboxNotificationDetailDonation
        v-else-if="notification.tipo === 'doacao_criada' || notification.tipo === 'doacao_atualizada'"
        :notification="notification"
      />
      <InboxNotificationDetailNeed
        v-else-if="notification.tipo === 'pedido_criado' || notification.tipo === 'pedido_atualizado'"
        :notification="notification"
      />
      <InboxNotificationDetailTelemetry
        v-else-if="notification.tipo === 'telemetria_alerta'"
        :notification="notification"
      />
      <div v-else class="p-6 space-y-2">
        <p class="font-semibold text-highlighted">
          {{ notification.titulo }}
        </p>
        <p class="text-muted text-sm">
          {{ notification.corpo }}
        </p>
      </div>
    </div>
  </UDashboardPanel>
</template>
