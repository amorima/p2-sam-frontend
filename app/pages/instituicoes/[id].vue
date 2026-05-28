<script setup lang="ts">
import { useNeeds } from '~/composables/useNeeds'
import type { MatchTipo, NeedItem } from '~/utils/domain'
import { printVoucher } from '~/utils/voucherPDF'

const route = useRoute()
const { isAdmin, isInstitution, institutionNif } = useAuth()
const { needs, institutions, businesses, panels, setItemMatch, setBusinessMatch } = useNeeds()

const id = Number(route.params.id)

const need = computed(() => needs.value.find(n => n.id_pedido === id) ?? null)

const canView = computed(() => {
  if (!need.value) return false
  if (isAdmin.value) return true
  if (isInstitution.value) return need.value.nif_nipc === institutionNif.value
  return false
})

const institution = computed(() =>
  need.value
    ? institutions.value.find(i => i.resource.nif_nipc === need.value!.nif_nipc) ?? null
    : null
)

const statusModalOpen = ref(false)

const matchTipoLabel: Record<MatchTipo, string> = {
  VOUCHER: 'Voucher',
  NEGOCIO: 'Negócio Parceiro',
  PAINEL: 'Painel de Cidadãos'
}

const matchTipoIcon: Record<MatchTipo, string> = {
  VOUCHER: 'i-lucide-ticket',
  NEGOCIO: 'i-lucide-store',
  PAINEL: 'i-lucide-map-pin'
}

const matchTipoColor: Record<MatchTipo, 'primary' | 'info' | 'success'> = {
  VOUCHER: 'primary',
  NEGOCIO: 'info',
  PAINEL: 'success'
}

const matchOptions = (tipo_bem: 'BEM' | 'SERVICO') => {
  const opts = [
    { label: 'Emitir Voucher (PDF)', value: 'VOUCHER' as MatchTipo },
    { label: 'Negócio Parceiro', value: 'NEGOCIO' as MatchTipo }
  ]
  if (tipo_bem === 'BEM') {
    opts.push({ label: 'Alocar a Painel (cidadãos)', value: 'PAINEL' as MatchTipo })
  }
  return opts
}

function badgeColor(estado: string): 'warning' | 'success' | 'error' {
  if (estado === 'ACEITE') return 'success'
  if (estado === 'REJEITADO') return 'error'
  return 'warning'
}

function statusBadgeColor(status: string): 'neutral' | 'warning' | 'success' {
  if (status === 'completed') return 'success'
  if (status === 'pending') return 'warning'
  return 'neutral'
}

function statusLabel(status: string): string {
  if (status === 'completed') return 'Concluído'
  if (status === 'pending') return 'Em alocação'
  return 'Disponível'
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('pt-PT', { year: 'numeric', month: 'long', day: 'numeric' })
}

function downloadVoucher(item: NeedItem) {
  if (!need.value || !item.match_ref) return
  printVoucher({
    voucher_ref: item.match_ref,
    id_pedido: need.value.id_pedido,
    nif_nipc: need.value.nif_nipc,
    nome_entidade: need.value.nome_entidade ?? need.value.nif_nipc,
    tipo_bem_servico: item.tipo_bem_servico
  })
}

function updateMatch(id_item: number, tipo: MatchTipo) {
  if (!need.value) return
  let reference: string | null
  if (tipo === 'VOUCHER') {
    reference = `VCH-${new Date().getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}`
  } else if (tipo === 'PAINEL') {
    reference = 'A alocar a painel'
  } else if (tipo === 'NEGOCIO') {
    reference = null
  } else {
    reference = null
  }
  setItemMatch(need.value.id_pedido, id_item, tipo, reference)
}

function setBusinessRef(id_item: number, nif: string, label: string) {
  if (!need.value) return
  setBusinessMatch(need.value.id_pedido, id_item, nif, label)
}

function setPanelRef(id_item: number, label: string | null) {
  if (!need.value) return
  setItemMatch(need.value.id_pedido, id_item, 'PAINEL', label)
}

const institutionCoords = computed(() => ({
  lat: institution.value?.resource.geo_latitude ?? 41.3526,
  lng: institution.value?.resource.geo_longitude ?? -8.7396
}))

const docNumber = computed(() =>
  need.value
    ? `PED-${new Date(need.value.data).getFullYear()}-${String(need.value.id_pedido).padStart(4, '0')}`
    : ''
)

const summary = computed(() => {
  if (!need.value) return { total: 0, bens: 0, servicos: 0, comMatch: 0 }
  return {
    total: need.value.items.length,
    bens: need.value.items.filter(i => i.tipo_bem === 'BEM').length,
    servicos: need.value.items.filter(i => i.tipo_bem === 'SERVICO').length,
    comMatch: need.value.items.filter(i => i.match_tipo).length
  }
})
</script>

<template>
  <UDashboardPanel id="instituicoes-detail">
    <template #header>
      <UDashboardNavbar :title="need ? `Pedido #${need.id_pedido}` : 'Pedido'">
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
            v-if="need?.urgente"
            color="error"
            variant="solid"
            icon="i-lucide-zap"
            size="lg"
          >
            URGENTE
          </UBadge>
          <UBadge
            v-if="need"
            :color="badgeColor(need.estado)"
            variant="subtle"
            size="lg"
          >
            {{ need.estado }}
          </UBadge>
          <UButton
            v-if="isAdmin && need"
            label="Mudar Estado"
            icon="i-lucide-refresh-cw"
            color="neutral"
            variant="outline"
            @click="statusModalOpen = true"
          />
          <UButton
            v-if="isAdmin && need?.estado === 'PENDENTE'"
            label="Aprovar"
            icon="i-lucide-check-circle"
            color="primary"
            to="/instituicoes/aprovacao"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div v-if="!need || !canView" class="flex flex-col items-center justify-center py-24 text-center">
        <UIcon name="i-lucide-file-x" class="size-12 text-muted mb-3" />
        <p class="font-medium text-highlighted">
          {{ !need ? 'Pedido não encontrado' : 'Sem permissão para ver este pedido' }}
        </p>
        <UButton
          label="Voltar à lista"
          icon="i-lucide-arrow-left"
          color="primary"
          variant="subtle"
          class="mt-4"
          to="/instituicoes"
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
                {{ formatDate(need.data) }}
              </p>
            </div>
            <USeparator orientation="vertical" class="h-10 hidden sm:block" />
            <div>
              <p class="text-xs text-muted uppercase tracking-wide font-medium">
                Estado
              </p>
              <UBadge :color="badgeColor(need.estado)" variant="subtle">
                {{ need.estado }}
              </UBadge>
            </div>
            <USeparator orientation="vertical" class="h-10 hidden sm:block" />
            <div>
              <p class="text-xs text-muted uppercase tracking-wide font-medium">
                Urgência
              </p>
              <UBadge :color="need.urgente ? 'error' : 'neutral'" variant="subtle">
                {{ need.urgente ? 'Urgente' : 'Normal' }}
              </UBadge>
            </div>
          </div>
        </UPageCard>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <UPageCard variant="subtle">
            <template #header>
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-building-2" class="size-4 text-muted" />
                <h3 class="font-semibold text-highlighted">
                  Instituição Requerente
                </h3>
              </div>
            </template>
            <div class="space-y-3 text-sm">
              <div>
                <p class="text-xs text-muted uppercase tracking-wide font-medium mb-0.5">
                  Nome
                </p>
                <p class="font-semibold text-highlighted">
                  {{ need.nome_entidade ?? institution?.entity.nome_entidade ?? need.nif_nipc }}
                </p>
              </div>
              <div>
                <p class="text-xs text-muted uppercase tracking-wide font-medium mb-0.5">
                  NIF / NIPC
                </p>
                <p class="font-mono">
                  {{ need.nif_nipc }}
                </p>
              </div>
              <div v-if="institution">
                <p class="text-xs text-muted uppercase tracking-wide font-medium mb-0.5">
                  Email
                </p>
                <p>{{ institution.entity.email_login }}</p>
              </div>
              <div v-if="institution?.locations[0]">
                <p class="text-xs text-muted uppercase tracking-wide font-medium mb-0.5">
                  Morada
                </p>
                <p>
                  {{ institution.locations[0].rua }}, {{ institution.locations[0].n_porta }}
                  · {{ institution.locations[0].codigo_postal }} {{ institution.locations[0].concelho }}
                </p>
              </div>
            </div>
          </UPageCard>

          <UPageCard variant="subtle">
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
              <div>
                <p class="text-xs text-muted uppercase tracking-wide font-medium mb-0.5">
                  Resumo
                </p>
                <p>
                  {{ summary.total }} {{ summary.total === 1 ? 'item' : 'itens' }}
                  ({{ summary.bens }} bens, {{ summary.servicos }} serviços)
                </p>
                <p class="text-xs text-muted mt-1">
                  {{ summary.comMatch }} de {{ summary.total }} com destino definido
                </p>
              </div>
            </div>
          </UPageCard>
        </div>

        <UAlert
          v-if="need.estado === 'REJEITADO' && need.motivo_recusa"
          icon="i-lucide-x-circle"
          color="error"
          variant="subtle"
          title="Motivo da recusa"
          :description="need.motivo_recusa"
        />

        <UPageCard variant="subtle">
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-package" class="size-4 text-muted" />
              <h3 class="font-semibold text-highlighted">
                Bens e Serviços
              </h3>
            </div>
          </template>

          <div class="space-y-2">
            <div
              v-for="item in need.items"
              :key="item.id_item"
              class="rounded-lg border border-default bg-elevated/30 px-4 py-3 space-y-3"
            >
              <div class="grid grid-cols-1 md:grid-cols-[1fr_auto_auto_auto] gap-3 items-center">
                <div class="flex items-center gap-3 min-w-0">
                  <UIcon
                    :name="item.tipo_bem === 'BEM' ? 'i-lucide-package' : 'i-lucide-handshake'"
                    :class="['size-5 shrink-0', item.tipo_bem === 'BEM' ? 'text-primary' : 'text-info']"
                  />
                  <div class="min-w-0">
                    <p class="font-medium truncate">
                      {{ item.tipo_bem_servico }}
                    </p>
                    <p class="text-xs text-muted">
                      {{ item.tipo_bem === 'BEM' ? 'Bem' : 'Serviço' }}
                    </p>
                  </div>
                </div>

                <UBadge :color="statusBadgeColor(item.status)" variant="subtle" size="sm">
                  {{ statusLabel(item.status) }}
                </UBadge>

                <div class="min-w-50">
                  <UBadge
                    v-if="item.match_tipo"
                    :icon="matchTipoIcon[item.match_tipo]"
                    :color="matchTipoColor[item.match_tipo]"
                    variant="subtle"
                    size="sm"
                  >
                    {{ matchTipoLabel[item.match_tipo] }}<span v-if="item.match_ref && item.match_tipo !== 'NEGOCIO'"> · {{ item.match_ref }}</span>
                  </UBadge>
                  <UBadge
                    v-else
                    color="neutral"
                    variant="subtle"
                    size="sm"
                    icon="i-lucide-circle-dashed"
                  >
                    Sem match
                  </UBadge>
                </div>

                <div class="flex justify-end gap-2">
                  <UButton
                    v-if="item.match_tipo === 'VOUCHER' && item.match_ref"
                    icon="i-lucide-download"
                    color="primary"
                    variant="subtle"
                    size="sm"
                    label="Voucher"
                    @click="downloadVoucher(item)"
                  />
                  <USelect
                    v-if="isAdmin && need.estado === 'PENDENTE'"
                    :model-value="item.match_tipo ?? undefined"
                    :items="matchOptions(item.tipo_bem)"
                    value-key="value"
                    label-key="label"
                    placeholder="Match..."
                    size="sm"
                    class="w-44"
                    @update:model-value="(v: MatchTipo) => updateMatch(item.id_item, v)"
                  />
                </div>
              </div>

              <div v-if="item.match_tipo === 'NEGOCIO' && isAdmin && need.estado === 'PENDENTE'" class="pl-8 border-l-2 border-info/40">
                <p class="text-xs text-muted uppercase tracking-wide font-medium mb-2">
                  Negócio parceiro
                </p>
                <InstituicoesBusinessPicker
                  :model-value="item.match_ref"
                  :businesses="businesses"
                  :category="item.tipo_bem_servico"
                  @select="(v) => setBusinessRef(item.id_item, v.nif, v.label)"
                />
              </div>

              <div v-else-if="item.match_tipo === 'NEGOCIO' && item.match_ref" class="pl-8 border-l-2 border-info/40">
                <p class="text-xs text-muted">
                  <UIcon name="i-lucide-store" class="size-3 inline-block mr-1" />
                  {{ item.match_ref }}
                </p>
              </div>

              <div v-if="item.match_tipo === 'PAINEL' && isAdmin && need.estado === 'PENDENTE'" class="pl-8 border-l-2 border-success/40">
                <p class="text-xs text-muted uppercase tracking-wide font-medium mb-2">
                  Alocação a painéis
                </p>
                <InstituicoesPanelPicker
                  :model-value="item.match_ref"
                  :panels="panels"
                  :institution-lat="institutionCoords.lat"
                  :institution-lng="institutionCoords.lng"
                  @update:model-value="(label) => setPanelRef(item.id_item, label)"
                />
              </div>

              <div v-else-if="item.match_tipo === 'PAINEL' && item.match_ref" class="pl-8 border-l-2 border-success/40">
                <p class="text-xs text-muted">
                  <UIcon name="i-lucide-radio-tower" class="size-3 inline-block mr-1" />
                  {{ item.match_ref }}
                </p>
              </div>
            </div>
          </div>
        </UPageCard>
      </div>

      <InstituicoesNeedStatusModal
        v-model:open="statusModalOpen"
        :need="need"
      />
    </template>
  </UDashboardPanel>
</template>
