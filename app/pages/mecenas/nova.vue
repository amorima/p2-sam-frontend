<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

type PaymentMethod = 'Numerário' | 'Transferência Bancária' | 'Referência Multibanco' | 'Cheque'

const toast = useToast()
const router = useRouter()
const { patronNif, patronName, isAdmin } = useAuth()

if (isAdmin.value) {
  await navigateTo('/donations/new')
}

interface PatronData {
  resource: { nif_nipc: string }
  entity: { nif_nipc: string, nome_entidade: string, email_login: string, iban: string }
  locations: Array<{ rua: string, n_porta: string, codigo_postal: string, concelho: string }>
  contacts: object[]
}

const { data: patronData } = await useFetch<PatronData>(
  () => `/api/patrons/${patronNif.value}`,
  { server: false, immediate: !!patronNif.value }
)

const schema = z.object({
  data: z.string().min(1, 'Data obrigatória'),
  valor_transacao: z.number({ message: 'Valor obrigatório' }).positive('O valor deve ser positivo'),
  metodo_pagamento: z.string().min(1, 'Método de doação obrigatório'),
  anonimo: z.boolean(),
  url_comprovativo: z.string().optional(),
  nome_entidade: z.string().min(2, 'Nome obrigatório'),
  nif_nipc: z.string().length(9, 'NIF/NIPC deve ter 9 dígitos'),
  email: z.string().email('Email inválido'),
  iban: z.string().min(15, 'IBAN inválido'),
  rua: z.string().min(1, 'Morada obrigatória'),
  n_porta: z.string().optional(),
  codigo_postal: z.string().min(1, 'Código postal obrigatório'),
  concelho: z.string().min(1, 'Concelho obrigatório')
})

type Schema = z.output<typeof schema>

const today = new Date().toISOString().split('T')[0]!

const state = reactive<Partial<Schema>>({
  data: today,
  valor_transacao: undefined,
  metodo_pagamento: 'Numerário',
  anonimo: false,
  url_comprovativo: '',
  nome_entidade: '',
  nif_nipc: '',
  email: '',
  iban: '',
  rua: '',
  n_porta: '',
  codigo_postal: '',
  concelho: ''
})

watch(patronData, (data) => {
  if (!data) return
  state.nome_entidade = data.entity.nome_entidade
  state.nif_nipc = data.entity.nif_nipc
  state.email = data.entity.email_login
  state.iban = data.entity.iban
  const loc = data.locations[0]
  if (loc) {
    state.rua = loc.rua
    state.n_porta = loc.n_porta
    state.codigo_postal = loc.codigo_postal
    state.concelho = loc.concelho
  }
}, { immediate: true })

const paymentMethods: PaymentMethod[] = [
  'Numerário',
  'Transferência Bancária',
  'Referência Multibanco',
  'Cheque'
]

const showMBModal = ref(false)
const isEditingData = ref(false)
const isSubmitting = ref(false)

watch(() => state.metodo_pagamento, (method) => {
  if (method === 'Referência Multibanco' && (state.valor_transacao ?? 0) > 0) {
    showMBModal.value = true
  }
})

const docNumber = useState('docNumber.patron', () => {
  const year = new Date().getFullYear()
  const rand = String(Math.floor(1000 + Math.random() * 9000))
  return `DOA-${year}-${rand}`
})

const formattedTotal = computed(() =>
  state.valor_transacao
    ? new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(state.valor_transacao)
    : '—'
)

function openMBModal() {
  if ((state.valor_transacao ?? 0) <= 0) {
    toast.add({ title: 'Valor em falta', description: 'Introduza um valor antes de gerar a referência.', icon: 'i-lucide-alert-circle', color: 'warning' })
    return
  }
  showMBModal.value = true
}

async function onSubmit(event: FormSubmitEvent<Schema>) {
  if (!patronNif.value) {
    toast.add({ title: 'Sessão inválida', description: 'Não foi possível identificar o mecenas.', color: 'error' })
    return
  }

  isSubmitting.value = true
  try {
    await $fetch(`/api/patrons/${patronNif.value}/donations`, {
      method: 'POST',
      body: {
        data: event.data.data,
        valor_transacao: event.data.valor_transacao,
        tipo_donativo: 'NUMERARIO',
        anonimo: event.data.anonimo,
        url_comprovativo: event.data.url_comprovativo || '',
        estado: 'PENDENTE'
      }
    })

    toast.add({
      title: 'Doação submetida',
      description: 'A sua doação foi submetida e aguarda aprovação.',
      icon: 'i-lucide-check',
      color: 'success'
    })

    router.push('/mecenas')
  } catch {
    toast.add({ title: 'Erro ao submeter', description: 'Não foi possível registar a doação.', icon: 'i-lucide-x', color: 'error' })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <UDashboardPanel id="mecenas-nova">
    <template #header>
      <UDashboardNavbar title="Nova Doação">
        <template #leading>
          <UDashboardSidebarCollapse />
          <UButton
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="ghost"
            to="/mecenas"
            class="hidden lg:flex"
          />
        </template>
        <template #right>
          <UBadge color="warning" variant="subtle" size="lg" class="hidden sm:flex">
            PENDENTE
          </UBadge>
          <UButton label="Cancelar" color="neutral" variant="ghost" to="/mecenas" />
          <UButton
            form="patron-donation-form"
            label="Submeter Doação"
            icon="i-lucide-send"
            color="primary"
            type="submit"
            :loading="isSubmitting"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UForm
        id="patron-donation-form"
        :schema="schema"
        :state="state"
        class="space-y-6"
        @submit="onSubmit"
      >
        <!-- Doc header -->
        <UPageCard variant="subtle" class="px-6 py-4">
          <div class="flex flex-wrap items-center gap-x-8 gap-y-4">
            <div class="flex items-center gap-3">
              <UIcon name="i-lucide-file-text" class="size-5 text-muted shrink-0" />
              <div>
                <p class="text-xs text-muted uppercase tracking-wide font-medium">Nº Documento</p>
                <p class="font-mono font-semibold text-highlighted">{{ docNumber }}</p>
              </div>
            </div>
            <USeparator orientation="vertical" class="h-10 hidden sm:block" />
            <UFormField name="data" label="Data de Emissão">
              <UInput v-model="state.data" type="date" class="w-44" />
            </UFormField>
          </div>
        </UPageCard>

        <!-- Donor data + Beneficiary -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2">
            <UPageCard variant="subtle" class="h-full">
              <template #header>
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <UIcon name="i-lucide-user-circle" class="size-4 text-muted" />
                    <h3 class="font-semibold text-highlighted">Os Seus Dados</h3>
                  </div>
                  <UButton
                    :label="isEditingData ? 'Fechar edição' : 'Editar dados'"
                    :icon="isEditingData ? 'i-lucide-x' : 'i-lucide-pencil'"
                    color="neutral"
                    variant="ghost"
                    size="sm"
                    @click="isEditingData = !isEditingData"
                  />
                </div>
              </template>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <UFormField name="nome_entidade" label="Nome / Razão Social" class="sm:col-span-2">
                  <UInput v-model="state.nome_entidade" :disabled="!isEditingData" class="w-full" />
                </UFormField>
                <UFormField name="nif_nipc" label="NIF / NIPC">
                  <UInput v-model="state.nif_nipc" :disabled="!isEditingData" class="w-full" />
                </UFormField>
                <UFormField name="email" label="Email">
                  <UInput v-model="state.email" type="email" :disabled="!isEditingData" class="w-full" />
                </UFormField>
                <UFormField name="iban" label="IBAN" class="sm:col-span-2">
                  <UInput v-model="state.iban" :disabled="!isEditingData" class="w-full font-mono" />
                </UFormField>
                <UFormField name="rua" label="Rua">
                  <UInput v-model="state.rua" :disabled="!isEditingData" class="w-full" />
                </UFormField>
                <UFormField name="n_porta" label="Nº Porta">
                  <UInput v-model="state.n_porta" :disabled="!isEditingData" class="w-full" />
                </UFormField>
                <UFormField name="codigo_postal" label="Código Postal">
                  <UInput v-model="state.codigo_postal" :disabled="!isEditingData" class="w-full" />
                </UFormField>
                <UFormField name="concelho" label="Concelho">
                  <UInput v-model="state.concelho" :disabled="!isEditingData" class="w-full" />
                </UFormField>
              </div>
            </UPageCard>
          </div>

          <div>
            <UPageCard variant="subtle" class="h-full">
              <template #header>
                <div class="flex items-center gap-2">
                  <UIcon name="i-lucide-landmark" class="size-4 text-muted" />
                  <h3 class="font-semibold text-highlighted">Beneficiário</h3>
                </div>
              </template>
              <div class="space-y-3 text-sm">
                <div>
                  <p class="text-xs text-muted uppercase tracking-wide font-medium mb-0.5">Organização</p>
                  <p class="font-semibold text-highlighted">SAM</p>
                  <p class="text-muted">Serviço de Apoio Municipal</p>
                </div>
                <USeparator />
                <div>
                  <p class="text-xs text-muted uppercase tracking-wide font-medium mb-0.5">Morada</p>
                  <p class="text-default">Rua Central, 1</p>
                  <p class="text-default">4490-000 Porto, Portugal</p>
                </div>
                <USeparator />
                <div>
                  <p class="text-xs text-muted uppercase tracking-wide font-medium mb-1">Tipo</p>
                  <UBadge color="primary" variant="subtle">Donativo</UBadge>
                </div>
              </div>
            </UPageCard>
          </div>
        </div>

        <!-- Donation details -->
        <UPageCard variant="subtle">
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-hand-coins" class="size-4 text-muted" />
              <h3 class="font-semibold text-highlighted">Detalhes da Doação</h3>
            </div>
          </template>

          <div class="space-y-6">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start rounded-lg border border-default bg-elevated/30 p-4">
              <UFormField name="valor_transacao" label="Valor Doado" required>
                <UInput
                  v-model="state.valor_transacao"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0,00"
                  trailing-icon="i-lucide-euro"
                  class="w-full"
                />
              </UFormField>

              <UFormField name="metodo_pagamento" label="Método de Pagamento" required>
                <USelect
                  v-model="state.metodo_pagamento"
                  :items="paymentMethods"
                  class="w-full"
                />
              </UFormField>
            </div>

            <div
              v-if="state.metodo_pagamento === 'Referência Multibanco'"
              class="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3"
            >
              <UIcon name="i-lucide-info" class="size-4 text-primary shrink-0" />
              <p class="text-sm text-default flex-1">
                Gere a referência Multibanco para efetuar o pagamento.
              </p>
              <UButton
                label="Ver referência"
                icon="i-lucide-qr-code"
                color="primary"
                variant="subtle"
                size="sm"
                @click="openMBModal"
              />
            </div>

            <USeparator />

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <UFormField name="url_comprovativo" label="URL do Comprovativo">
                <UInput
                  v-model="state.url_comprovativo"
                  placeholder="https://exemplo.com/comprovativo.pdf"
                  icon="i-lucide-link"
                  class="w-full"
                />
              </UFormField>
              <UFormField name="anonimo" label="Doação Anónima">
                <div class="flex items-center gap-3 h-[34px]">
                  <USwitch v-model="state.anonimo" />
                  <span class="text-sm text-muted">
                    {{ state.anonimo ? 'O seu nome não será divulgado' : 'Doação pública' }}
                  </span>
                </div>
              </UFormField>
            </div>
          </div>
        </UPageCard>

        <!-- Summary -->
        <UPageCard variant="subtle">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p class="text-xs text-muted uppercase tracking-wide font-medium">Total da Doação</p>
              <p class="text-3xl font-bold text-highlighted mt-1">{{ formattedTotal }}</p>
              <p class="text-sm text-muted mt-0.5">
                Donativo monetário · {{ state.metodo_pagamento }}
              </p>
            </div>
            <div class="flex gap-2">
              <UButton label="Cancelar" color="neutral" variant="outline" to="/mecenas" />
              <UButton
                form="patron-donation-form"
                label="Submeter Doação"
                icon="i-lucide-send"
                color="primary"
                type="submit"
                :loading="isSubmitting"
              />
            </div>
          </div>
        </UPageCard>
      </UForm>

      <DonationsMBReferenceModal
        v-model:open="showMBModal"
        :amount="state.valor_transacao ?? 0"
      />
    </template>
  </UDashboardPanel>
</template>
