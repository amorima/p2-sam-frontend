<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

const paymentMethods = ['Numerário', 'Transferência Bancária', 'Referência Multibanco', 'Cheque'] as const

const toast = useToast()
const router = useRouter()
const { isAdmin, patronNif } = useAuth()

if (isAdmin.value) {
  await navigateTo('/mecenas/doacao_manual')
}

const { data: patronRes } = await useFetch<{
  nif_nipc: string
  nome_entidade: string
  email_login: string
  iban: string
  locations: Array<{ rua: string; n_porta: string; codigo_postal: string; concelho: string; distrito: string; pais: string }>
}>(`/api/patrons/${patronNif.value}`, { server: false, lazy: true })

const patronData = reactive<Record<string, string>>({
  nif_nipc: patronNif.value,
  nome_entidade: '',
  email_login: '',
  iban: '',
  rua: '',
  n_porta: '',
  codigo_postal: '',
  concelho: '',
  distrito: '',
  pais: ''
})

watch(patronRes, (res) => {
  if (res) {
    Object.assign(patronData, {
      nome_entidade: res.nome_entidade ?? '',
      email_login: res.email_login ?? '',
      iban: res.iban ?? '',
      ...res.locations?.[0]
    })
  }
}, { immediate: true })

function metodoToTipo(metodo: string): string {
  const map: Record<string, string> = {
    'Numerário': 'NUMERARIO',
    'Transferência Bancária': 'TRANSFERENCIA',
    'Referência Multibanco': 'REFERENCIA',
    'Cheque': 'CHEQUE'
  }
  return map[metodo] ?? 'NUMERARIO'
}

const showEditModal = ref(false)
const showMBModal = ref(false)
const showIBANModal = ref(false)
const isSubmitting = ref(false)

const docNumber = useState('docNumber.doacao', () => {
  const year = new Date().getFullYear()
  const rand = String(Math.floor(1000 + Math.random() * 9000))
  return `DOA-${year}-${rand}`
})

const schema = z.object({
  data: z.string().min(1, 'Data obrigatória'),
  valor_transacao: z.number({ message: 'Valor obrigatório' }).positive('O valor deve ser positivo'),
  metodo_pagamento: z.enum(paymentMethods),
  anonimo: z.boolean()
})

type Schema = z.output<typeof schema>

const today = new Date().toISOString().split('T')[0]!

const state = reactive<Partial<Schema>>({
  data: today,
  valor_transacao: undefined,
  metodo_pagamento: 'Numerário',
  anonimo: false
})

watch(() => state.metodo_pagamento, (method) => {
  if (method === 'Referência Multibanco' && (state.valor_transacao ?? 0) > 0) {
    showMBModal.value = true
  }
  if (method === 'Transferência Bancária') {
    showIBANModal.value = true
  }
})

function openMBModal() {
  if ((state.valor_transacao ?? 0) <= 0) {
    toast.add({ title: 'Valor em falta', description: 'Introduza um valor antes de gerar a referência.', icon: 'i-lucide-alert-circle', color: 'warning' })
    return
  }
  showMBModal.value = true
}

const formattedTotal = computed(() =>
  state.valor_transacao
    ? new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(state.valor_transacao)
    : '—'
)

async function onSubmit(event: FormSubmitEvent<Schema>) {
  isSubmitting.value = true
  try {
    await $fetch(`/api/patrons/${patronNif.value}/donations`, {
      method: 'POST',
      body: {
        data: event.data.data,
        valor_transacao: event.data.valor_transacao,
        tipo_donativo: metodoToTipo(event.data.metodo_pagamento),
        anonimo: event.data.anonimo,
        url_comprovativo: '',
        estado: 'PENDENTE'
      }
    })

    toast.add({
      title: 'Doação submetida',
      description: 'A sua doação foi submetida e aguarda aprovação do SAM.',
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
  <UDashboardPanel id="mecenas-doacao">
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
          <UBadge
            color="warning"
            variant="subtle"
            size="lg"
            class="hidden sm:flex"
          >
            PENDENTE
          </UBadge>
          <UButton
            label="Cancelar"
            color="neutral"
            variant="ghost"
            to="/mecenas"
          />
          <UButton
            form="doacao-form"
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
        id="doacao-form"
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
                <p class="text-xs text-muted uppercase tracking-wide font-medium">
                  Nº Documento
                </p>
                <p class="font-mono font-semibold text-highlighted">
                  {{ docNumber }}
                </p>
              </div>
            </div>
            <USeparator orientation="vertical" class="h-10 hidden sm:block" />
            <UFormField name="data" label="Data de Emissão">
              <UInput v-model="state.data" type="date" class="w-44" />
            </UFormField>
          </div>
        </UPageCard>

        <!-- Donor + Beneficiary -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Patron card -->
          <div class="lg:col-span-2">
            <UPageCard variant="subtle" class="h-full">
              <template #header>
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <UIcon name="i-lucide-user-circle" class="size-4 text-muted" />
                    <h3 class="font-semibold text-highlighted">
                      Os Seus Dados
                    </h3>
                  </div>
                  <UButton
                    label="Editar dados"
                    icon="i-lucide-pencil"
                    color="neutral"
                    variant="outline"
                    size="sm"
                    @click="showEditModal = true"
                  />
                </div>
              </template>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                <div>
                  <p class="text-xs text-muted uppercase tracking-wide font-medium mb-0.5">
                    Nome / Razão Social
                  </p>
                  <p class="font-semibold text-highlighted">
                    {{ patronData.nome_entidade }}
                  </p>
                </div>
                <div>
                  <p class="text-xs text-muted uppercase tracking-wide font-medium mb-0.5">
                    NIF / NIPC
                  </p>
                  <p class="font-mono">
                    {{ patronData.nif_nipc }}
                  </p>
                </div>
                <div>
                  <p class="text-xs text-muted uppercase tracking-wide font-medium mb-0.5">
                    Email
                  </p>
                  <p>{{ patronData.email_login }}</p>
                </div>
                <div>
                  <p class="text-xs text-muted uppercase tracking-wide font-medium mb-0.5">
                    IBAN
                  </p>
                  <p class="font-mono text-xs">
                    {{ patronData.iban }}
                  </p>
                </div>
                <div class="sm:col-span-2">
                  <p class="text-xs text-muted uppercase tracking-wide font-medium mb-0.5">
                    Morada
                  </p>
                  <p>{{ patronData.rua }}, {{ patronData.n_porta }} · {{ patronData.codigo_postal }} {{ patronData.concelho }}</p>
                </div>
              </div>
            </UPageCard>
          </div>

          <!-- Beneficiary card -->
          <div>
            <UPageCard variant="subtle" class="h-full">
              <template #header>
                <div class="flex items-center gap-2">
                  <UIcon name="i-lucide-landmark" class="size-4 text-muted" />
                  <h3 class="font-semibold text-highlighted">
                    Beneficiário
                  </h3>
                </div>
              </template>
              <div class="space-y-3 text-sm">
                <div>
                  <p class="text-xs text-muted uppercase tracking-wide font-medium mb-0.5">
                    Organização
                  </p>
                  <p class="font-semibold text-highlighted">
                    Serviço de Apoio Municipal de Vila do Conde
                  </p>
                </div>
                <USeparator />
                <div>
                  <p class="text-xs text-muted uppercase tracking-wide font-medium mb-0.5">
                    Morada
                  </p>
                  <p>Praça Vasco da Gama</p>
                  <p>4480-454 Vila do Conde</p>
                </div>
                <USeparator />
                <div>
                  <p class="text-xs text-muted uppercase tracking-wide font-medium mb-1">
                    Tipo
                  </p>
                  <UBadge color="primary" variant="subtle">
                    Donativo
                  </UBadge>
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
              <h3 class="font-semibold text-highlighted">
                Detalhes da Doação
              </h3>
            </div>
          </template>

          <div class="space-y-6">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-lg border border-default bg-elevated/30 p-4">
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
                <USelect v-model="state.metodo_pagamento" :items="[...paymentMethods]" class="w-full" />
              </UFormField>
            </div>

            <div v-if="state.metodo_pagamento === 'Transferência Bancária'" class="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
              <UIcon name="i-lucide-info" class="size-4 text-primary shrink-0" />
              <p class="text-sm flex-1">
                Transfira para o IBAN do SAM e indique o nº de documento como referência.
              </p>
              <UButton
                label="Ver IBAN"
                icon="i-lucide-credit-card"
                color="primary"
                variant="subtle"
                size="sm"
                @click="showIBANModal = true"
              />
            </div>

            <div v-if="state.metodo_pagamento === 'Referência Multibanco'" class="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
              <UIcon name="i-lucide-info" class="size-4 text-primary shrink-0" />
              <p class="text-sm flex-1">
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

            <UFormField name="anonimo" label="Doação Anónima">
              <div class="flex items-center gap-3 h-8.5">
                <USwitch v-model="state.anonimo" />
                <span class="text-sm text-muted">{{ state.anonimo ? 'O seu nome não será divulgado publicamente' : 'Doação pública' }}</span>
              </div>
            </UFormField>
          </div>
        </UPageCard>

        <!-- Summary -->
        <UPageCard variant="subtle">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p class="text-xs text-muted uppercase tracking-wide font-medium">
                Total da Doação
              </p>
              <p class="text-3xl font-bold text-highlighted mt-1">
                {{ formattedTotal }}
              </p>
              <p class="text-sm text-muted mt-0.5">
                Donativo monetário · {{ state.metodo_pagamento }}
              </p>
            </div>
            <div class="flex gap-2">
              <UButton
                label="Cancelar"
                color="neutral"
                variant="outline"
                to="/mecenas"
              />
              <UButton
                form="doacao-form"
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

      <MecenasEditPatronModal
        v-model:open="showEditModal"
        :patron="patronData"
        @saved="(updated) => Object.assign(patronData, updated)"
      />

      <DonationsIBANModal v-model:open="showIBANModal" />

      <DonationsMBReferenceModal
        v-model:open="showMBModal"
        :amount="state.valor_transacao ?? 0"
      />
    </template>
  </UDashboardPanel>
</template>
