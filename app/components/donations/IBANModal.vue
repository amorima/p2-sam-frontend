<script setup lang="ts">
defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const toast = useToast()

const SAM_IBAN = 'PT50 0035 0285 0001 1337 1950 5'
const SAM_NAME = 'Serviço de Apoio Municipal de Vila do Conde'

async function copyIBAN() {
  await navigator.clipboard.writeText(SAM_IBAN.replace(/\s/g, ''))
  toast.add({
    title: 'IBAN copiado',
    description: 'IBAN copiado para a área de transferência.',
    icon: 'i-lucide-check',
    color: 'success'
  })
}
</script>

<template>
  <UModal
    :open="open"
    title="Transferência Bancária"
    description="Utilize os seguintes dados para efetuar a transferência"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <div class="space-y-6">
        <div class="flex items-center justify-center">
          <div class="flex flex-col items-center gap-1">
            <UIcon name="i-lucide-landmark" class="size-12 text-primary" />
            <span class="text-sm text-muted">Transferência Bancária</span>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-4">
          <div class="flex items-center justify-between rounded-lg bg-elevated p-4">
            <div>
              <p class="text-xs font-medium text-muted uppercase tracking-wide">
                Beneficiário
              </p>
              <p class="mt-1 font-semibold text-highlighted">
                {{ SAM_NAME }}
              </p>
            </div>
            <UIcon name="i-lucide-building-2" class="size-6 text-muted shrink-0" />
          </div>

          <div class="flex items-center justify-between rounded-lg bg-elevated p-4">
            <div>
              <p class="text-xs font-medium text-muted uppercase tracking-wide">
                IBAN
              </p>
              <p class="mt-1 text-xl font-mono font-bold text-highlighted tracking-widest">
                {{ SAM_IBAN }}
              </p>
            </div>
            <UIcon name="i-lucide-credit-card" class="size-6 text-muted shrink-0" />
          </div>
        </div>

        <div class="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/5 px-4 py-3">
          <UIcon name="i-lucide-info" class="size-4 text-warning shrink-0" />
          <p class="text-sm text-muted">
            Indique o número do documento como referência na transferência.
          </p>
        </div>

        <div class="flex justify-end gap-2">
          <UButton
            label="Fechar"
            color="neutral"
            variant="subtle"
            @click="emit('update:open', false)"
          />
          <UButton
            label="Copiar IBAN"
            icon="i-lucide-copy"
            color="primary"
            @click="copyIBAN"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
