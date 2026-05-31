<script setup lang="ts">
import type { GoodsService, TipoBem } from '~/utils/domain'

interface ItemEntry {
  tipo_bem_servico: string
  tipo_bem: TipoBem
}

const props = defineProps<{
  modelValue: ItemEntry[]
  goodsServices: GoodsService[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: ItemEntry[]]
}>()

const items = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})

const currentName = ref('')
const currentTipo = ref<TipoBem>('BEM')

const exclude = computed(() => items.value.map(i => i.tipo_bem_servico))

function addItem() {
  const name = currentName.value.trim()
  if (!name) return
  if (items.value.some(i => i.tipo_bem_servico.toLowerCase() === name.toLowerCase())) return

  // Always use the canonical tipo_bem from the existing goods service record.
  // If the user typed a name without clicking the dropdown suggestion, the
  // CategoryField may not have emitted update:tipo yet — looking it up here
  // prevents a tipo_bem conflict 422 from the backend.
  const canonical = props.goodsServices.find(
    g => g.tipo_bem_servico.toLowerCase() === name.toLowerCase()
  )
  const tipo: TipoBem = canonical ? canonical.tipo_bem : currentTipo.value

  items.value = [...items.value, { tipo_bem_servico: canonical?.tipo_bem_servico ?? name, tipo_bem: tipo }]
  currentName.value = ''
  currentTipo.value = 'BEM'
}

function removeItem(index: number) {
  items.value = items.value.filter((_, i) => i !== index)
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-start gap-2">
      <div class="flex-1">
        <NegociosCategoryField
          v-model="currentName"
          v-model:tipo="currentTipo"
          :goods-services="goodsServices"
          :exclude="exclude"
          @confirm="addItem"
        />
      </div>
      <UButton
        label="Adicionar"
        icon="i-lucide-plus"
        color="primary"
        variant="subtle"
        :disabled="!currentName.trim()"
        @click="addItem"
      />
    </div>

    <div v-if="items.length === 0" class="text-center py-8 text-sm text-muted">
      <UIcon name="i-lucide-package-search" class="size-8 mb-2" />
      <p>Ainda não adicionou nenhum item ao pedido.</p>
    </div>

    <div v-else class="space-y-2">
      <div
        v-for="(item, index) in items"
        :key="index"
        class="flex items-center justify-between gap-3 rounded-lg border border-default bg-elevated/30 px-4 py-3"
      >
        <div class="flex items-center gap-3 min-w-0">
          <UIcon
            :name="item.tipo_bem === 'BEM' ? 'i-lucide-package' : 'i-lucide-handshake'"
            :class="['size-5 shrink-0', item.tipo_bem === 'BEM' ? 'text-primary' : 'text-info']"
          />
          <div class="min-w-0">
            <p class="font-medium truncate">
              {{ item.tipo_bem_servico }}
            </p>
            <UBadge
              :color="item.tipo_bem === 'BEM' ? 'primary' : 'info'"
              variant="subtle"
              size="sm"
              class="mt-0.5"
            >
              {{ item.tipo_bem === 'BEM' ? 'Bem' : 'Serviço' }}
            </UBadge>
          </div>
        </div>
        <UButton
          icon="i-lucide-x"
          color="error"
          variant="ghost"
          size="sm"
          @click="removeItem(index)"
        />
      </div>
    </div>
  </div>
</template>
