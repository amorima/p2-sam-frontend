<script setup lang="ts">
import type { AppNotification } from '~/composables/useNotifications'

const props = defineProps<{ notification: AppNotification }>()

interface AlertEntry {
  aviso: string
  locker_id?: number
  timestamp: string
}

const alerts = computed<AlertEntry[]>(() => {
  const raw = props.notification.payload?.alerts
  if (!Array.isArray(raw)) return []
  return [...raw].reverse() // most recent first
})

function formatTime(ts: string) {
  return new Date(ts).toLocaleString('pt-PT', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  })
}

const avisoColor = (aviso: string): 'warning' | 'error' | 'neutral' => {
  if (aviso.includes('bateria') || aviso.includes('offline') || aviso.includes('sinal')) return 'warning'
  if (aviso.includes('temperatura') || aviso.includes('erro')) return 'error'
  return 'neutral'
}

const avisoIcon = (aviso: string): string => {
  if (aviso.includes('bateria')) return 'i-lucide-battery-low'
  if (aviso.includes('temperatura')) return 'i-lucide-thermometer'
  if (aviso.includes('sinal') || aviso.includes('offline')) return 'i-lucide-wifi-off'
  if (aviso.includes('impressora')) return 'i-lucide-printer'
  return 'i-lucide-triangle-alert'
}
</script>

<template>
  <div class="p-6 space-y-5">
    <div class="flex items-start justify-between gap-4">
      <div>
        <p class="font-semibold text-highlighted text-lg">
          Histórico de Alertas
        </p>
        <p class="text-muted text-sm">
          {{ alerts.length }} alerta(s) registado(s)
        </p>
      </div>
      <UButton
        icon="i-lucide-monitor-cog"
        color="neutral"
        variant="ghost"
        size="sm"
        to="/equipamentos"
      >
        Estado dos Equipamentos
      </UButton>
    </div>

    <div v-if="alerts.length === 0" class="text-center text-muted text-sm py-8">
      Sem alertas registados
    </div>

    <div v-else class="space-y-2 max-h-[480px] overflow-y-auto">
      <div
        v-for="(alert, i) in alerts"
        :key="i"
        class="flex items-start gap-3 p-3 rounded-lg border border-default"
        :class="{
          'bg-warning/5 border-warning/20': avisoColor(alert.aviso) === 'warning',
          'bg-error/5 border-error/20': avisoColor(alert.aviso) === 'error',
          'bg-elevated/40': avisoColor(alert.aviso) === 'neutral'
        }"
      >
        <UIcon
          :name="avisoIcon(alert.aviso)"
          class="size-4 mt-0.5 shrink-0"
          :class="{
            'text-warning': avisoColor(alert.aviso) === 'warning',
            'text-error': avisoColor(alert.aviso) === 'error',
            'text-muted': avisoColor(alert.aviso) === 'neutral'
          }"
        />
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium capitalize">
            {{ alert.aviso }}
          </p>
          <p class="text-xs text-muted mt-0.5">
            {{ formatTime(alert.timestamp) }}
            <span v-if="alert.locker_id" class="ml-2 font-mono">Locker #{{ alert.locker_id }}</span>
          </p>
        </div>
        <UBadge
          v-if="i === 0"
          label="Recente"
          size="xs"
          :color="avisoColor(alert.aviso)"
          variant="subtle"
        />
      </div>
    </div>
  </div>
</template>
