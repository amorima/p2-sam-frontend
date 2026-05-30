<script setup lang="ts">
import { format, isToday } from 'date-fns'
import type { AppNotification } from '~/composables/useNotifications'

const props = defineProps<{
  notifications: AppNotification[]
}>()

const selectedNotification = defineModel<AppNotification | null>()
const itemRefs = ref<Record<string, Element | null>>({})

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

function formatTime(d: string) {
  const date = new Date(d)
  if (isToday(date)) return format(date, 'HH:mm')
  return format(date, 'dd MMM')
}

watch(selectedNotification, (n) => {
  if (!n) return
  const el = itemRefs.value[n._id]
  if (el) el.scrollIntoView({ block: 'nearest' })
})

defineShortcuts({
  arrowdown: () => {
    const idx = props.notifications.findIndex(n => n._id === selectedNotification.value?._id)
    if (idx === -1) selectedNotification.value = props.notifications[0] ?? null
    else if (idx < props.notifications.length - 1) selectedNotification.value = props.notifications[idx + 1]
  },
  arrowup: () => {
    const idx = props.notifications.findIndex(n => n._id === selectedNotification.value?._id)
    if (idx === -1) selectedNotification.value = props.notifications[props.notifications.length - 1] ?? null
    else if (idx > 0) selectedNotification.value = props.notifications[idx - 1]
  }
})
</script>

<template>
  <div class="overflow-y-auto divide-y divide-default">
    <div
      v-if="notifications.length === 0"
      class="p-6 text-center text-muted text-sm"
    >
      Sem notificações
    </div>

    <div
      v-for="n in notifications"
      :key="n._id"
      :ref="(el) => { itemRefs[n._id] = el as Element | null }"
    >
      <div
        class="p-4 sm:px-6 text-sm cursor-pointer border-l-2 transition-colors"
        :class="[
          !n.lida ? 'text-highlighted' : 'text-toned',
          selectedNotification?._id === n._id
            ? 'border-primary bg-primary/10'
            : 'border-bg hover:border-primary hover:bg-primary/5'
        ]"
        @click="selectedNotification = n"
      >
        <div class="flex items-center justify-between gap-2" :class="[!n.lida && 'font-semibold']">
          <div class="flex items-center gap-2 min-w-0">
            <UIcon :name="iconFor(n.tipo)" class="size-4 shrink-0" />
            <span class="truncate">{{ n.titulo }}</span>
            <UChip v-if="!n.lida" size="sm" />
          </div>
          <span class="text-muted text-xs shrink-0">{{ n.data_envio ? formatTime(n.data_envio) : '' }}</span>
        </div>
        <p class="text-dimmed line-clamp-1 mt-0.5 pl-6">
          {{ n.corpo }}
        </p>
      </div>
    </div>
  </div>
</template>
