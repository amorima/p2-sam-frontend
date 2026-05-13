<script setup lang="ts">
const props = defineProps<{
  open: boolean
  amount: number
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const toast = useToast()

const mbData = computed(() => {
  const entidade = String(Math.floor(10000 + Math.random() * 90000))
  const ref1 = String(Math.floor(100 + Math.random() * 900))
  const ref2 = String(Math.floor(100 + Math.random() * 900))
  const ref3 = String(Math.floor(100 + Math.random() * 900))
  const referencia = `${ref1} ${ref2} ${ref3}`

  const validUntil = new Date()
  validUntil.setDate(validUntil.getDate() + 30)
  const validUntilStr = validUntil.toLocaleDateString('pt-PT')

  return { entidade, referencia, validUntil: validUntilStr }
})

const formattedAmount = computed(() =>
  new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(props.amount || 0)
)

async function copyData() {
  const text = `Entidade: ${mbData.value.entidade}\nReferência: ${mbData.value.referencia}\nMontante: ${formattedAmount.value}\nVálido até: ${mbData.value.validUntil}`
  await navigator.clipboard.writeText(text)
  toast.add({
    title: 'Copiado',
    description: 'Dados da referência copiados para a área de transferência.',
    icon: 'i-lucide-check',
    color: 'success'
  })
}
</script>

<template>
  <UModal
    :open="open"
    title="Referência Multibanco"
    description="Utilize os seguintes dados para efetuar o pagamento"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <div class="space-y-6">
        <div class="flex items-center justify-center">
          <div class="flex flex-col items-center gap-1">
            <UIcon name="i-lucide-credit-card" class="size-12 text-primary" />
            <span class="text-sm text-muted">Multibanco</span>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-4">
          <div class="flex items-center justify-between rounded-lg bg-elevated p-4">
            <div>
              <p class="text-xs font-medium text-muted uppercase tracking-wide">
                Entidade
              </p>
              <p class="mt-1 text-2xl font-mono font-bold text-highlighted">
                {{ mbData.entidade }}
              </p>
            </div>
            <UIcon name="i-lucide-building-2" class="size-6 text-muted" />
          </div>

          <div class="flex items-center justify-between rounded-lg bg-elevated p-4">
            <div>
              <p class="text-xs font-medium text-muted uppercase tracking-wide">
                Referência
              </p>
              <p class="mt-1 text-2xl font-mono font-bold text-highlighted tracking-widest">
                {{ mbData.referencia }}
              </p>
            </div>
            <UIcon name="i-lucide-hash" class="size-6 text-muted" />
          </div>

          <div class="flex items-center justify-between rounded-lg bg-elevated p-4">
            <div>
              <p class="text-xs font-medium text-muted uppercase tracking-wide">
                Montante
              </p>
              <p class="mt-1 text-2xl font-mono font-bold text-primary">
                {{ formattedAmount }}
              </p>
            </div>
            <UIcon name="i-lucide-euro" class="size-6 text-muted" />
          </div>
        </div>

        <div class="flex items-center gap-2 rounded-lg border border-default bg-elevated/50 px-4 py-3">
          <UIcon name="i-lucide-calendar-clock" class="size-4 text-warning shrink-0" />
          <p class="text-sm text-muted">
            Válido até <span class="font-semibold text-default">{{ mbData.validUntil }}</span>
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
            label="Copiar dados"
            icon="i-lucide-copy"
            color="primary"
            @click="copyData"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
