<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

interface PatronData {
  nif_nipc: string
  nome_entidade: string
  email_login: string
  iban: string
  rua: string
  n_porta: string
  codigo_postal: string
  concelho: string
  distrito: string
  pais: string
}

const props = defineProps<{
  open: boolean
  patron: PatronData
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'saved': [updated: PatronData]
}>()

const toast = useToast()
const isSubmitting = ref(false)

const schema = z.object({
  nome_entidade: z.string().min(2, 'Nome obrigatório'),
  email_login: z.string().email('Email inválido'),
  iban: z.string().min(15, 'IBAN inválido'),
  rua: z.string().min(1, 'Rua obrigatória'),
  n_porta: z.string().optional(),
  codigo_postal: z.string().min(1, 'Código postal obrigatório'),
  concelho: z.string().min(1, 'Concelho obrigatório'),
  distrito: z.string().optional(),
  pais: z.string().optional()
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({})

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    state.nome_entidade = props.patron.nome_entidade
    state.email_login = props.patron.email_login
    state.iban = props.patron.iban
    state.rua = props.patron.rua
    state.n_porta = props.patron.n_porta
    state.codigo_postal = props.patron.codigo_postal
    state.concelho = props.patron.concelho
    state.distrito = props.patron.distrito
    state.pais = props.patron.pais
  }
})

async function onSubmit(event: FormSubmitEvent<Schema>) {
  isSubmitting.value = true
  try {
    await $fetch(`/api/patrons/${props.patron.nif_nipc}`, {
      method: 'PATCH',
      body: {
        entity: {
          nome_entidade: event.data.nome_entidade,
          email_login: event.data.email_login,
          iban: event.data.iban
        },
        locations: [{
          rua: event.data.rua,
          n_porta: event.data.n_porta ?? '',
          codigo_postal: event.data.codigo_postal,
          concelho: event.data.concelho,
          distrito: event.data.distrito ?? '',
          pais: event.data.pais ?? 'Portugal'
        }]
      }
    })

    toast.add({
      title: 'Dados atualizados',
      description: 'Os seus dados foram guardados com sucesso.',
      icon: 'i-lucide-check',
      color: 'success'
    })

    emit('saved', {
      ...props.patron,
      nome_entidade: event.data.nome_entidade,
      email_login: event.data.email_login,
      iban: event.data.iban,
      rua: event.data.rua,
      n_porta: event.data.n_porta ?? '',
      codigo_postal: event.data.codigo_postal,
      concelho: event.data.concelho,
      distrito: event.data.distrito ?? '',
      pais: event.data.pais ?? 'Portugal'
    })
    emit('update:open', false)
  } catch {
    toast.add({
      title: 'Erro ao guardar',
      description: 'Não foi possível atualizar os dados.',
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
    title="Editar Dados do Mecenas"
    description="Atualize os seus dados de registo. O NIF/NIPC não pode ser alterado."
    :ui="{ content: 'max-w-xl' }"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <UForm
        :schema="schema"
        :state="state"
        class="space-y-5"
        @submit="onSubmit"
      >
        <div class="flex items-center gap-3 rounded-lg bg-elevated/50 border border-default px-4 py-3">
          <UIcon name="i-lucide-fingerprint" class="size-4 text-muted shrink-0" />
          <div>
            <p class="text-xs text-muted">
              NIF / NIPC (não editável)
            </p>
            <p class="font-mono font-semibold text-highlighted">
              {{ patron.nif_nipc }}
            </p>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormField
            name="nome_entidade"
            label="Nome / Razão Social"
            required
            class="sm:col-span-2"
          >
            <UInput v-model="state.nome_entidade" class="w-full" />
          </UFormField>
          <UFormField name="email_login" label="Email" required>
            <UInput v-model="state.email_login" type="email" class="w-full" />
          </UFormField>
          <UFormField name="iban" label="IBAN" required>
            <UInput v-model="state.iban" class="w-full font-mono" />
          </UFormField>
        </div>

        <USeparator label="Localização" />

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormField
            name="rua"
            label="Rua"
            required
            class="sm:col-span-2"
          >
            <UInput v-model="state.rua" class="w-full" />
          </UFormField>
          <UFormField name="n_porta" label="Nº Porta">
            <UInput v-model="state.n_porta" class="w-full" />
          </UFormField>
          <UFormField name="codigo_postal" label="Código Postal" required>
            <UInput v-model="state.codigo_postal" class="w-full" />
          </UFormField>
          <UFormField name="concelho" label="Concelho" required>
            <UInput v-model="state.concelho" class="w-full" />
          </UFormField>
          <UFormField name="distrito" label="Distrito">
            <UInput v-model="state.distrito" class="w-full" />
          </UFormField>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <UButton
            label="Cancelar"
            color="neutral"
            variant="subtle"
            @click="emit('update:open', false)"
          />
          <UButton
            label="Guardar alterações"
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
