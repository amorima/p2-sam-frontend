<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useNeeds } from '~/composables/useNeeds'
import type { Business } from '~/utils/mockData'

const toast = useToast()
const router = useRouter()
const { isAdmin } = useAuth()
const { businesses, addBusiness } = useNeeds()

if (!isAdmin.value) {
  await navigateTo('/negocios')
}

const docNumber = useState('docNumber.negocio', () => {
  const year = new Date().getFullYear()
  const rand = String(Math.floor(1000 + Math.random() * 9000))
  return `NEG-${year}-${rand}`
})

const schema = z.object({
  nif_nipc: z.string().length(9, 'NIF/NIPC deve ter exatamente 9 dígitos'),
  nome_entidade: z.string().min(2, 'Nome obrigatório'),
  email_login: z.string().email('Email inválido'),
  iban: z.string().min(15, 'IBAN inválido'),
  geo_latitude: z.number(),
  geo_longitude: z.number()
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  nif_nipc: '',
  nome_entidade: '',
  email_login: '',
  iban: '',
  geo_latitude: 41.3526,
  geo_longitude: -8.7396
})

const isSubmitting = ref(false)

async function onSubmit(event: FormSubmitEvent<Schema>) {
  if (businesses.value.some(b => b.resource.nif_nipc === event.data.nif_nipc)) {
    toast.add({ title: 'NIF/NIPC já existe', description: 'Já existe um negócio com este NIF/NIPC.', icon: 'i-lucide-alert-circle', color: 'error' })
    return
  }
  isSubmitting.value = true
  try {
    const newBiz: Business = {
      resource: {
        nif_nipc: event.data.nif_nipc,
        geo_latitude: event.data.geo_latitude,
        geo_longitude: event.data.geo_longitude
      },
      entity: {
        nif_nipc: event.data.nif_nipc,
        nome_entidade: event.data.nome_entidade,
        email_login: event.data.email_login,
        iban: event.data.iban
      },
      offers: []
    }
    addBusiness(newBiz)
    toast.add({ title: 'Negócio registado', description: `${event.data.nome_entidade} adicionado com sucesso. Adicione categorias de oferta no perfil do negócio.`, icon: 'i-lucide-check', color: 'success' })
    router.push('/negocios')
  } catch {
    toast.add({ title: 'Erro ao registar', description: 'Não foi possível registar o negócio.', icon: 'i-lucide-x', color: 'error' })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <UDashboardPanel id="negocio-registo">
    <template #header>
      <UDashboardNavbar title="Registo Manual de Negócio">
        <template #leading>
          <UDashboardSidebarCollapse />
          <UButton
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="ghost"
            to="/negocios"
            class="hidden lg:flex"
          />
        </template>
        <template #right>
          <UButton
            label="Cancelar"
            color="neutral"
            variant="ghost"
            to="/negocios"
          />
          <UButton
            form="negocio-form"
            label="Registar Negócio"
            icon="i-lucide-save"
            color="primary"
            type="submit"
            :loading="isSubmitting"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UForm
        id="negocio-form"
        :schema="schema"
        :state="state"
        class="space-y-6"
        @submit="onSubmit"
      >
        <UPageCard variant="subtle" class="px-6 py-4">
          <div class="flex flex-wrap items-center gap-x-8 gap-y-4">
            <div class="flex items-center gap-3">
              <UIcon name="i-lucide-file-text" class="size-5 text-muted shrink-0" />
              <div>
                <p class="text-xs text-muted uppercase tracking-wide font-medium">
                  Nº Documento
                </p>
                <p class="font-mono font-semibold text-highlighted">
                  {{ docNumber }}
                </p>
              </div>
            </div>
          </div>
        </UPageCard>

        <UPageCard variant="subtle">
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-store" class="size-4 text-muted" />
              <h3 class="font-semibold text-highlighted">
                Dados do Negócio
              </h3>
            </div>
          </template>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <UFormField name="nif_nipc" label="NIF / NIPC" required>
              <UInput
                v-model="state.nif_nipc"
                class="w-full font-mono"
                maxlength="9"
                placeholder="510100200"
              />
            </UFormField>
            <UFormField name="nome_entidade" label="Nome do Negócio" required>
              <UInput v-model="state.nome_entidade" class="w-full" placeholder="Ex.: Advogados Costa & Associados" />
            </UFormField>
            <UFormField name="email_login" label="Email de Login" required>
              <UInput
                v-model="state.email_login"
                type="email"
                class="w-full"
                placeholder="contacto@negocio.pt"
              />
            </UFormField>
            <UFormField name="iban" label="IBAN" required>
              <UInput v-model="state.iban" class="w-full font-mono" placeholder="PT50..." />
            </UFormField>
            <UFormField name="geo_latitude" label="Latitude">
              <UInput
                v-model="state.geo_latitude"
                type="number"
                step="0.0001"
                class="w-full font-mono"
              />
            </UFormField>
            <UFormField name="geo_longitude" label="Longitude">
              <UInput
                v-model="state.geo_longitude"
                type="number"
                step="0.0001"
                class="w-full font-mono"
              />
            </UFormField>
          </div>
        </UPageCard>

        <UAlert
          icon="i-lucide-info"
          color="info"
          variant="subtle"
          title="Categorias e Ofertas"
          description="Após registar o negócio, peça aos responsáveis para entrar e adicionar as suas categorias de oferta (bens/serviços, preço e desconto/pro bono) na vista 'O Meu Negócio'. Sem categorias, o negócio não aparece nas pesquisas de match."
        />

        <UPageCard variant="subtle">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p class="text-xs text-muted uppercase tracking-wide font-medium">
                Resumo
              </p>
              <p class="text-base font-semibold text-highlighted mt-1">
                {{ state.nome_entidade || 'Novo negócio' }}
              </p>
              <p class="text-sm text-muted mt-0.5">
                NIF {{ state.nif_nipc || '—' }} · {{ state.email_login || 'sem email' }}
              </p>
            </div>
            <div class="flex gap-2">
              <UButton
                label="Cancelar"
                color="neutral"
                variant="outline"
                to="/negocios"
              />
              <UButton
                form="negocio-form"
                label="Registar Negócio"
                icon="i-lucide-save"
                color="primary"
                type="submit"
                :loading="isSubmitting"
              />
            </div>
          </div>
        </UPageCard>
      </UForm>
    </template>
  </UDashboardPanel>
</template>
