<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useNeeds } from '~/composables/useNeeds'

interface InstitutionEntity {
  nif_nipc: string
  nome_entidade: string
  email_login: string
  iban: string
}

interface InstitutionLocation {
  rua: string
  n_porta: string
  codigo_postal: string
  concelho: string
  distrito: string
  freguesia: string
  pais: string
}

interface InstitutionFull {
  resource: { nif_nipc: string, geo_latitude: number, geo_longitude: number, url_comprovativo_estatuto: string }
  entity: InstitutionEntity
  locations: InstitutionLocation[]
  contacts: Array<{ contacto: string, nome_contacto: string, descricao: string }>
}

const props = defineProps<{
  open: boolean
  institution: InstitutionFull | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'saved': [nif: string]
}>()

const isEditing = computed(() => !!props.institution)
const toast = useToast()
const isSubmitting = ref(false)
const { institutions } = useNeeds()

const schema = z.object({
  nif_nipc: z.string().length(9, 'NIF/NIPC deve ter exatamente 9 dígitos'),
  nome_entidade: z.string().min(2, 'Nome obrigatório'),
  email_login: z.string().email('Email inválido'),
  iban: z.string().min(15, 'IBAN inválido'),
  rua: z.string().min(1, 'Rua obrigatória'),
  n_porta: z.string().optional(),
  codigo_postal: z.string().min(1, 'Código postal obrigatório'),
  concelho: z.string().min(1, 'Concelho obrigatório'),
  distrito: z.string().optional(),
  freguesia: z.string().optional(),
  pais: z.string().optional(),
  contacto: z.string().optional(),
  nome_contacto: z.string().optional(),
  descricao_contacto: z.string().optional()
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  pais: 'Portugal'
})

watch(() => props.open, (isOpen) => {
  if (!isOpen) return
  if (props.institution) {
    const e = props.institution.entity
    const l = props.institution.locations[0]
    const c = props.institution.contacts[0]
    state.nif_nipc = e.nif_nipc
    state.nome_entidade = e.nome_entidade
    state.email_login = e.email_login
    state.iban = e.iban
    state.rua = l?.rua ?? ''
    state.n_porta = l?.n_porta ?? ''
    state.codigo_postal = l?.codigo_postal ?? ''
    state.concelho = l?.concelho ?? ''
    state.distrito = l?.distrito ?? ''
    state.freguesia = l?.freguesia ?? ''
    state.pais = l?.pais ?? 'Portugal'
    state.contacto = c?.contacto ?? ''
    state.nome_contacto = c?.nome_contacto ?? ''
    state.descricao_contacto = c?.descricao ?? ''
  } else {
    Object.assign(state, {
      nif_nipc: '',
      nome_entidade: '',
      email_login: '',
      iban: '',
      rua: '',
      n_porta: '',
      codigo_postal: '',
      concelho: '',
      distrito: '',
      freguesia: '',
      pais: 'Portugal',
      contacto: '',
      nome_contacto: '',
      descricao_contacto: ''
    })
  }
})

async function onSubmit(event: FormSubmitEvent<Schema>) {
  isSubmitting.value = true
  try {
    const nif = event.data.nif_nipc
    const newRecord: InstitutionFull = {
      resource: {
        nif_nipc: nif,
        geo_latitude: props.institution?.resource.geo_latitude ?? 41.35,
        geo_longitude: props.institution?.resource.geo_longitude ?? -8.74,
        url_comprovativo_estatuto: props.institution?.resource.url_comprovativo_estatuto ?? ''
      },
      entity: {
        nif_nipc: nif,
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
        freguesia: event.data.freguesia ?? '',
        pais: event.data.pais ?? 'Portugal'
      }],
      contacts: event.data.contacto
        ? [{ contacto: event.data.contacto, nome_contacto: event.data.nome_contacto ?? '', descricao: event.data.descricao_contacto ?? '' }]
        : []
    }

    if (isEditing.value) {
      const idx = institutions.value.findIndex(i => i.resource.nif_nipc === props.institution!.resource.nif_nipc)
      if (idx >= 0) institutions.value.splice(idx, 1, newRecord)
    } else {
      if (institutions.value.some(i => i.resource.nif_nipc === nif)) {
        toast.add({ title: 'NIF/NIPC já existe', description: 'Já existe uma instituição com este NIF/NIPC.', icon: 'i-lucide-alert-circle', color: 'error' })
        isSubmitting.value = false
        return
      }
      institutions.value.push(newRecord)
    }

    toast.add({
      title: isEditing.value ? 'Instituição atualizada' : 'Instituição criada',
      description: isEditing.value
        ? 'Os dados da instituição foram atualizados.'
        : `Instituição ${event.data.nome_entidade} criada com sucesso.`,
      icon: 'i-lucide-check',
      color: 'success'
    })

    emit('saved', nif)
    emit('update:open', false)
  } catch {
    toast.add({
      title: 'Erro',
      description: isEditing.value ? 'Não foi possível atualizar a instituição.' : 'Não foi possível criar a instituição.',
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
    :title="isEditing ? 'Editar Instituição' : 'Nova Instituição'"
    :description="isEditing ? `A editar: ${institution?.entity.nome_entidade}` : 'Preencha os dados para registar uma nova instituição.'"
    :ui="{ content: 'max-w-2xl' }"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <UForm
        :schema="schema"
        :state="state"
        class="space-y-5"
        @submit="onSubmit"
      >
        <div>
          <p class="text-xs font-semibold text-muted uppercase tracking-wide mb-3">
            Dados da Entidade
          </p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <UFormField name="nif_nipc" label="NIF / NIPC" required>
              <UInput
                v-model="state.nif_nipc"
                :disabled="isEditing"
                class="w-full font-mono"
                maxlength="9"
                placeholder="500999888"
              />
            </UFormField>
            <UFormField name="nome_entidade" label="Nome da Instituição" required>
              <UInput v-model="state.nome_entidade" class="w-full" />
            </UFormField>
            <UFormField name="email_login" label="Email de Login" required>
              <UInput v-model="state.email_login" type="email" class="w-full" />
            </UFormField>
            <UFormField name="iban" label="IBAN" required>
              <UInput v-model="state.iban" class="w-full font-mono" placeholder="PT50..." />
            </UFormField>
          </div>
        </div>

        <USeparator label="Localização" />

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormField name="rua" label="Rua" required class="sm:col-span-2">
            <UInput v-model="state.rua" class="w-full" />
          </UFormField>
          <UFormField name="n_porta" label="Nº Porta">
            <UInput v-model="state.n_porta" class="w-full" />
          </UFormField>
          <UFormField name="codigo_postal" label="Código Postal" required>
            <UInput v-model="state.codigo_postal" class="w-full" placeholder="0000-000" />
          </UFormField>
          <UFormField name="concelho" label="Concelho" required>
            <UInput v-model="state.concelho" class="w-full" />
          </UFormField>
          <UFormField name="distrito" label="Distrito">
            <UInput v-model="state.distrito" class="w-full" />
          </UFormField>
          <UFormField name="freguesia" label="Freguesia">
            <UInput v-model="state.freguesia" class="w-full" />
          </UFormField>
          <UFormField name="pais" label="País">
            <UInput v-model="state.pais" class="w-full" />
          </UFormField>
        </div>

        <USeparator label="Contacto Principal (opcional)" />

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <UFormField name="contacto" label="Contacto">
            <UInput v-model="state.contacto" class="w-full" placeholder="912 345 678" />
          </UFormField>
          <UFormField name="nome_contacto" label="Nome do Contacto">
            <UInput v-model="state.nome_contacto" class="w-full" />
          </UFormField>
          <UFormField name="descricao_contacto" label="Função">
            <UInput v-model="state.descricao_contacto" class="w-full" placeholder="Diretor" />
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
            :label="isEditing ? 'Guardar alterações' : 'Criar Instituição'"
            :icon="isEditing ? 'i-lucide-check' : 'i-lucide-plus'"
            color="primary"
            type="submit"
            :loading="isSubmitting"
          />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
