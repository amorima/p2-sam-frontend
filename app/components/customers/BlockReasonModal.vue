<script setup lang="ts">
const open = defineModel<boolean>('open', { default: false })

const props = withDefaults(
  defineProps<{
    count?: number
    defaultReason?: string | null
    subject?: string | null
  }>(),
  { count: 1, defaultReason: null, subject: null }
)

const emit = defineEmits<{
  confirm: [reason: string]
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

const title = computed(() =>
  props.count > 1
    ? `Bloquear ${props.count} utilizadores`
    : `Bloquear ${props.subject ?? 'utilizador'}`
)

function submit() {
  submitted.value = true
  if (!isValid.value) return
  emit('confirm', trimmed.value)
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
    description="Indica o motivo da suspensão. Esta nota fica visível no perfil do utilizador."
  >
    <template #body>
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
  </UModal>
</template>
