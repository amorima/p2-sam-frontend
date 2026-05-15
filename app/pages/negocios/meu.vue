<script setup lang="ts">
import { useNeeds } from '~/composables/useNeeds'
import type { BusinessOffer } from '~/utils/mockData'

const toast = useToast()
const { isBusiness, businessNif, isAdmin } = useAuth()
const { businesses, goodsServices, updateBusiness } = useNeeds()

if (isAdmin.value) {
  await navigateTo('/negocios/registo')
}

const myBusiness = computed(() => {
  if (!businessNif.value) return businesses.value[0] ?? null
  return businesses.value.find(b => b.resource.nif_nipc === businessNif.value) ?? null
})

const editMode = ref(false)

const editName = ref('')
const editEmail = ref('')
const editIban = ref('')

watch(myBusiness, (b) => {
  if (b) {
    editName.value = b.entity.nome_entidade
    editEmail.value = b.entity.email_login
    editIban.value = b.entity.iban
  }
}, { immediate: true })

function saveProfile() {
  if (!myBusiness.value) return
  if (!editName.value.trim() || !editEmail.value.trim() || !editIban.value.trim()) {
    toast.add({ title: 'Campos obrigatórios', description: 'Preencha nome, email e IBAN.', icon: 'i-lucide-alert-circle', color: 'warning' })
    return
  }
  updateBusiness(myBusiness.value.resource.nif_nipc, b => ({
    ...b,
    entity: {
      ...b.entity,
      nome_entidade: editName.value.trim(),
      email_login: editEmail.value.trim(),
      iban: editIban.value.trim()
    }
  }))
  toast.add({ title: 'Perfil atualizado', icon: 'i-lucide-check', color: 'success' })
  editMode.value = false
}

function cancelEdit() {
  if (myBusiness.value) {
    editName.value = myBusiness.value.entity.nome_entidade
    editEmail.value = myBusiness.value.entity.email_login
    editIban.value = myBusiness.value.entity.iban
  }
  editMode.value = false
}

// Offers / categorias management
const showAddOffer = ref(false)
const newCategory = ref('')
const newDescription = ref('')
const newValor = ref<number | undefined>(undefined)
const newDesconto = ref<number>(100)
const isProBono = computed(() => newDesconto.value === 100)

const categoryOptions = computed(() =>
  goodsServices.value.map(g => ({ label: `${g.tipo_bem_servico} (${g.tipo_bem === 'BEM' ? 'Bem' : 'Serviço'})`, value: g.tipo_bem_servico }))
)

function nextOfferId() {
  const all = businesses.value.flatMap(b => b.offers.map(o => o.id_oferta))
  return Math.max(900, ...all) + 1
}

function addOffer() {
  if (!myBusiness.value) return
  const cat = newCategory.value.trim()
  if (!cat || !newDescription.value.trim() || !newValor.value || newValor.value <= 0) {
    toast.add({ title: 'Campos obrigatórios', description: 'Preencha categoria, descrição e valor.', icon: 'i-lucide-alert-circle', color: 'warning' })
    return
  }
  if (myBusiness.value.offers.some(o => o.tipo_bem_servico === cat)) {
    toast.add({ title: 'Categoria já existe', description: 'Esta categoria já está registada no seu negócio.', icon: 'i-lucide-alert-circle', color: 'warning' })
    return
  }
  const newOffer: BusinessOffer = {
    id_oferta: nextOfferId(),
    negocio_nif_nipc: myBusiness.value.resource.nif_nipc,
    tipo_bem_servico: cat,
    descricao: newDescription.value.trim(),
    valor_total: newValor.value,
    desconto: newDesconto.value
  }
  updateBusiness(myBusiness.value.resource.nif_nipc, b => ({
    ...b,
    offers: [...b.offers, newOffer]
  }))
  toast.add({ title: 'Categoria adicionada', description: `${cat} adicionada ao seu negócio.`, icon: 'i-lucide-check', color: 'success' })
  showAddOffer.value = false
  newCategory.value = ''
  newDescription.value = ''
  newValor.value = undefined
  newDesconto.value = 100
}

function removeOffer(offerId: number) {
  if (!myBusiness.value) return
  updateBusiness(myBusiness.value.resource.nif_nipc, b => ({
    ...b,
    offers: b.offers.filter(o => o.id_oferta !== offerId)
  }))
  toast.add({ title: 'Categoria removida', icon: 'i-lucide-check', color: 'success' })
}

function descontoLabel(o: BusinessOffer): { text: string, color: 'success' | 'warning' | 'info' } {
  if (o.desconto >= 100) return { text: 'Pro bono', color: 'success' }
  if (o.desconto >= 50) return { text: `${o.desconto}% desconto`, color: 'warning' }
  return { text: `${o.desconto}% desconto`, color: 'info' }
}
</script>

<template>
  <UDashboardPanel id="meu-negocio">
    <template #header>
      <UDashboardNavbar title="O Meu Negócio">
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
            v-if="!editMode"
            label="Editar Perfil"
            icon="i-lucide-pencil"
            color="primary"
            variant="outline"
            @click="editMode = true"
          />
          <template v-else>
            <UButton
              label="Cancelar"
              color="neutral"
              variant="ghost"
              @click="cancelEdit"
            />
            <UButton
              label="Guardar"
              icon="i-lucide-check"
              color="primary"
              @click="saveProfile"
            />
          </template>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div v-if="!myBusiness" class="flex flex-col items-center justify-center py-24 text-center">
        <UIcon name="i-lucide-store-off" class="size-12 text-muted mb-3" />
        <p class="font-medium text-highlighted">
          Negócio não encontrado
        </p>
        <p class="text-sm text-muted mt-1">
          Não foi possível carregar os dados do seu negócio.
        </p>
      </div>

      <div v-else class="space-y-6">
        <!-- Profile -->
        <UPageCard variant="subtle">
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-store" class="size-4 text-muted" />
              <h3 class="font-semibold text-highlighted">
                Dados do Negócio
              </h3>
            </div>
          </template>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
            <UFormField label="NIF / NIPC">
              <UInput :model-value="myBusiness.resource.nif_nipc" disabled class="w-full font-mono" />
            </UFormField>
            <UFormField label="Nome do Negócio">
              <UInput v-if="editMode" v-model="editName" class="w-full" />
              <p v-else class="font-semibold text-highlighted text-base py-1">
                {{ myBusiness.entity.nome_entidade }}
              </p>
            </UFormField>
            <UFormField label="Email de Login">
              <UInput
                v-if="editMode"
                v-model="editEmail"
                type="email"
                class="w-full"
              />
              <p v-else class="py-1">
                {{ myBusiness.entity.email_login }}
              </p>
            </UFormField>
            <UFormField label="IBAN">
              <UInput v-if="editMode" v-model="editIban" class="w-full font-mono" />
              <p v-else class="font-mono py-1">
                {{ myBusiness.entity.iban }}
              </p>
            </UFormField>
            <UFormField label="Coordenadas">
              <p class="font-mono text-xs py-1">
                {{ myBusiness.resource.geo_latitude.toFixed(4) }}, {{ myBusiness.resource.geo_longitude.toFixed(4) }}
              </p>
            </UFormField>
          </div>
        </UPageCard>

        <!-- Offers / Categories -->
        <UPageCard variant="subtle">
          <template #header>
            <div class="flex items-center justify-between gap-4 flex-wrap">
              <div class="flex items-center gap-2 min-w-0">
                <UIcon name="i-lucide-tags" class="size-4 text-muted shrink-0" />
                <h3 class="font-semibold text-highlighted">
                  Categorias e Ofertas
                </h3>
              </div>
              <UButton
                label="Adicionar Categoria"
                icon="i-lucide-plus"
                color="primary"
                variant="subtle"
                size="sm"
                class="ml-auto shrink-0"
                @click="showAddOffer = !showAddOffer"
              />
            </div>
          </template>

          <div v-if="showAddOffer" class="mb-4 p-4 rounded-lg border border-default bg-elevated/30 space-y-3">
            <p class="text-xs font-semibold text-muted uppercase tracking-wide">
              Nova Categoria / Oferta
            </p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <UFormField label="Categoria (bem/serviço)">
                <USelectMenu
                  v-model="newCategory"
                  :items="categoryOptions"
                  value-key="value"
                  label-key="label"
                  search-placeholder="Pesquisar categoria..."
                  placeholder="Escolher..."
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Valor Base (€)">
                <UInput
                  v-model="newValor"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0,00"
                  trailing-icon="i-lucide-euro"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Descrição da oferta" class="sm:col-span-2">
                <UInput v-model="newDescription" placeholder="Ex.: Consultas jurídicas em direito civil e família" class="w-full" />
              </UFormField>
              <UFormField label="Desconto (%)" class="sm:col-span-2">
                <div class="flex items-center gap-3">
                  <UInput
                    v-model="newDesconto"
                    type="number"
                    min="0"
                    max="100"
                    step="5"
                    class="w-32"
                  />
                  <UBadge
                    v-if="isProBono"
                    color="success"
                    variant="subtle"
                    icon="i-lucide-heart"
                  >
                    Pro bono
                  </UBadge>
                  <span v-else class="text-xs text-muted">
                    0% = preço normal · 100% = pro bono
                  </span>
                </div>
              </UFormField>
            </div>
            <div class="flex justify-end gap-2 pt-2">
              <UButton
                label="Cancelar"
                color="neutral"
                variant="subtle"
                size="sm"
                @click="showAddOffer = false"
              />
              <UButton
                label="Adicionar"
                icon="i-lucide-check"
                color="primary"
                size="sm"
                @click="addOffer"
              />
            </div>
          </div>

          <div v-if="myBusiness.offers.length === 0" class="text-center py-8 text-sm text-muted">
            <UIcon name="i-lucide-tags" class="size-8 mb-2" />
            <p>Ainda não tem categorias registadas.</p>
            <p class="mt-1">
              Adicione categorias para receber pedidos do SAM.
            </p>
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="offer in myBusiness.offers"
              :key="offer.id_oferta"
              class="grid grid-cols-1 md:grid-cols-[1fr_auto_auto_auto] gap-3 items-center rounded-lg border border-default bg-elevated/30 px-4 py-3"
            >
              <div class="min-w-0">
                <p class="font-medium text-highlighted truncate">
                  {{ offer.tipo_bem_servico }}
                </p>
                <p class="text-xs text-muted truncate">
                  {{ offer.descricao }}
                </p>
              </div>
              <div class="text-sm tabular-nums text-muted">
                {{ new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(offer.valor_total) }}
              </div>
              <UBadge
                :color="descontoLabel(offer).color"
                variant="subtle"
                size="sm"
              >
                {{ descontoLabel(offer).text }}
              </UBadge>
              <UButton
                v-if="isBusiness"
                icon="i-lucide-trash-2"
                color="error"
                variant="ghost"
                size="sm"
                @click="removeOffer(offer.id_oferta)"
              />
            </div>
          </div>
        </UPageCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
