<script setup lang="ts">
import { useNeeds } from '~/composables/useNeeds'
import type { MatchTipo, Need } from '~/utils/mockData'
import { printVoucher } from '~/utils/voucherPDF'

const toast = useToast()
const { isAdmin } = useAuth()
const { needs, businesses, panels, institutions, setItemMatch, approveNeed, rejectNeed } = useNeeds()

if (!isAdmin.value) {
  await navigateTo('/instituicoes')
}

const pendingNeeds = computed(() => needs.value.filter(n => n.estado === 'PENDENTE'))

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

const showRejectModal = ref(false)
const rejectTarget = ref<Need | null>(null)
const rejectReason = ref('')

function openReject(need: Need) {
  rejectTarget.value = need
  rejectReason.value = ''
  showRejectModal.value = true
}

function confirmReject() {
  if (!rejectTarget.value) return
  if (!rejectReason.value.trim()) {
    toast.add({ title: 'Motivo obrigatório', description: 'Indique o motivo da recusa.', icon: 'i-lucide-alert-circle', color: 'warning' })
    return
  }
  rejectNeed(rejectTarget.value.id_pedido, rejectReason.value.trim())
  toast.add({ title: 'Pedido rejeitado', description: `Pedido #${rejectTarget.value.id_pedido} foi recusado.`, icon: 'i-lucide-x', color: 'error' })
  showRejectModal.value = false
  rejectTarget.value = null
}

function updateMatch(need: Need, id_item: number, tipo: MatchTipo | null, ref?: string) {
  let reference: string | null
  if (tipo === 'VOUCHER') {
    reference = `VCH-${new Date().getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}`
  } else if (tipo === 'NEGOCIO') {
    reference = ref ?? null
  } else if (tipo === 'PAINEL') {
    reference = ref ?? 'A alocar a painel'
  } else {
    reference = null
  }
  setItemMatch(need.id_pedido, id_item, tipo, reference)
}

function setBusinessRef(need: Need, id_item: number, label: string | null) {
  setItemMatch(need.id_pedido, id_item, 'NEGOCIO', label)
}

function setPanelRef(need: Need, id_item: number, label: string | null) {
  setItemMatch(need.id_pedido, id_item, 'PAINEL', label)
}

function institutionCoords(nif: string): { lat: number, lng: number } {
  const inst = institutions.value.find(i => i.resource.nif_nipc === nif)
  return {
    lat: inst?.resource.geo_latitude ?? 41.3526,
    lng: inst?.resource.geo_longitude ?? -8.7396
  }
}

function approve(need: Need) {
  const unmatched = need.items.filter(i => !i.match_tipo)
  if (unmatched.length > 0 && !need.urgente) {
    toast.add({
      title: 'Itens sem match',
      description: `${unmatched.length} item(ns) sem destino. Defina o match para cada um antes de aprovar.`,
      icon: 'i-lucide-alert-circle',
      color: 'warning'
    })
    return
  }
  approveNeed(need.id_pedido)
  toast.add({
    title: 'Pedido aprovado',
    description: need.urgente
      ? `Pedido #${need.id_pedido} aprovado. Vouchers emitidos automaticamente para os bens.`
      : `Pedido #${need.id_pedido} aprovado com sucesso.`,
    icon: 'i-lucide-check',
    color: 'success'
  })
  // Auto-download vouchers for urgent needs that just got vouchers
  if (need.urgente) {
    const updated = needs.value.find(n => n.id_pedido === need.id_pedido)
    if (updated) {
      updated.items
        .filter(i => i.match_tipo === 'VOUCHER' && i.match_ref)
        .forEach(it => printVoucher({
          voucher_ref: it.match_ref!,
          id_pedido: updated.id_pedido,
          nif_nipc: updated.nif_nipc,
          nome_entidade: updated.nome_entidade ?? updated.nif_nipc,
          tipo_bem_servico: it.tipo_bem_servico
        }))
    }
  }
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })
}
</script>

<template>
  <UDashboardPanel id="aprovacao-pedidos">
    <template #header>
      <UDashboardNavbar title="Aprovação de Pedidos">
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
      </UDashboardNavbar>
    </template>

    <template #body>
      <div v-if="pendingNeeds.length === 0" class="flex flex-col items-center justify-center py-24 text-center">
        <UIcon name="i-lucide-check-circle-2" class="size-16 text-success mb-4" />
        <p class="text-lg font-semibold text-highlighted">
          Sem pedidos pendentes
        </p>
        <p class="text-sm text-muted mt-1">
          Todos os pedidos foram tratados.
        </p>
        <UButton
          label="Ver todos os pedidos"
          icon="i-lucide-list"
          color="primary"
          variant="subtle"
          class="mt-4"
          to="/instituicoes"
        />
      </div>

      <div v-else class="space-y-6">
        <UAlert
          icon="i-lucide-info"
          color="info"
          variant="subtle"
          title="Como funciona a aprovação"
          description="Para cada item do pedido, escolha como será suprido: emissão de voucher (PDF para gastar fundos), negócio parceiro, ou alocação a um painel para os cidadãos doarem (só para bens)."
        />

        <UPageCard
          v-for="need in pendingNeeds"
          :key="need.id_pedido"
          variant="subtle"
        >
          <template #header>
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <div>
                  <p class="text-xs text-muted uppercase tracking-wide font-medium">
                    Pedido
                  </p>
                  <p class="font-mono font-semibold text-highlighted">
                    #{{ need.id_pedido }}
                  </p>
                </div>
                <USeparator orientation="vertical" class="h-10" />
                <div>
                  <p class="text-xs text-muted uppercase tracking-wide font-medium">
                    Instituição
                  </p>
                  <p class="font-semibold text-highlighted">
                    {{ need.nome_entidade ?? need.nif_nipc }}
                  </p>
                  <p class="text-xs text-muted font-mono">
                    {{ need.nif_nipc }}
                  </p>
                </div>
                <USeparator orientation="vertical" class="h-10" />
                <div>
                  <p class="text-xs text-muted uppercase tracking-wide font-medium">
                    Submetido
                  </p>
                  <p class="text-sm">
                    {{ formatDate(need.data) }}
                  </p>
                </div>
              </div>
              <UBadge
                v-if="need.urgente"
                color="error"
                variant="solid"
                size="lg"
                icon="i-lucide-zap"
              >
                URGENTE
              </UBadge>
            </div>
          </template>

          <div class="space-y-3">
            <p class="text-xs font-semibold text-muted uppercase tracking-wide">
              Itens do pedido — atribua um destino a cada um
            </p>

            <div
              v-for="item in need.items"
              :key="item.id_item"
              class="rounded-lg border border-default bg-elevated/30 px-4 py-3 space-y-3"
            >
              <div class="grid grid-cols-1 md:grid-cols-[1fr_auto_220px] gap-3 items-center">
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

                <div class="md:justify-self-center">
                  <UBadge
                    v-if="item.match_tipo"
                    :icon="matchTipoIcon[item.match_tipo]"
                    color="success"
                    variant="subtle"
                    size="sm"
                  >
                    {{ matchTipoLabel[item.match_tipo] }}
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

                <USelect
                  :model-value="item.match_tipo ?? undefined"
                  :items="matchOptions(item.tipo_bem)"
                  value-key="value"
                  label-key="label"
                  placeholder="Escolher match..."
                  class="w-full"
                  @update:model-value="(v: MatchTipo) => updateMatch(need, item.id_item, v)"
                />
              </div>

              <div v-if="item.match_tipo === 'NEGOCIO'" class="pl-8 border-l-2 border-info/40">
                <p class="text-xs text-muted uppercase tracking-wide font-medium mb-2">
                  Escolha o negócio parceiro
                </p>
                <InstituicoesBusinessPicker
                  :model-value="item.match_ref"
                  :businesses="businesses"
                  :category="item.tipo_bem_servico"
                  @select="(v) => setBusinessRef(need, item.id_item, v.label)"
                />
              </div>

              <div v-if="item.match_tipo === 'PAINEL'" class="pl-8 border-l-2 border-success/40">
                <p class="text-xs text-muted uppercase tracking-wide font-medium mb-2">
                  Alocação a painéis
                </p>
                <InstituicoesPanelPicker
                  :model-value="item.match_ref"
                  :panels="panels"
                  :institution-lat="institutionCoords(need.nif_nipc).lat"
                  :institution-lng="institutionCoords(need.nif_nipc).lng"
                  @update:model-value="(label) => setPanelRef(need, item.id_item, label)"
                />
              </div>
            </div>
          </div>

          <template #footer>
            <div class="flex flex-wrap justify-end gap-2">
              <UButton
                label="Rejeitar"
                icon="i-lucide-x"
                color="error"
                variant="subtle"
                @click="openReject(need)"
              />
              <UButton
                label="Aprovar Pedido"
                icon="i-lucide-check"
                color="primary"
                @click="approve(need)"
              />
            </div>
          </template>
        </UPageCard>
      </div>

      <UModal
        v-model:open="showRejectModal"
        title="Rejeitar Pedido"
        :description="rejectTarget ? `Pedido #${rejectTarget.id_pedido} — ${rejectTarget.nome_entidade ?? rejectTarget.nif_nipc}` : ''"
      >
        <template #body>
          <div class="space-y-4">
            <UFormField label="Motivo da Recusa" required>
              <UTextarea
                v-model="rejectReason"
                :rows="4"
                placeholder="Explique o motivo pelo qual está a recusar este pedido..."
                class="w-full"
              />
            </UFormField>
            <div class="flex justify-end gap-2">
              <UButton
                label="Cancelar"
                color="neutral"
                variant="subtle"
                @click="showRejectModal = false"
              />
              <UButton
                label="Confirmar Recusa"
                icon="i-lucide-x"
                color="error"
                @click="confirmReject"
              />
            </div>
          </div>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>
