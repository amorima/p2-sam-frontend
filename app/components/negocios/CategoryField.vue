<script setup lang="ts">
import type { GoodsService, TipoBem } from '~/utils/domain'

// Single combobox for choosing a business-offer category: as you type, the list
// of existing categories filters below; pick one to select it. If what you type
// isn't an existing category, it simply becomes a new category — and a Bem/Serviço
// selector appears beside the field so you can classify the new entry.
const props = withDefaults(defineProps<{
  modelValue: string
  tipo?: TipoBem
  goodsServices: GoodsService[]
  exclude?: string[]
}>(), { tipo: 'BEM', exclude: () => [] })

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'update:tipo': [value: TipoBem]
}>()

const open = ref(false)
const inputEl = ref<HTMLInputElement | null>(null)

const available = computed(() =>
  props.goodsServices.filter(g => !props.exclude.includes(g.tipo_bem_servico))
)

const filtered = computed(() => {
  const q = props.modelValue.trim().toLowerCase()
  if (!q) return available.value
  return available.value.filter(g => g.tipo_bem_servico.toLowerCase().includes(q))
})

// The current text matches an existing canonical category → no tipo choice needed.
const matchedExisting = computed(() =>
  props.goodsServices.find(g => g.tipo_bem_servico.toLowerCase() === props.modelValue.trim().toLowerCase())
)
const isNewCategory = computed(() => props.modelValue.trim().length > 0 && !matchedExisting.value)

function choose(g: GoodsService) {
  emit('update:modelValue', g.tipo_bem_servico)
  emit('update:tipo', g.tipo_bem)
  open.value = false
}

function onEnter() {
  // If the typed value matches an existing option, adopt its tipo; otherwise it
  // stays as a brand-new category (the tipo selector handles classification).
  if (matchedExisting.value) emit('update:tipo', matchedExisting.value.tipo_bem)
  open.value = false
}

function onBlur() {
  // Delay so a click on an option registers before the list closes.
  setTimeout(() => {
    open.value = false
  }, 150)
}
</script>

<template>
  <div class="flex items-start gap-2">
    <div class="relative flex-1">
      <UInput
        ref="inputEl"
        :model-value="modelValue"
        placeholder="Escreva ou escolha uma categoria..."
        class="w-full"
        icon="i-lucide-tag"
        @update:model-value="emit('update:modelValue', String($event))"
        @focus="open = true"
        @blur="onBlur"
        @keydown.enter.prevent="onEnter"
      />

      <div
        v-if="open && filtered.length"
        class="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto rounded-lg border border-default bg-default shadow-lg ring ring-default"
      >
        <button
          v-for="g in filtered"
          :key="g.tipo_bem_servico"
          type="button"
          class="w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-elevated"
          @mousedown.prevent="choose(g)"
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
