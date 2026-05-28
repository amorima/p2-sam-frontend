<script setup lang="ts">
import { useNeeds } from '~/composables/useNeeds'
import type { TipoBem } from '~/utils/domain'

interface ItemEntry {
  tipo_bem_servico: string
  tipo_bem: TipoBem
}

const toast = useToast()
const router = useRouter()
const { isAdmin, institutionNif } = useAuth()
const { institutions, goodsServices, createNeed } = useNeeds()

if (isAdmin.value) {
  await navigateTo('/instituicoes/pedido_manual')
}

const currentInstitution = computed(() => {
  if (institutionNif.value) {
    return institutions.value.find(i => i.resource.nif_nipc === institutionNif.value) ?? institutions.value[0]
  }
  return institutions.value[0]
})

const isSubmitting = ref(false)

const docNumber = useState('docNumber.pedido', () => {
  const year = new Date().getFullYear()
  const rand = String(Math.floor(1000 + Math.random() * 9000))
  return `PED-${year}-${rand}`
})

const today = new Date().toISOString().split('T')[0]!

const dataPedido = ref(today)
const urgente = ref(false)
const items = ref<ItemEntry[]>([])

const summary = computed(() => ({
  total: items.value.length,
  bens: items.value.filter(i => i.tipo_bem === 'BEM').length,
  servicos: items.value.filter(i => i.tipo_bem === 'SERVICO').length
}))

async function onSubmit() {
  if (items.value.length === 0) {
    toast.add({ title: 'Sem itens', description: 'Adicione pelo menos um bem ou serviço ao pedido.', icon: 'i-lucide-alert-circle', color: 'warning' })
    return
  }
  if (!currentInstitution.value) {
    toast.add({ title: 'Instituição não encontrada', description: 'Não foi possível identificar a sua instituição.', icon: 'i-lucide-x', color: 'error' })
    return
  }
  isSubmitting.value = true
  try {
    await createNeed({
      nif_nipc: currentInstitution.value.resource.nif_nipc,
      nome_entidade: currentInstitution.value.entity.nome_entidade,
      data: new Date(dataPedido.value).toISOString(),
      estado: 'PENDENTE',
      urgente: urgente.value,
      items: items.value
    })
    toast.add({
      title: 'Pedido submetido',
      description: urgente.value
        ? 'Pedido urgente enviado. Aguarda aprovação para emissão imediata de voucher.'
        : 'O seu pedido foi submetido e aguarda aprovação do SAM.',
      icon: 'i-lucide-check',
      color: 'success'
    })
    router.push('/instituicoes')
  } catch {
    toast.add({ title: 'Erro ao submeter', description: 'Não foi possível registar o pedido.', icon: 'i-lucide-x', color: 'error' })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <UDashboardPanel id="instituicoes-pedido">
    <template #header>
      <UDashboardNavbar title="Novo Pedido">
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
            to="/instituicoes"
          />
          <UButton
            label="Submeter Pedido"
            icon="i-lucide-send"
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
          </div>
        </UPageCard>

        <!-- Institution + Recipient -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2">
            <UPageCard variant="subtle" class="h-full">
              <template #header>
                <div class="flex items-center gap-2">
                  <UIcon name="i-lucide-building-2" class="size-4 text-muted" />
                  <h3 class="font-semibold text-highlighted">
                    A Sua Instituição
                  </h3>
                </div>
              </template>

              <div v-if="currentInstitution" class="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                <div>
                  <p class="text-xs text-muted uppercase tracking-wide font-medium mb-0.5">
                    Nome
                  </p>
                  <p class="font-semibold text-highlighted">
                    {{ currentInstitution.entity.nome_entidade }}
                  </p>
                </div>
                <div>
                  <p class="text-xs text-muted uppercase tracking-wide font-medium mb-0.5">
                    NIF / NIPC
                  </p>
                  <p class="font-mono">
                    {{ currentInstitution.entity.nif_nipc }}
                  </p>
                </div>
                <div>
                  <p class="text-xs text-muted uppercase tracking-wide font-medium mb-0.5">
                    Email
                  </p>
                  <p>{{ currentInstitution.entity.email_login }}</p>
                </div>
                <div>
                  <p class="text-xs text-muted uppercase tracking-wide font-medium mb-0.5">
                    IBAN
                  </p>
                  <p class="font-mono text-xs">
                    {{ currentInstitution.entity.iban }}
                  </p>
                </div>
                <div v-if="currentInstitution.locations[0]" class="sm:col-span-2">
                  <p class="text-xs text-muted uppercase tracking-wide font-medium mb-0.5">
                    Morada
                  </p>
                  <p>
                    {{ currentInstitution.locations[0].rua }}, {{ currentInstitution.locations[0].n_porta }}
                    · {{ currentInstitution.locations[0].codigo_postal }} {{ currentInstitution.locations[0].concelho }}
                  </p>
                </div>
              </div>
            </UPageCard>
          </div>

          <div>
            <UPageCard variant="subtle" class="h-full">
              <template #header>
                <div class="flex items-center gap-2">
                  <UIcon name="i-lucide-landmark" class="size-4 text-muted" />
                  <h3 class="font-semibold text-highlighted">
                    Destinatário
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
                    Pedido de Apoio
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
              <span class="text-sm text-muted">{{ urgente ? 'Será emitido voucher imediatamente após aprovação para bens em falta.' : 'Pedido com prioridade normal.' }}</span>
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
                label="Submeter Pedido"
                icon="i-lucide-send"
                color="primary"
                :loading="isSubmitting"
                @click="onSubmit"
              />
            </div>
          </div>
        </UPageCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
