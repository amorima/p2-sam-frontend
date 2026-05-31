<script setup lang="ts">
import type { AppNotification } from '~/composables/useNotifications'
import { useNeeds } from '~/composables/useNeeds'
import type { Need } from '~/utils/domain'

const props = defineProps<{ notification: AppNotification }>()
const { isAdmin, isInstitution } = useAuth()

const { needs } = useNeeds()
const needId = computed(() => props.notification.payload?.id_pedido as number | undefined)

const need = computed<Need | null>(() =>
  needs.value.find(n => n.id_pedido === needId.value) ?? null
)

const statusModalOpen = ref(false)

function estadoBadgeColor(e: string): 'warning' | 'success' | 'error' {
  if (e === 'ACEITE') return 'success'
  if (e === 'REJEITADO') return 'error'
  return 'warning'
}

function estadoLabel(e: string) {
  return { ACEITE: 'Aceite', REJEITADO: 'Rejeitado', PENDENTE: 'Pendente' }[e] ?? e
}
</script>

<template>
  <div v-if="!need" class="p-6 space-y-6 animate-pulse">
    <div class="flex items-start justify-between gap-4">
      <div class="space-y-2">
        <USkeleton class="h-3 w-20" />
        <USkeleton class="h-5 w-44" />
        <USkeleton class="h-3.5 w-28" />
      </div>
      <USkeleton class="h-5 w-16 rounded-full" />
    </div>
    <div class="space-y-2">
      <USkeleton class="h-3 w-28" />
      <div v-for="i in 3" :key="i" class="flex items-center gap-2 p-2 rounded-md bg-elevated/30">
        <USkeleton class="size-4 rounded shrink-0" />
        <USkeleton class="h-3.5 flex-1" />
        <USkeleton class="h-4 w-12 rounded-full ml-auto" />
      </div>
    </div>
    <div class="flex gap-2 pt-2 border-t border-default">
      <USkeleton class="h-8 w-28 rounded-md" />
      <USkeleton class="h-8 w-36 rounded-md" />
    </div>
  </div>

  <div v-else class="p-6 space-y-6">
    <div class="flex items-start justify-between gap-4">
      <div>
        <p class="text-xs text-muted uppercase tracking-wide mb-1">
          Instituição
        </p>
        <p class="font-semibold text-highlighted text-lg">
          {{ need.nome_entidade ?? need.nif_nipc }}
        </p>
        <p class="text-muted text-sm font-mono">
          {{ need.nif_nipc }}
        </p>
      </div>
      <div class="flex flex-col items-end gap-1">
        <UBadge :color="estadoBadgeColor(need.estado)" variant="subtle" :label="estadoLabel(need.estado)" />
        <UBadge
          v-if="need.urgente"
          color="error"
          variant="soft"
          icon="i-lucide-zap"
          label="Urgente"
        />
      </div>
    </div>

    <div>
      <p class="text-xs text-muted uppercase tracking-wide mb-2">
        Itens Solicitados
      </p>
      <div class="space-y-1.5">
        <div
          v-for="item in need.items"
          :key="item.id_item"
          class="flex items-center gap-2 text-sm p-2 rounded-md bg-elevated/50"
        >
          <UIcon name="i-lucide-package" class="size-4 text-muted shrink-0" />
          <span>{{ item.tipo_bem_servico }}</span>
          <UBadge
            v-if="item.tipo_bem"
            :label="item.tipo_bem === 'BEM' ? 'Bem' : 'Serviço'"
            size="xs"
            variant="subtle"
            color="neutral"
            class="ml-auto"
          />
        </div>
      </div>
    </div>

    <div class="flex flex-wrap gap-2 pt-2 border-t border-default">
      <template v-if="isAdmin">
        <UButton
          icon="i-lucide-clipboard-check"
          color="primary"
          variant="soft"
          @click="statusModalOpen = true"
        >
          Alterar Estado
        </UButton>
        <UButton
          icon="i-lucide-external-link"
          color="neutral"
          variant="ghost"
          :to="`/instituicoes/${need.id_pedido}`"
        >
          Abrir Pedido Completo
        </UButton>
      </template>
      <template v-else-if="isInstitution">
        <UButton
          icon="i-lucide-external-link"
          color="neutral"
          variant="ghost"
          :to="`/instituicoes/${need.id_pedido}`"
        >
          Ver Detalhe
        </UButton>
      </template>
    </div>
  </div>

  <InstituicoesNeedStatusModal
    v-if="isAdmin && need"
    v-model:open="statusModalOpen"
    :need="need"
    @updated="() => {}"
  />
</template>
