<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

interface Patron {
  resource: { nif_nipc: string }
  entity: { nif_nipc: string, nome_entidade: string, email_login: string, iban: string }
  locations: Array<{ rua: string, n_porta: string, codigo_postal: string, concelho: string, distrito: string, freguesia: string, pais: string }>
  contacts: Array<{ contacto: string, nome_contacto: string, descricao: string }>
}

type PaymentMethod = 'Numerário' | 'Transferência Bancária' | 'Referência Multibanco' | 'Cheque'
type EstadoDonativo = 'PENDENTE' | 'ACEITE' | 'REJEITADO'

const toast = useToast()
const router = useRouter()
const { isPatron } = useAuth()

if (isPatron.value) {
  await navigateTo('/mecenas/doacao')
}

const { data: patronsData, status: patronsStatus, refresh: refreshPatrons } = await useFetch<{ data: Patron[] }>('/api/patrons', {
  lazy: true,
  server: false
})

const patrons = computed(() => patronsData.value?.data ?? [])
const patronOptions = computed(() =>
  patrons.value.map(p => ({
    label: `${p.entity.nome_entidade} — ${p.resource.nif_nipc}`,
    value: p.resource.nif_nipc
  }))
)

const selectedNif = ref<string | undefined>(undefined)
const selectedPatron = computed(() => patrons.value.find(p => p.resource.nif_nipc === selectedNif.value) ?? null)

const showPatronModal = ref(false)
const showMBModal = ref(false)
const isSubmitting = ref(false)

const docNumber = useState('docNumber.manual', () => {
  const year = new Date().getFullYear()
  const rand = String(Math.floor(1000 + Math.random() * 9000))
  return `DOA-${year}-${rand}`
})

const paymentMethods: PaymentMethod[] = ['Numerário', 'Transferência Bancária', 'Referência Multibanco', 'Cheque']
const estadoOptions = [
  { label: 'Pendente', value: 'PENDENTE' },
  { label: 'Aceite', value: 'ACEITE' },
  { label: 'Rejeitado', value: 'REJEITADO' }
]

const schema = z.object({
  data: z.string().min(1, 'Data obrigatória'),
  valor_transacao: z.number({ message: 'Valor obrigatório' }).positive('O valor deve ser positivo'),
  metodo_pagamento: z.string().min(1, 'Método obrigatório'),
  estado: z.enum(['PENDENTE', 'ACEITE', 'REJEITADO']),
  anonimo: z.boolean()
})

type Schema = z.output<typeof schema>

const today = new Date().toISOString().split('T')[0]!

const state = reactive<Partial<Schema>>({
  data: today,
  valor_transacao: undefined,
  metodo_pagamento: 'Numerário',
  estado: 'PENDENTE',
  anonimo: false
})

watch(() => state.metodo_pagamento, (method) => {
  if (method === 'Referência Multibanco' && (state.valor_transacao ?? 0) > 0) {
    showMBModal.value = true
  }
})

function openMBModal() {
  if ((state.valor_transacao ?? 0) <= 0) {
    toast.add({ title: 'Valor em falta', description: 'Introduza um valor antes de gerar a referência.', color: 'warning' })
    return
  }
  showMBModal.value = true
}

const estadoBadgeColor = computed(() => {
  const map: Record<EstadoDonativo, 'warning' | 'success' | 'error'> = { PENDENTE: 'warning', ACEITE: 'success', REJEITADO: 'error' }
  return map[state.estado as EstadoDonativo] ?? 'warning'
})

const formattedTotal = computed(() =>
  state.valor_transacao
    ? new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(state.valor_transacao)
    : '—'
)

async function onSubmit(event: FormSubmitEvent<Schema>) {
  if (!selectedNif.value) {
    toast.add({ title: 'Mecenas em falta', description: 'Selecione um mecenas antes de continuar.', icon: 'i-lucide-alert-circle', color: 'error' })
    return
  }

  isSubmitting.value = true
  try {
    await $fetch(`/api/patrons/${selectedNif.value}/donations`, {
      method: 'POST',
      body: {
        data: event.data.data,
        valor_transacao: event.data.valor_transacao,
        tipo_donativo: 'NUMERARIO',
        anonimo: event.data.anonimo,
        url_comprovativo: '',
        estado: event.data.estado
      }
    })

    toast.add({ title: 'Doação registada', description: 'A doação foi registada com sucesso.', icon: 'i-lucide-check', color: 'success' })
    router.push('/mecenas')
  } catch {
    toast.add({ title: 'Erro ao registar', description: 'Não foi possível registar a doação.', icon: 'i-lucide-x', color: 'error' })
  } finally {
    isSubmitting.value = false
  }
}

async function onPatronSaved(nif: string) {
  await refreshPatrons()
  selectedNif.value = nif
}
</script>

<template>
  <UDashboardPanel id="doacao-manual">
    <template #header>
      <UDashboardNavbar title="Doação Manual">
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
            :color="estadoBadgeColor"
            variant="subtle"
            size="lg"
            class="hidden sm:flex"
          >
            {{ state.estado }}
          </UBadge>
          <UButton
            label="Cancelar"
            color="neutral"
            variant="ghost"
            to="/mecenas"
          />
          <UButton
            form="manual-form"
            label="Registar Doação"
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
        id="manual-form"
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
            <USeparator orientation="vertical" class="h-10 hidden sm:block" />
            <UFormField name="estado" label="Estado">
              <USelect
                v-model="state.estado"
                :items="estadoOptions"
                value-key="value"
                label-key="label"
                class="w-36"
              />
            </UFormField>
          </div>
        </UPageCard>

        <!-- Patron selector + Beneficiary -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2">
            <UPageCard variant="subtle" class="h-full">
              <template #header>
                <div class="flex items-center justify-between gap-2">
                  <div class="flex items-center gap-2">
                    <UIcon name="i-lucide-building-2" class="size-4 text-muted" />
                    <h3 class="font-semibold text-highlighted">
                      Mecenas
                    </h3>
                  </div>
                  <UButton
                    :label="selectedPatron ? 'Editar Mecenas' : 'Novo Mecenas'"
                    :icon="selectedPatron ? 'i-lucide-pencil' : 'i-lucide-plus'"
                    color="neutral"
                    variant="outline"
                    size="sm"
                    @click="showPatronModal = true"
                  />
                </div>
              </template>

              <div class="space-y-4">
                <USelect
                  v-model="selectedNif"
                  :items="patronOptions"
                  value-key="value"
                  label-key="label"
                  placeholder="Pesquisar mecenas por nome ou NIF..."
                  :loading="patronsStatus === 'pending'"
                  searchable
                  search-placeholder="Pesquisar..."
                  class="w-full"
                />

                <template v-if="selectedPatron">
                  <USeparator />
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                    <div>
                      <p class="text-xs text-muted uppercase tracking-wide font-medium mb-0.5">
                        Nome / Razão Social
                      </p>
                      <p class="font-semibold text-highlighted">
                        {{ selectedPatron.entity.nome_entidade }}
                      </p>
                    </div>
                    <div>
                      <p class="text-xs text-muted uppercase tracking-wide font-medium mb-0.5">
                        NIF / NIPC
                      </p>
                      <p class="font-mono">
                        {{ selectedPatron.entity.nif_nipc }}
                      </p>
                    </div>
                    <div>
                      <p class="text-xs text-muted uppercase tracking-wide font-medium mb-0.5">
                        Email
                      </p>
                      <p>{{ selectedPatron.entity.email_login }}</p>
                    </div>
                    <div>
                      <p class="text-xs text-muted uppercase tracking-wide font-medium mb-0.5">
                        IBAN
                      </p>
                      <p class="font-mono text-xs">
                        {{ selectedPatron.entity.iban }}
                      </p>
                    </div>
                    <div v-if="selectedPatron.locations[0]" class="sm:col-span-2">
                      <p class="text-xs text-muted uppercase tracking-wide font-medium mb-0.5">
                        Morada
                      </p>
                      <p>
                        {{ selectedPatron.locations[0].rua }}, {{ selectedPatron.locations[0].n_porta }}
                        · {{ selectedPatron.locations[0].codigo_postal }} {{ selectedPatron.locations[0].concelho }}
                      </p>
                    </div>
                  </div>
                </template>

                <template v-else>
                  <div class="flex flex-col items-center justify-center py-10 text-center">
                    <UIcon name="i-lucide-user-search" class="size-10 text-muted mb-3" />
                    <p class="text-sm text-muted">
                      Selecione um mecenas ou crie um novo.
                    </p>
                  </div>
                </template>
              </div>
            </UPageCard>
          </div>

          <!-- Emitente -->
          <div>
            <UPageCard variant="subtle" class="h-full">
              <template #header>
                <div class="flex items-center gap-2">
                  <UIcon name="i-lucide-landmark" class="size-4 text-muted" />
                  <h3 class="font-semibold text-highlighted">
                    Emitente
                  </h3>
                </div>
              </template>
              <div class="space-y-3 text-sm">
                <div>
                  <p class="text-xs text-muted uppercase tracking-wide font-medium mb-0.5">
                    Organização
                  </p>
                  <p class="font-semibold text-highlighted">
                    SAM
                  </p>
                  <p class="text-muted">
                    Sistema de Apoio Municipal
                  </p>
                </div>
                <USeparator />
                <div>
                  <p class="text-xs text-muted uppercase tracking-wide font-medium mb-0.5">
                    Morada
                  </p>
                  <p>Rua Central, 1</p>
                  <p>4490-000 Porto, Portugal</p>
                </div>
                <USeparator />
                <div>
                  <p class="text-xs text-muted uppercase tracking-wide font-medium mb-1">
                    Tipo de Documento
                  </p>
                  <UBadge color="primary" variant="subtle">
                    Registo de Doação
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
                <USelect v-model="state.metodo_pagamento" :items="paymentMethods" class="w-full" />
              </UFormField>
            </div>

            <div v-if="state.metodo_pagamento === 'Referência Multibanco'" class="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
              <UIcon name="i-lucide-info" class="size-4 text-primary shrink-0" />
              <p class="text-sm flex-1">
                Gere a referência Multibanco para o mecenas efetuar o pagamento.
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
              <div class="flex items-center gap-3 h-[34px]">
                <USwitch v-model="state.anonimo" />
                <span class="text-sm text-muted">{{ state.anonimo ? 'O nome do mecenas não será divulgado' : 'Doação pública' }}</span>
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
                form="manual-form"
                label="Registar Doação"
                icon="i-lucide-save"
                color="primary"
                type="submit"
                :loading="isSubmitting"
              />
            </div>
          </div>
        </UPageCard>
      </UForm>

      <MecenasPatronFormModal
        v-model:open="showPatronModal"
        :patron="selectedPatron"
        @saved="onPatronSaved"
      />

      <DonationsMBReferenceModal
        v-model:open="showMBModal"
        :amount="state.valor_transacao ?? 0"
      />
    </template>
  </UDashboardPanel>
</template>
