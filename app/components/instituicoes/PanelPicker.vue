<script setup lang="ts">
import { haversineKm, type Panel } from '~/utils/domain'

const RADIUS_KM = 10

const props = defineProps<{
  modelValue: string | null
  panels: Panel[]
  institutionLat: number
  institutionLng: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string | null]
}>()

interface PanelWithDistance {
  panel: Panel
  distance: number
}

const panelsWithDistance = computed<PanelWithDistance[]>(() =>
  props.panels
    .map(panel => ({
      panel,
      distance: haversineKm(props.institutionLat, props.institutionLng, panel.geo_latitude, panel.geo_longitude)
    }))
    .sort((a, b) => a.distance - b.distance)
)

const panelsInRadius = computed(() => panelsWithDistance.value.filter(p => p.distance <= RADIUS_KM))
const hasAutoMatches = computed(() => panelsInRadius.value.length > 0)

const manualSelection = ref<number[]>([])
const open = ref(false)
const search = ref('')

const manualSelectionLabel = computed(() => {
  if (manualSelection.value.length === 0) return null
  const names = manualSelection.value
    .map(id => props.panels.find(p => p.id_dispositivo === id)?.nome)
    .filter(Boolean)
  return `${names.length} painel(éis): ${names.join(', ')}`
})

watch(manualSelectionLabel, (label) => {
  if (!hasAutoMatches.value) {
    emit('update:modelValue', label)
  }
})

// When inside radius, auto-set the ref to describe the auto-allocation
watch(hasAutoMatches, (auto) => {
  if (auto) {
    const ids = panelsInRadius.value.map(p => p.panel.id_dispositivo)
    emit('update:modelValue', `${ids.length} painel(éis) num raio de ${RADIUS_KM} km (auto): ${ids.map(i => `#${i}`).join(', ')}`)
  }
}, { immediate: true })

const filteredAvailable = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return panelsWithDistance.value
  return panelsWithDistance.value.filter(p =>
    p.panel.nome.toLowerCase().includes(q)
    || p.panel.localizacao.toLowerCase().includes(q)
  )
})

function toggle(id: number) {
  if (manualSelection.value.includes(id)) {
    manualSelection.value = manualSelection.value.filter(x => x !== id)
  } else {
    manualSelection.value = [...manualSelection.value, id]
  }
}

function fmtDist(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toFixed(1)} km`
}
</script>

<template>
  <div class="space-y-3">
    <div v-if="hasAutoMatches" class="rounded-lg border border-success/30 bg-success/5 px-4 py-3">
      <div class="flex items-center gap-3">
        <UIcon name="i-lucide-radio-tower" class="size-5 text-success shrink-0" />
        <div class="flex-1 min-w-0">
          <p class="font-medium text-highlighted">
            {{ panelsInRadius.length }} {{ panelsInRadius.length === 1 ? 'painel encontrado' : 'painéis encontrados' }} no raio de {{ RADIUS_KM }} km
          </p>
          <p class="text-xs text-muted mt-0.5">
            O pedido será exibido automaticamente em todos os painéis próximos da instituição.
          </p>
        </div>
        <UBadge color="success" variant="solid" size="lg">
          {{ panelsInRadius.length }}
        </UBadge>
      </div>

      <div class="mt-3 flex flex-wrap gap-1.5">
        <UBadge
          v-for="p in panelsInRadius"
          :key="p.panel.id_dispositivo"
          color="success"
          variant="subtle"
          size="sm"
        >
          {{ p.panel.nome }} · {{ fmtDist(p.distance) }}
        </UBadge>
      </div>
    </div>

    <div v-else class="space-y-2">
      <div class="rounded-lg border border-warning/30 bg-warning/5 px-4 py-3">
        <div class="flex items-center gap-3">
          <UIcon name="i-lucide-alert-triangle" class="size-5 text-warning shrink-0" />
          <div class="flex-1 min-w-0">
            <p class="font-medium text-highlighted">
              Sem painéis no raio de {{ RADIUS_KM }} km
            </p>
            <p class="text-xs text-muted mt-0.5">
              Escolha manualmente um ou vários painéis para mostrar o pedido.
            </p>
          </div>
        </div>
      </div>

      <UPopover
        v-model:open="open"
        :ui="{ content: 'w-[420px]' }"
      >
        <UButton
          :label="manualSelectionLabel ?? 'Selecionar painéis manualmente...'"
          :icon="manualSelection.length ? 'i-lucide-radio-tower' : 'i-lucide-search'"
          :color="manualSelection.length ? 'primary' : 'neutral'"
          :variant="manualSelection.length ? 'subtle' : 'outline'"
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
                placeholder="Pesquisar painel por nome ou localização..."
                autofocus
                class="w-full"
              />
              <p class="text-xs text-muted mt-2 px-1">
                <UIcon name="i-lucide-info" class="size-3 inline-block mr-1" />
                Selecionados: <span class="font-medium">{{ manualSelection.length }}</span>
              </p>
            </div>

            <div class="overflow-y-auto p-2 space-y-1">
              <div v-if="filteredAvailable.length === 0" class="text-center py-8 text-sm text-muted">
                <UIcon name="i-lucide-search-x" class="size-8 mb-2" />
                <p>Nenhum painel encontrado.</p>
              </div>

              <button
                v-for="p in filteredAvailable"
                :key="p.panel.id_dispositivo"
                type="button"
                class="w-full text-left rounded-md px-3 py-2 transition-colors focus:outline-none flex items-center gap-3"
                :class="manualSelection.includes(p.panel.id_dispositivo) ? 'bg-primary/10 hover:bg-primary/20' : 'hover:bg-elevated'"
                @click="toggle(p.panel.id_dispositivo)"
              >
                <UIcon
                  :name="manualSelection.includes(p.panel.id_dispositivo) ? 'i-lucide-check-square' : 'i-lucide-square'"
                  :class="manualSelection.includes(p.panel.id_dispositivo) ? 'text-primary' : 'text-muted'"
                  class="size-4 shrink-0"
                />
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-highlighted truncate">
                    {{ p.panel.nome }}
                  </p>
                  <p class="text-xs text-muted">
                    {{ p.panel.localizacao }}
                  </p>
                </div>
                <UBadge
                  :color="p.distance <= RADIUS_KM ? 'success' : 'neutral'"
                  variant="subtle"
                  size="sm"
                  class="shrink-0"
                >
                  {{ fmtDist(p.distance) }}
                </UBadge>
              </button>
            </div>
          </div>
        </template>
      </UPopover>
    </div>
  </div>
</template>
