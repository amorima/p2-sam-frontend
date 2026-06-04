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
  <!-- Fallback: the need may not be in the in-memory paginated list (it only
       holds the first page). Instead of an endless skeleton, show the
       notification's own content plus a link to the full pedido. -->
  <div v-if="!need" class="p-6 space-y-4">
    <p class="font-semibold text-highlighted">
      {{ notification.titulo }}
    </p>
    <p class="text-muted text-sm">
      {{ notification.corpo }}
    </p>
    <div v-if="needId" class="pt-2 border-t border-default">
      <UButton
        icon="i-lucide-external-link"
        color="neutral"
        variant="ghost"
        :to="`/instituicoes/${needId}`"
      >
        Abrir Pedido Completo
      </UButton>
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
