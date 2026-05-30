<script setup lang="ts">
import type { GoodsService, TipoBem } from '~/utils/domain'

// Reusable category selector for business offers: lets the user EITHER pick an
// existing canonical category OR create a brand-new one (with its tipo). Used by
// both "O Meu Negócio" (meu.vue) and the registration flow (registo.vue) so the
// behaviour is identical everywhere.
const props = withDefaults(defineProps<{
  modelValue: string
  tipo?: TipoBem
  goodsServices: GoodsService[]
  // categories already added to this business — excluded from the existing list
  exclude?: string[]
}>(), { tipo: 'BEM', exclude: () => [] })

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'update:tipo': [value: TipoBem]
}>()

const mode = ref<'existing' | 'new'>('existing')

const existingOptions = computed(() =>
  props.goodsServices
    .filter(g => !props.exclude.includes(g.tipo_bem_servico))
    .map(g => ({
      label: `${g.tipo_bem_servico} (${g.tipo_bem === 'BEM' ? 'Bem' : 'Serviço'})`,
      value: g.tipo_bem_servico
    }))
)

// If there are no existing categories to pick from, default to create mode.
watchEffect(() => {
  if (existingOptions.value.length === 0) mode.value = 'new'
})

function selectExisting(value: string) {
  emit('update:modelValue', value)
  const gs = props.goodsServices.find(g => g.tipo_bem_servico === value)
  if (gs) emit('update:tipo', gs.tipo_bem)
}

function setMode(next: 'existing' | 'new') {
  mode.value = next
  emit('update:modelValue', '')
}
</script>

<template>
  <div class="space-y-2">
    <div class="flex gap-1.5">
      <UButton
        label="Escolher existente"
        icon="i-lucide-list"
        size="xs"
        :color="mode === 'existing' ? 'primary' : 'neutral'"
        :variant="mode === 'existing' ? 'subtle' : 'ghost'"
        :disabled="existingOptions.length === 0"
        @click="setMode('existing')"
      />
      <UButton
        label="Criar nova"
        icon="i-lucide-square-plus"
        size="xs"
        :color="mode === 'new' ? 'primary' : 'neutral'"
        :variant="mode === 'new' ? 'subtle' : 'ghost'"
        @click="setMode('new')"
      />
    </div>

    <USelectMenu
      v-if="mode === 'existing'"
      :model-value="modelValue || undefined"
      :items="existingOptions"
      value-key="value"
      label-key="label"
      search-placeholder="Pesquisar categoria..."
      placeholder="Escolher categoria existente..."
      class="w-full"
      @update:model-value="selectExisting"
    />

    <div v-else class="flex gap-2">
      <UInput
        :model-value="modelValue"
        placeholder="Nome da nova categoria"
        class="flex-1"
        @update:model-value="emit('update:modelValue', String($event))"
      />
      <USelect
        :model-value="tipo"
        :items="[
          { label: 'Bem', value: 'BEM' },
          { label: 'Serviço', value: 'SERVICO' }
        ]"
        value-key="value"
        label-key="label"
        class="w-28"
        @update:model-value="emit('update:tipo', $event as TipoBem)"
      />
    </div>
  </div>
</template>
