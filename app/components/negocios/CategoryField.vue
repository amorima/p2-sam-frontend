<script setup lang="ts">
import type { GoodsService, TipoBem } from '~/utils/domain'

const props = withDefaults(defineProps<{
  modelValue: string
  tipo?: TipoBem
  goodsServices: GoodsService[]
  exclude?: string[]
}>(), { tipo: 'BEM', exclude: () => [] })

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'update:tipo': [value: TipoBem]
  'confirm': []
}>()

const open = ref(false)
const highlightedIndex = ref(-1)

const available = computed(() =>
  props.goodsServices.filter(g => !props.exclude.includes(g.tipo_bem_servico))
)

const filtered = computed(() => {
  const q = props.modelValue.trim().toLowerCase()
  if (!q) return available.value
  return available.value.filter(g => g.tipo_bem_servico.toLowerCase().includes(q))
})

// Reset highlight when the list changes
watch(filtered, () => {
  highlightedIndex.value = -1
})

const matchedExisting = computed(() =>
  props.goodsServices.find(g => g.tipo_bem_servico.toLowerCase() === props.modelValue.trim().toLowerCase())
)
const isNewCategory = computed(() => props.modelValue.trim().length > 0 && !matchedExisting.value)

function choose(g: GoodsService) {
  emit('update:modelValue', g.tipo_bem_servico)
  emit('update:tipo', g.tipo_bem)
  open.value = false
  highlightedIndex.value = -1
}

function onArrowDown() {
  if (!open.value) {
    open.value = true
    return
  }
  highlightedIndex.value = Math.min(highlightedIndex.value + 1, filtered.value.length - 1)
}

function onArrowUp() {
  highlightedIndex.value = Math.max(highlightedIndex.value - 1, -1)
}

function onEnter() {
  if (open.value && highlightedIndex.value >= 0 && filtered.value[highlightedIndex.value]) {
    // Select the highlighted item
    choose(filtered.value[highlightedIndex.value]!)
    emit('confirm')
    return
  }
  if (matchedExisting.value) emit('update:tipo', matchedExisting.value.tipo_bem)
  open.value = false
  highlightedIndex.value = -1
  if (props.modelValue.trim()) emit('confirm')
}

function onBlur() {
  setTimeout(() => {
    open.value = false
    highlightedIndex.value = -1
  }, 150)
}
</script>

<template>
  <div class="flex items-start gap-2">
    <div class="relative flex-1">
      <UInput
        :model-value="modelValue"
        placeholder="Escreva ou escolha uma categoria..."
        class="w-full"
        icon="i-lucide-tag"
        @update:model-value="(v) => { emit('update:modelValue', String(v)); open = true }"
        @focus="open = true"
        @blur="onBlur"
        @keydown.enter.prevent="onEnter"
        @keydown.arrow-down.prevent="onArrowDown"
        @keydown.arrow-up.prevent="onArrowUp"
        @keydown.escape="() => { open = false; highlightedIndex = -1 }"
      />

      <div
        v-if="open && filtered.length"
        class="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto rounded-lg border border-default bg-default shadow-lg ring ring-default"
      >
        <button
          v-for="(g, i) in filtered"
          :key="g.tipo_bem_servico"
          type="button"
          class="w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors"
          :class="i === highlightedIndex ? 'bg-primary/10 text-primary' : 'hover:bg-elevated'"
          @mousedown.prevent="choose(g)"
          @mouseenter="highlightedIndex = i"
        >
          <span class="truncate">{{ g.tipo_bem_servico }}</span>
          <UBadge :color="g.tipo_bem === 'BEM' ? 'primary' : 'info'" variant="subtle" size="sm">
            {{ g.tipo_bem === 'BEM' ? 'Bem' : 'Serviço' }}
          </UBadge>
        </button>
      </div>
    </div>

    <USelect
      v-if="isNewCategory"
      :model-value="tipo"
      :items="[
        { label: 'Bem', value: 'BEM' },
        { label: 'Serviço', value: 'SERVICO' }
      ]"
      value-key="value"
      label-key="label"
      class="w-28 shrink-0"
      @update:model-value="emit('update:tipo', $event as TipoBem)"
    />
  </div>
</template>
