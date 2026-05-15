<script setup lang="ts">
interface PaginationState {
  pageIndex: number
  pageSize: number
}

const props = defineProps<{
  modelValue: PaginationState
  total: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: PaginationState]
}>()

const pageSizeOptions = [
  { label: '20 por página', value: 20 },
  { label: '50 por página', value: 50 },
  { label: '100 por página', value: 100 },
  { label: 'Todas', value: -1 }
]

const pageSize = computed({
  get: () => props.modelValue.pageSize,
  set: (v: number) => {
    const newSize = v === -1 ? Math.max(props.total, 1) : v
    emit('update:modelValue', { pageIndex: 0, pageSize: newSize })
  }
})

const pageIndex = computed({
  get: () => props.modelValue.pageIndex,
  set: (v: number) => emit('update:modelValue', { ...props.modelValue, pageIndex: v })
})

const totalPages = computed(() => Math.max(1, Math.ceil(props.total / Math.max(props.modelValue.pageSize, 1))))

// UPagination uses 1-based page numbering
const currentPage = computed({
  get: () => pageIndex.value + 1,
  set: (v: number) => { pageIndex.value = v - 1 }
})

const fromRow = computed(() => props.total === 0 ? 0 : pageIndex.value * props.modelValue.pageSize + 1)
const toRow = computed(() => Math.min((pageIndex.value + 1) * props.modelValue.pageSize, props.total))
</script>

<template>
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-2">
    <div class="flex items-center gap-3 text-sm text-muted">
      <span>
        <template v-if="total === 0">Sem resultados</template>
        <template v-else>A mostrar <strong class="text-highlighted">{{ fromRow }}-{{ toRow }}</strong> de <strong class="text-highlighted">{{ total }}</strong></template>
      </span>
      <USelect
        v-model="pageSize"
        :items="pageSizeOptions"
        value-key="value"
        label-key="label"
        size="sm"
        class="w-44"
      />
    </div>

    <UPagination
      v-if="totalPages > 1"
      v-model:page="currentPage"
      :total="total"
      :items-per-page="modelValue.pageSize"
      :sibling-count="1"
      show-edges
      size="sm"
    />
  </div>
</template>
