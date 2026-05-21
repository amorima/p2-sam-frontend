<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { generateDonationPDFBlob, donationDocNumber, type ReceiptDonation } from '~/utils/donationPDF'

interface Donation {
  id_doacao: number
  mecena_nif_nipc: string
  nome_entidade?: string
  data: string
  valor_transacao: number
  tipo_donativo: string
  estado: 'ACEITE' | 'REJEITADO' | 'PENDENTE'
  url_comprovativo: string
}

const props = defineProps<{
  open: boolean
  donation: Donation | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'updated': []
}>()

const toast = useToast()
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
  data => data.estado !== 'REJEITADO' || (data.motivo_recusa?.trim().length ?? 0) > 0,
  { message: 'O motivo da recusa é obrigatório', path: ['motivo_recusa'] }
)

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  estado: 'PENDENTE',
  motivo_recusa: ''
})

watch(() => props.donation, (d) => {
  if (d) {
    state.estado = d.estado
    state.motivo_recusa = d.estado === 'REJEITADO' ? d.url_comprovativo : ''
  }
})

const estadoBadgeColor = computed(() => {
  const map: Record<string, 'warning' | 'success' | 'error'> = {
    PENDENTE: 'warning',
    ACEITE: 'success',
    REJEITADO: 'error'
  }
  return map[state.estado ?? 'PENDENTE'] ?? 'warning'
})

async function onSubmit(event: FormSubmitEvent<Schema>) {
  if (!props.donation) return
  isSubmitting.value = true

  try {
    const body: Record<string, unknown> = { estado: event.data.estado }

    if (event.data.estado === 'ACEITE') {
      const receipt: ReceiptDonation = {
        id_doacao: props.donation.id_doacao,
        mecena_nif_nipc: props.donation.mecena_nif_nipc,
        nome_entidade: props.donation.nome_entidade,
        data: props.donation.data,
        valor_transacao: props.donation.valor_transacao,
        tipo_donativo: props.donation.tipo_donativo,
        estado: 'ACEITE'
      }

      const pdfBlob = generateDonationPDFBlob(receipt)
      const fileName = `${donationDocNumber(receipt)}.pdf`
      const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' })
      const formData = new FormData()
      formData.append('file', pdfFile, fileName)

      const uploadResult = await $fetch<{ url: string }>(
        `/api/upload/files?nome=${encodeURIComponent(fileName)}`,
        { method: 'POST', body: formData }
      )
      body.url_comprovativo = uploadResult.url
    } else if (event.data.estado === 'REJEITADO' && event.data.motivo_recusa) {
      body.url_comprovativo = event.data.motivo_recusa
    }

    await $fetch(`/api/donations/${props.donation.id_doacao}`, {
      method: 'PATCH',
      body
    })

    toast.add({
      title: 'Estado atualizado',
      description: `Doação #${props.donation.id_doacao} marcada como ${event.data.estado.toLowerCase()}.`,
      icon: 'i-lucide-check',
      color: 'success'
    })

    emit('updated')
    emit('update:open', false)
  } catch (e) {
    console.error(e)
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
    title="Atualizar Estado da Doação"
    :description="donation ? `Doação #${donation.id_doacao} — ${donation.nome_entidade ?? donation.mecena_nif_nipc}` : ''"
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
          v-if="donation"
          class="flex flex-wrap gap-4 rounded-lg bg-elevated/50 border border-default p-4 text-sm"
        >
          <div>
            <p class="text-xs text-muted uppercase tracking-wide font-medium">
              Valor
            </p>
            <p class="font-semibold">
              {{ new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(donation.valor_transacao) }}
            </p>
          </div>
          <div>
            <p class="text-xs text-muted uppercase tracking-wide font-medium">
              Data
            </p>
            <p class="font-semibold">
              {{ new Date(donation.data).toLocaleDateString('pt-PT') }}
            </p>
          </div>
          <div>
            <p class="text-xs text-muted uppercase tracking-wide font-medium">
              Estado atual
            </p>
            <UBadge :color="estadoBadgeColor" variant="subtle" size="sm">
              {{ donation.estado }}
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
          description="Explique o motivo pelo qual esta doação está a ser recusada."
          required
        >
          <UTextarea
            v-model="state.motivo_recusa"
            :rows="3"
            placeholder="Indique o motivo da recusa..."
            class="w-full"
          />
        </UFormField>

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
