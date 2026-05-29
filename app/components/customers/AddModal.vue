<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

const emit = defineEmits<{ created: [] }>()

const schema = z.object({
  name: z.string().min(2, 'Demasiado curto'),
  email: z.string().email('Email inválido'),
  rgpd: z.boolean()
})
const open = ref(false)

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  name: '',
  email: '',
  rgpd: true
})

function reset() {
  state.name = ''
  state.email = ''
  state.rgpd = true
}

const toast = useToast()
const submitting = ref(false)

async function onSubmit(event: FormSubmitEvent<Schema>) {
  submitting.value = true
  try {
    await $fetch('/api/customers', {
      method: 'POST',
      body: {
        name: event.data.name,
        email: event.data.email,
        rgpd: event.data.rgpd
      }
    })
    toast.add({
      title: 'Cidadão criado',
      description: `${event.data.name} foi adicionado.`,
      color: 'success'
    })
    open.value = false
    reset()
    emit('created')
  } catch (err: unknown) {
    const e = err as { statusMessage?: string, data?: { description?: string, message?: string } }
    toast.add({
      title: 'Erro ao criar',
      description: e?.data?.description ?? e?.data?.message ?? e?.statusMessage ?? 'Tente novamente.',
      color: 'error'
    })
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="Novo cidadão"
    description="Adicionar um novo cidadão à base de dados"
  >
    <UButton label="Novo utilizador" icon="i-lucide-plus" />

    <template #body>
      <UForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="Nome" name="name">
          <UInput v-model="state.name" class="w-full" placeholder="João Silva" />
        </UFormField>
        <UFormField label="Email / Contacto" name="email">
          <UInput v-model="state.email" class="w-full" placeholder="joao.silva@example.com" />
        </UFormField>
        <UFormField name="rgpd">
          <UCheckbox v-model="state.rgpd" label="Consentimento RGPD obtido" />
        </UFormField>
        <div class="flex justify-end gap-2">
          <UButton
            label="Cancelar"
            color="neutral"
            variant="subtle"
            @click="open = false"
          />
          <UButton
            label="Criar"
            color="primary"
            variant="solid"
            type="submit"
            :loading="submitting"
          />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
