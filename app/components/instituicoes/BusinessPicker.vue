<script setup lang="ts">
import type { Business, BusinessOffer } from '~/utils/domain'

interface PartnerOption {
  business: Business
  offer: BusinessOffer
}

const props = defineProps<{
  modelValue: string | null
  businesses: Business[]
  category: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string | null]
  'select': [value: { business: Business, offer: BusinessOffer, label: string, nif: string }]
}>()

const open = ref(false)
const search = ref('')

const allOptions = computed<PartnerOption[]>(() =>
  props.businesses
    .filter(b => (b.status ?? 'ATIVO') === 'ATIVO')
    .flatMap(b =>
      b.offers
        .filter(o => o.tipo_bem_servico === props.category)
        .map(o => ({ business: b, offer: o }))
    )
)

const filteredOptions = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return allOptions.value
  return allOptions.value.filter((opt) => {
    return (
      opt.business.entity.nome_entidade.toLowerCase().includes(q)
      || opt.offer.descricao.toLowerCase().includes(q)
      || opt.offer.tipo_bem_servico.toLowerCase().includes(q)
    )
  })
})

function descontoLabel(o: BusinessOffer): { text: string, color: 'success' | 'warning' | 'info' } {
  if (o.desconto >= 100) return { text: 'Pro bono', color: 'success' }
  if (o.desconto >= 50) return { text: `${o.desconto}% desconto`, color: 'warning' }
  return { text: `${o.desconto}% desconto`, color: 'info' }
}

function selectOption(opt: PartnerOption) {
  const d = descontoLabel(opt.offer)
  const label = `${opt.business.entity.nome_entidade} · ${d.text}`
  emit('update:modelValue', label)
  emit('select', { business: opt.business, offer: opt.offer, label, nif: opt.business.resource.nif_nipc })
  open.value = false
  search.value = ''
}
</script>

<template>
  <UPopover
    v-model:open="open"
    :ui="{ content: 'w-[420px]' }"
  >
    <UButton
      :label="modelValue || `Pesquisar negócio parceiro para '${category}'...`"
      :icon="modelValue ? 'i-lucide-store' : 'i-lucide-search'"
      :color="modelValue ? 'primary' : 'neutral'"
      :variant="modelValue ? 'subtle' : 'outline'"
      trailing-icon="i-lucide-chevron-down"
      block
      class="justify-between"
    />

    <template #content>
      <div class="flex flex-col max-h-[420px]">
        <div class="p-2 border-b border-default">
          <UInput
            v-model="search"
            icon="i-lucide-search"
            placeholder="Pesquisar por nome, categoria ou descrição..."
            autofocus
            class="w-full"
          />
          <p class="text-xs text-muted mt-2 px-1">
            <UIcon name="i-lucide-tag" class="size-3 inline-block mr-1" />
            Categoria: <span class="font-medium">{{ category }}</span>
          </p>
        </div>

        <div class="overflow-y-auto p-2 space-y-1">
          <div v-if="filteredOptions.length === 0" class="text-center py-8 text-sm text-muted">
            <UIcon name="i-lucide-store" class="size-8 mb-2" />
            <p>Nenhum negócio parceiro disponível para esta categoria.</p>
          </div>

          <button
            v-for="opt in filteredOptions"
            :key="opt.offer.id_oferta"
            type="button"
            class="w-full text-left rounded-md px-3 py-2 hover:bg-elevated transition-colors focus:outline-none focus:bg-elevated"
            @click="selectOption(opt)"
          >
            <div class="flex items-start justify-between gap-2 mb-1">
              <p class="font-medium text-highlighted truncate">
                {{ opt.business.entity.nome_entidade }}
              </p>
              <UBadge
                :color="descontoLabel(opt.offer).color"
                variant="subtle"
                size="sm"
                class="shrink-0"
              >
                {{ descontoLabel(opt.offer).text }}
              </UBadge>
            </div>
            <p class="text-xs text-muted line-clamp-2 mb-1">
              {{ opt.offer.descricao }}
            </p>
            <div class="flex items-center gap-2 text-xs text-muted">
              <UIcon name="i-lucide-tag" class="size-3" />
              <span>{{ opt.offer.tipo_bem_servico }}</span>
              <span class="text-dimmed">·</span>
              <span class="font-mono">{{ opt.business.entity.nif_nipc }}</span>
            </div>
          </button>
        </div>
      </div>
    </template>
  </UPopover>
</template>
