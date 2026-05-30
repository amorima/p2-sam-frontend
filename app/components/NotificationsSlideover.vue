<script setup lang="ts">
import { formatTimeAgo } from '@vueuse/core'

const { isNotificationsSlideoverOpen } = useDashboard()
const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()

const tipoIcon: Record<string, string> = {
  lead_criado: 'i-lucide-package',
  lead_entregue: 'i-lucide-package-check',
  doacao_criada: 'i-lucide-heart-handshake',
  doacao_atualizada: 'i-lucide-refresh-cw',
  pedido_criado: 'i-lucide-clipboard-list',
  pedido_atualizado: 'i-lucide-clipboard-check',
  telemetria_alerta: 'i-lucide-triangle-alert'
}

function iconFor(tipo: string) {
  return tipoIcon[tipo] ?? 'i-lucide-bell'
}

function onClickNotification(id: string) {
  markAsRead(id)
}
</script>

<template>
  <USlideover v-model:open="isNotificationsSlideoverOpen" title="Notificações">
    <template #body>
      <div v-if="notifications.length === 0" class="text-center text-muted py-8 text-sm">
        Sem notificações
      </div>

      <template v-else>
        <div class="flex items-center justify-between mb-3 -mt-1">
          <span class="text-xs text-muted">{{ unreadCount }} não lida(s)</span>
          <UButton
            v-if="unreadCount > 0"
            variant="ghost"
            size="xs"
            @click="markAllAsRead"
          >
            Marcar todas como lidas
          </UButton>
        </div>

        <div
          v-for="notification in notifications"
          :key="notification._id"
          class="px-3 py-2.5 rounded-md hover:bg-elevated/50 flex items-start gap-3 relative -mx-3 cursor-pointer"
          :class="{ 'opacity-60': notification.lida }"
          @click="onClickNotification(notification._id)"
        >
          <UChip color="error" :show="!notification.lida" inset>
            <div class="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <UIcon :name="iconFor(notification.tipo)" class="text-primary w-4 h-4" />
            </div>
          </UChip>

          <div class="text-sm flex-1 min-w-0">
            <p class="flex items-center justify-between gap-2">
              <span class="text-highlighted font-medium truncate">{{ notification.titulo }}</span>
              <time
                v-if="notification.data_envio"
                :datetime="notification.data_envio"
                class="text-muted text-xs shrink-0"
                v-text="formatTimeAgo(new Date(notification.data_envio))"
              />
            </p>
            <p class="text-dimmed truncate">
              {{ notification.corpo }}
            </p>
          </div>
        </div>
      </template>
    </template>
  </USlideover>
</template>
