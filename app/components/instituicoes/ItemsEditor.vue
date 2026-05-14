<script setup lang="ts">
import type { GoodsService, TipoBem } from '~/utils/mockData'

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

const newName = ref('')
const newTipo = ref<TipoBem>('BEM')
const showCreate = ref(false)
const selectedExisting = ref<string | undefined>(undefined)

const availableOptions = computed(() =>
  props.goodsServices
    .filter(g => !items.value.some(i => i.tipo_bem_servico === g.tipo_bem_servico))
    .map(g => ({ label: `${g.tipo_bem_servico} (${g.tipo_bem === 'BEM' ? 'Bem' : 'Serviço'})`, value: g.tipo_bem_servico }))
)

function addExisting() {
  const sel = selectedExisting.value
  if (!sel) return
  const gs = props.goodsServices.find(g => g.tipo_bem_servico === sel)
  if (!gs) return
  if (items.value.some(i => i.tipo_bem_servico === gs.tipo_bem_servico)) return
  items.value = [...items.value, { tipo_bem_servico: gs.tipo_bem_servico, tipo_bem: gs.tipo_bem }]
  selectedExisting.value = undefined
}

function addNew() {
  const name = newName.value.trim()
  if (!name) return
  if (items.value.some(i => i.tipo_bem_servico.toLowerCase() === name.toLowerCase())) return
  items.value = [...items.value, { tipo_bem_servico: name, tipo_bem: newTipo.value }]
  newName.value = ''
  newTipo.value = 'BEM'
  showCreate.value = false
}

function removeItem(index: number) {
  items.value = items.value.filter((_, i) => i !== index)
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-col sm:flex-row gap-2">
      <USelectMenu
        v-model="selectedExisting"
        :items="availableOptions"
        value-key="value"
        label-key="label"
        placeholder="Pesquisar artigo/serviço existente..."
        search-placeholder="Pesquisar..."
        class="flex-1"
      />
      <UButton
        label="Adicionar"
        icon="i-lucide-plus"
        color="primary"
        variant="subtle"
        :disabled="!selectedExisting"
        @click="addExisting"
      />
      <UButton
        label="Criar novo"
        icon="i-lucide-square-plus"
        color="neutral"
        variant="outline"
        @click="showCreate = !showCreate"
      />
    </div>

    <div v-if="showCreate" class="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2 p-3 rounded-lg border border-default bg-elevated/30">
      <UInput
        v-model="newName"
        placeholder="Nome do novo bem/serviço"
        class="w-full"
        @keyup.enter="addNew"
      />
      <USelect
        v-model="newTipo"
        :items="[
          { label: 'Bem', value: 'BEM' },
          { label: 'Serviço', value: 'SERVICO' }
        ]"
        value-key="value"
        label-key="label"
        class="w-32"
      />
      <UButton
        label="Criar"
        icon="i-lucide-check"
        color="primary"
        :disabled="!newName.trim()"
        @click="addNew"
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
