<script setup lang="ts">
const open = defineModel<boolean>('open', { default: false })

const props = withDefaults(
  defineProps<{
    mode?: 'block' | 'unblock'
    count?: number
    defaultReason?: string | null
    subject?: string | null
  }>(),
  { mode: 'block', count: 1, defaultReason: null, subject: null }
)

const emit = defineEmits<{
  confirm: [reason: string]
  unblock: []
}>()

const reason = ref('')
const submitted = ref(false)

watch(open, (v) => {
  if (v) {
    reason.value = props.defaultReason ?? ''
    submitted.value = false
  }
})

const trimmed = computed(() => reason.value.trim())
const isValid = computed(() => trimmed.value.length > 0)

const title = computed(() => {
  if (props.mode === 'unblock') {
    return props.count > 1
      ? `Desbloquear ${props.count} utilizadores`
      : `Desbloquear ${props.subject ?? 'utilizador'}`
  }
  return props.count > 1
    ? `Bloquear ${props.count} utilizadores`
    : `Bloquear ${props.subject ?? 'utilizador'}`
})

function submit() {
  submitted.value = true
  if (!isValid.value) return
  emit('confirm', trimmed.value)
  open.value = false
}

function confirmUnblock() {
  emit('unblock')
  open.value = false
}

function cancel() {
  open.value = false
}
</script>

<template>
  <UModal
    v-model:open="open"
    :title="title"
  >
    <template #body>
      <template v-if="mode === 'unblock'">
        <p class="text-sm text-muted mb-2">
          Motivo do bloqueio:
        </p>
        <div class="rounded-md border border-default bg-elevated px-3 py-2 text-sm min-h-16">
          {{ defaultReason || 'Sem motivo registado.' }}
        </div>

        <div class="flex justify-end gap-2 mt-6">
          <UButton
            label="Cancelar"
            color="neutral"
            variant="subtle"
            @click="cancel"
          />
          <UButton
            label="Confirmar desbloqueio"
            color="success"
            variant="solid"
            @click="confirmUnblock"
          />
        </div>
      </template>

      <template v-else>
        <p class="text-sm text-muted mb-2">
          Indica o motivo da suspensão. Esta nota fica visível no perfil do utilizador.
        </p>
        <UFormField
          label="Motivo"
          required
          :error="submitted && !isValid ? 'O motivo é obrigatório.' : undefined"
        >
          <UTextarea
            v-model="reason"
            autofocus
            :rows="4"
            placeholder="Ex.: utilização indevida do painel após aviso."
            class="w-full"
            @keydown.enter.exact.prevent="submit"
          />
        </UFormField>

        <div class="flex justify-end gap-2 mt-6">
          <UButton
            label="Cancelar"
            color="neutral"
            variant="subtle"
            @click="cancel"
          />
          <UButton
            label="Bloquear"
            color="error"
            variant="solid"
            :disabled="!isValid"
            @click="submit"
          />
        </div>
      </template>
    </template>
  </UModal>
</template>
