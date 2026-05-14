<script setup lang="ts">
import { printDonationReceipt, type ReceiptDonation } from '~/utils/donationPDF'
import { mockApprovedDonation } from '~/utils/mockData'

interface Donation {
  id_doacao: number
  mecena_nif_nipc: string
  nome_entidade?: string
  data: string
  valor_transacao: number
  tipo_donativo: 'NUMERARIO' | 'TRANSFERENCIA' | 'REFERENCIA' | 'CHEQUE'
  anonimo: boolean
  url_comprovativo: string
  estado: 'ACEITE' | 'REJEITADO' | 'PENDENTE'
}

const route = useRoute()
const { isAdmin } = useAuth()
const id = Number(route.params.id)

const statusModalOpen = ref(false)

const { data: rawData, status, refresh } = await useFetch<{ donations: Donation[] }>(
  '/api/donations',
  { lazy: true, server: false }
)

const donation = computed<Donation | null>(() => {
  const list = rawData.value?.donations ?? []
  const found = list.find(d => d.id_doacao === id)
  if (found) return found
  if (mockApprovedDonation.id_doacao === id) return mockApprovedDonation as Donation
  return null
})

const modoLabel: Record<string, string> = {
  NUMERARIO: 'Numerário',
  TRANSFERENCIA: 'Transferência Bancária',
  REFERENCIA: 'Referência Multibanco',
  CHEQUE: 'Cheque'
}

function badgeColor(estado: string): 'warning' | 'success' | 'error' {
  if (estado === 'ACEITE') return 'success'
  if (estado === 'REJEITADO') return 'error'
  return 'warning'
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('pt-PT', { year: 'numeric', month: 'long', day: 'numeric' })
}

function formatEUR(v: number) {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(v)
}

function downloadPDF() {
  if (!donation.value) return
  const receipt: ReceiptDonation = {
    id_doacao: donation.value.id_doacao,
    mecena_nif_nipc: donation.value.mecena_nif_nipc,
    nome_entidade: donation.value.nome_entidade,
    data: donation.value.data,
    valor_transacao: donation.value.valor_transacao,
    tipo_donativo: donation.value.tipo_donativo,
    estado: donation.value.estado
  }
  printDonationReceipt(receipt)
}

const docNumber = computed(() =>
  donation.value
    ? `DOA-${new Date(donation.value.data).getFullYear()}-${String(donation.value.id_doacao).padStart(4, '0')}`
    : ''
)
</script>

<template>
  <UDashboardPanel id="mecenas-detail">
    <template #header>
      <UDashboardNavbar :title="donation ? `Doação #${donation.id_doacao}` : 'Doação'">
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
            v-if="donation"
            :color="badgeColor(donation.estado)"
            variant="subtle"
            size="lg"
          >
            {{ donation.estado }}
          </UBadge>
          <UButton
            v-if="donation && donation.estado === 'ACEITE'"
            label="Descarregar Comprovativo"
            icon="i-lucide-download"
            color="primary"
            @click="downloadPDF"
          />
          <UButton
            v-if="isAdmin && donation"
            label="Mudar Estado"
            icon="i-lucide-refresh-cw"
            color="neutral"
            variant="outline"
            @click="statusModalOpen = true"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div v-if="status === 'pending'" class="flex justify-center py-24">
        <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin text-muted" />
      </div>

      <div v-else-if="!donation" class="flex flex-col items-center justify-center py-24 text-center">
        <UIcon name="i-lucide-file-x" class="size-12 text-muted mb-3" />
        <p class="font-medium text-highlighted">
          Doação não encontrada
        </p>
        <UButton
          label="Voltar à lista"
          icon="i-lucide-arrow-left"
          color="primary"
          variant="subtle"
          class="mt-4"
          to="/mecenas"
        />
      </div>

      <div v-else class="space-y-6">
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
            <div>
              <p class="text-xs text-muted uppercase tracking-wide font-medium">
                Data
              </p>
              <p class="font-semibold">
                {{ formatDate(donation.data) }}
              </p>
            </div>
            <USeparator orientation="vertical" class="h-10 hidden sm:block" />
            <div>
              <p class="text-xs text-muted uppercase tracking-wide font-medium">
                Estado
              </p>
              <UBadge :color="badgeColor(donation.estado)" variant="subtle">
                {{ donation.estado }}
              </UBadge>
            </div>
          </div>
        </UPageCard>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <UPageCard variant="subtle">
            <template #header>
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-user-circle" class="size-4 text-muted" />
                <h3 class="font-semibold text-highlighted">
                  Mecenas
                </h3>
              </div>
            </template>
            <div class="space-y-3 text-sm">
              <div>
                <p class="text-xs text-muted uppercase tracking-wide font-medium mb-0.5">
                  Nome / Razão Social
                </p>
                <p class="font-semibold text-highlighted">
                  {{ donation.anonimo ? 'Anónimo' : (donation.nome_entidade ?? donation.mecena_nif_nipc) }}
                </p>
              </div>
              <div v-if="!donation.anonimo">
                <p class="text-xs text-muted uppercase tracking-wide font-medium mb-0.5">
                  NIF / NIPC
                </p>
                <p class="font-mono">
                  {{ donation.mecena_nif_nipc }}
                </p>
              </div>
            </div>
          </UPageCard>

          <UPageCard variant="subtle">
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
              <div>
                <p class="text-xs text-muted uppercase tracking-wide font-medium mb-0.5">
                  Morada
                </p>
                <p>Praça Vasco da Gama · 4480-454 Vila do Conde</p>
              </div>
            </div>
          </UPageCard>
        </div>

        <UPageCard variant="subtle">
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-hand-coins" class="size-4 text-muted" />
              <h3 class="font-semibold text-highlighted">
                Detalhes da Doação
              </h3>
            </div>
          </template>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <p class="text-xs text-muted uppercase tracking-wide font-medium mb-0.5">
                Valor
              </p>
              <p class="text-2xl font-bold text-highlighted">
                {{ formatEUR(donation.valor_transacao) }}
              </p>
            </div>
            <div>
              <p class="text-xs text-muted uppercase tracking-wide font-medium mb-0.5">
                Método
              </p>
              <UBadge variant="subtle" color="neutral">
                {{ modoLabel[donation.tipo_donativo] ?? donation.tipo_donativo }}
              </UBadge>
            </div>
            <div>
              <p class="text-xs text-muted uppercase tracking-wide font-medium mb-0.5">
                Visibilidade
              </p>
              <UBadge variant="subtle" :color="donation.anonimo ? 'warning' : 'success'">
                {{ donation.anonimo ? 'Anónima' : 'Pública' }}
              </UBadge>
            </div>
          </div>

          <UAlert
            v-if="donation.estado === 'REJEITADO' && donation.url_comprovativo"
            icon="i-lucide-x-circle"
            color="error"
            variant="subtle"
            title="Motivo da recusa"
            :description="donation.url_comprovativo"
            class="mt-4"
          />
        </UPageCard>
      </div>

      <MecenasDonationStatusModal
        v-model:open="statusModalOpen"
        :donation="donation"
        @updated="refresh()"
      />
    </template>
  </UDashboardPanel>
</template>
