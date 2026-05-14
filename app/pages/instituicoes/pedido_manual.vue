<script setup lang="ts">
import { useNeeds } from '~/composables/useNeeds'
import type { TipoBem, EstadoPedido } from '~/utils/mockData'

interface ItemEntry {
  tipo_bem_servico: string
  tipo_bem: TipoBem
}

const toast = useToast()
const router = useRouter()
const { isInstitution } = useAuth()
const { institutions, goodsServices, createNeed } = useNeeds()

if (isInstitution.value) {
  await navigateTo('/instituicoes/pedido')
}

const institutionOptions = computed(() =>
  institutions.value.map(i => ({
    label: `${i.entity.nome_entidade} — ${i.resource.nif_nipc}`,
    value: i.resource.nif_nipc
  }))
)

const selectedNif = ref<string | undefined>(undefined)
const selectedInstitution = computed(
  () => institutions.value.find(i => i.resource.nif_nipc === selectedNif.value) ?? null
)

const showInstitutionModal = ref(false)
const isSubmitting = ref(false)

const docNumber = useState('docNumber.pedido_manual', () => {
  const year = new Date().getFullYear()
  const rand = String(Math.floor(1000 + Math.random() * 9000))
  return `PED-${year}-${rand}`
})

const today = new Date().toISOString().split('T')[0]!

const estadoOptions = [
  { label: 'Pendente', value: 'PENDENTE' },
  { label: 'Aceite', value: 'ACEITE' },
  { label: 'Rejeitado', value: 'REJEITADO' }
]

const dataPedido = ref(today)
const urgente = ref(false)
const estado = ref<EstadoPedido>('PENDENTE')
const items = ref<ItemEntry[]>([])

const estadoBadgeColor = computed(() => {
  const map: Record<EstadoPedido, 'warning' | 'success' | 'error'> = {
    PENDENTE: 'warning', ACEITE: 'success', REJEITADO: 'error'
  }
  return map[estado.value]
})

const summary = computed(() => ({
  total: items.value.length,
  bens: items.value.filter(i => i.tipo_bem === 'BEM').length,
  servicos: items.value.filter(i => i.tipo_bem === 'SERVICO').length
}))

async function onSubmit() {
  if (!selectedInstitution.value) {
    toast.add({ title: 'Instituição em falta', description: 'Selecione uma instituição antes de continuar.', icon: 'i-lucide-alert-circle', color: 'error' })
    return
  }
  if (items.value.length === 0) {
    toast.add({ title: 'Sem itens', description: 'Adicione pelo menos um bem ou serviço ao pedido.', icon: 'i-lucide-alert-circle', color: 'warning' })
    return
  }
  isSubmitting.value = true
  try {
    createNeed({
      nif_nipc: selectedInstitution.value.resource.nif_nipc,
      nome_entidade: selectedInstitution.value.entity.nome_entidade,
      data: new Date(dataPedido.value).toISOString(),
      estado: estado.value,
      urgente: urgente.value,
      items: items.value
    })
    toast.add({ title: 'Pedido registado', description: 'O pedido foi registado com sucesso.', icon: 'i-lucide-check', color: 'success' })
    router.push('/instituicoes')
  } catch {
    toast.add({ title: 'Erro ao registar', description: 'Não foi possível registar o pedido.', icon: 'i-lucide-x', color: 'error' })
  } finally {
    isSubmitting.value = false
  }
}

function onInstitutionSaved(nif: string) {
  selectedNif.value = nif
}
</script>

<template>
  <UDashboardPanel id="pedido-manual">
    <template #header>
      <UDashboardNavbar title="Pedido Manual">
        <template #leading>
          <UDashboardSidebarCollapse />
          <UButton
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="ghost"
            to="/instituicoes"
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
            {{ estado }}
          </UBadge>
          <UButton
            label="Cancelar"
            color="neutral"
            variant="ghost"
            to="/instituicoes"
          />
          <UButton
            label="Registar Pedido"
            icon="i-lucide-save"
            color="primary"
            :loading="isSubmitting"
            @click="onSubmit"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-6">
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
            <UFormField label="Data do Pedido">
              <UInput v-model="dataPedido" type="date" class="w-44" />
            </UFormField>
            <USeparator orientation="vertical" class="h-10 hidden sm:block" />
            <UFormField label="Estado">
              <USelect
                v-model="estado"
                :items="estadoOptions"
                value-key="value"
                label-key="label"
                class="w-36"
              />
            </UFormField>
          </div>
        </UPageCard>

        <!-- Institution selector + Emitente -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2">
            <UPageCard variant="subtle" class="h-full">
              <template #header>
                <div class="flex items-center gap-2">
                  <UIcon name="i-lucide-building-2" class="size-4 text-muted" />
                  <h3 class="font-semibold text-highlighted">
                    Instituição
                  </h3>
                </div>
              </template>

              <div class="space-y-4">
                <div class="flex gap-2">
                  <USelectMenu
                    v-model="selectedNif"
                    :items="institutionOptions"
                    value-key="value"
                    label-key="label"
                    placeholder="Pesquisar instituição por nome ou NIF..."
                    search-placeholder="Pesquisar..."
                    class="flex-1"
                  />
                  <UButton
                    :label="selectedInstitution ? 'Editar' : 'Nova Instituição'"
                    :icon="selectedInstitution ? 'i-lucide-pencil' : 'i-lucide-plus'"
                    color="neutral"
                    variant="outline"
                    size="sm"
                    @click="showInstitutionModal = true"
                  />
                </div>

                <template v-if="selectedInstitution">
                  <USeparator />
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                    <div>
                      <p class="text-xs text-muted uppercase tracking-wide font-medium mb-0.5">
                        Nome
                      </p>
                      <p class="font-semibold text-highlighted">
                        {{ selectedInstitution.entity.nome_entidade }}
                      </p>
                    </div>
                    <div>
                      <p class="text-xs text-muted uppercase tracking-wide font-medium mb-0.5">
                        NIF / NIPC
                      </p>
                      <p class="font-mono">
                        {{ selectedInstitution.entity.nif_nipc }}
                      </p>
                    </div>
                    <div>
                      <p class="text-xs text-muted uppercase tracking-wide font-medium mb-0.5">
                        Email
                      </p>
                      <p>{{ selectedInstitution.entity.email_login }}</p>
                    </div>
                    <div>
                      <p class="text-xs text-muted uppercase tracking-wide font-medium mb-0.5">
                        IBAN
                      </p>
                      <p class="font-mono text-xs">
                        {{ selectedInstitution.entity.iban }}
                      </p>
                    </div>
                    <div v-if="selectedInstitution.locations[0]" class="sm:col-span-2">
                      <p class="text-xs text-muted uppercase tracking-wide font-medium mb-0.5">
                        Morada
                      </p>
                      <p>
                        {{ selectedInstitution.locations[0].rua }}, {{ selectedInstitution.locations[0].n_porta }}
                        · {{ selectedInstitution.locations[0].codigo_postal }} {{ selectedInstitution.locations[0].concelho }}
                      </p>
                    </div>
                  </div>
                </template>

                <template v-else>
                  <div class="flex flex-col items-center justify-center py-10 text-center">
                    <UIcon name="i-lucide-search" class="size-10 text-muted mb-3" />
                    <p class="text-sm text-muted">
                      Selecione uma instituição ou crie uma nova.
                    </p>
                  </div>
                </template>
              </div>
            </UPageCard>
          </div>

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
                    Tipo de Documento
                  </p>
                  <UBadge color="primary" variant="subtle">
                    Registo de Pedido
                  </UBadge>
                </div>
              </div>
            </UPageCard>
          </div>
        </div>

        <!-- Items -->
        <UPageCard variant="subtle">
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-package" class="size-4 text-muted" />
              <h3 class="font-semibold text-highlighted">
                Bens e Serviços Pedidos
              </h3>
            </div>
          </template>

          <InstituicoesItemsEditor
            v-model="items"
            :goods-services="goodsServices"
          />
        </UPageCard>

        <!-- Urgency -->
        <UPageCard variant="subtle">
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-zap" class="size-4 text-muted" />
              <h3 class="font-semibold text-highlighted">
                Urgência
              </h3>
            </div>
          </template>

          <UFormField label="Pedido Urgente">
            <div class="flex items-center gap-3 h-8.5">
              <USwitch v-model="urgente" />
              <span class="text-sm text-muted">{{ urgente ? 'Se aprovado, será emitido voucher imediatamente para os bens.' : 'Prioridade normal.' }}</span>
            </div>
          </UFormField>
        </UPageCard>

        <!-- Summary -->
        <UPageCard variant="subtle">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p class="text-xs text-muted uppercase tracking-wide font-medium">
                Resumo do Pedido
              </p>
              <p class="text-3xl font-bold text-highlighted mt-1">
                {{ summary.total }} {{ summary.total === 1 ? 'item' : 'itens' }}
              </p>
              <p class="text-sm text-muted mt-0.5">
                {{ summary.bens }} {{ summary.bens === 1 ? 'bem' : 'bens' }} · {{ summary.servicos }} {{ summary.servicos === 1 ? 'serviço' : 'serviços' }}
                <span v-if="urgente">· <strong class="text-error">URGENTE</strong></span>
              </p>
            </div>
            <div class="flex gap-2">
              <UButton
                label="Cancelar"
                color="neutral"
                variant="outline"
                to="/instituicoes"
              />
              <UButton
                label="Registar Pedido"
                icon="i-lucide-save"
                color="primary"
                :loading="isSubmitting"
                @click="onSubmit"
              />
            </div>
          </div>
        </UPageCard>
      </div>

      <InstituicoesInstitutionFormModal
        v-model:open="showInstitutionModal"
        :institution="selectedInstitution"
        @saved="onInstitutionSaved"
      />
    </template>
  </UDashboardPanel>
</template>
