<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { Need } from '~/utils/mockData'
import { useNeeds } from '~/composables/useNeeds'

const props = defineProps<{
  open: boolean
  need: Need | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'updated': []
}>()

const toast = useToast()
const { updateNeedStatus, approveNeed, rejectNeed } = useNeeds()
const isSubmitting = ref(false)

const estadoOptions = [
  { label: 'Pendente', value: 'PENDENTE' },
  { label: 'Aceite', value: 'ACEITE' },
  { label: 'Rejeitado', value: 'REJEITADO' }
]

const schema = z.object({
  estado: z.enum(['PENDENTE', 'ACEITE', 'REJEITADO']),
  motivo_recusa: z.string().optional()
}).refine(
  d => d.estado !== 'REJEITADO' || (d.motivo_recusa?.trim().length ?? 0) > 0,
  { message: 'O motivo da recusa é obrigatório', path: ['motivo_recusa'] }
)

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  estado: 'PENDENTE',
  motivo_recusa: ''
})

watch(() => props.need, (n) => {
  if (n) {
    state.estado = n.estado
    state.motivo_recusa = n.motivo_recusa ?? ''
  }
})

const estadoBadgeColor = computed(() => {
  const map: Record<string, 'warning' | 'success' | 'error'> = {
    PENDENTE: 'warning', ACEITE: 'success', REJEITADO: 'error'
  }
  return map[state.estado ?? 'PENDENTE'] ?? 'warning'
})

async function onSubmit(event: FormSubmitEvent<Schema>) {
  if (!props.need) return
  isSubmitting.value = true

  try {
    if (event.data.estado === 'ACEITE') {
      approveNeed(props.need.id_pedido)
    } else if (event.data.estado === 'REJEITADO') {
      rejectNeed(props.need.id_pedido, event.data.motivo_recusa ?? '')
    } else {
      updateNeedStatus(props.need.id_pedido, 'PENDENTE')
    }

    toast.add({
      title: 'Estado atualizado',
      description: `Pedido #${props.need.id_pedido} marcado como ${event.data.estado.toLowerCase()}.`,
      icon: 'i-lucide-check',
      color: 'success'
    })

    emit('updated')
    emit('update:open', false)
  } catch {
    toast.add({
      title: 'Erro',
      description: 'Não foi possível atualizar o estado.',
      icon: 'i-lucide-x',
      color: 'error'
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <UModal
    :open="open"
    title="Atualizar Estado do Pedido"
    :description="need ? `Pedido #${need.id_pedido} — ${need.nome_entidade ?? need.nif_nipc}` : ''"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <UForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <div
          v-if="need"
          class="flex flex-wrap gap-4 rounded-lg bg-elevated/50 border border-default p-4 text-sm"
        >
          <div>
            <p class="text-xs text-muted uppercase tracking-wide font-medium">
              Itens
            </p>
            <p class="font-semibold">
              {{ need.items.length }}
            </p>
          </div>
          <div>
            <p class="text-xs text-muted uppercase tracking-wide font-medium">
              Data
            </p>
            <p class="font-semibold">
              {{ new Date(need.data).toLocaleDateString('pt-PT') }}
            </p>
          </div>
          <div>
            <p class="text-xs text-muted uppercase tracking-wide font-medium">
              Urgente
            </p>
            <UBadge :color="need.urgente ? 'error' : 'neutral'" variant="subtle" size="sm">
              {{ need.urgente ? 'Sim' : 'Não' }}
            </UBadge>
          </div>
          <div>
            <p class="text-xs text-muted uppercase tracking-wide font-medium">
              Estado atual
            </p>
            <UBadge :color="estadoBadgeColor" variant="subtle" size="sm">
              {{ need.estado }}
            </UBadge>
          </div>
        </div>

        <UFormField name="estado" label="Novo Estado" required>
          <USelect
            v-model="state.estado"
            :items="estadoOptions"
            value-key="value"
            label-key="label"
            class="w-full"
          />
        </UFormField>

        <UFormField
          v-if="state.estado === 'REJEITADO'"
          name="motivo_recusa"
          label="Motivo da Recusa"
          description="Explique o motivo pelo qual este pedido está a ser recusado."
          required
        >
          <UTextarea
            v-model="state.motivo_recusa"
            :rows="3"
            placeholder="Indique o motivo da recusa..."
            class="w-full"
          />
        </UFormField>

        <UAlert
          v-if="state.estado === 'ACEITE' && need?.urgente"
          icon="i-lucide-zap"
          color="warning"
          variant="subtle"
          title="Pedido urgente"
          description="Como este pedido é urgente, será emitido automaticamente um voucher para os bens sem match definido."
        />

        <div class="flex justify-end gap-2 pt-2">
          <UButton
            label="Cancelar"
            color="neutral"
            variant="subtle"
            @click="emit('update:open', false)"
          />
          <UButton
            label="Guardar"
            icon="i-lucide-check"
            color="primary"
            type="submit"
            :loading="isSubmitting"
          />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
