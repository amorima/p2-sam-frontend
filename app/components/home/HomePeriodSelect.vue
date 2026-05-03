<script setup lang="ts">
import { eachDayOfInterval } from 'date-fns'
import type { Period, Range } from '~/types'

const model = defineModel<Period>({ required: true })

const props = defineProps<{
  range: Range
}>()

const days = computed(() => eachDayOfInterval(props.range))

const periods = computed<Period[]>(() => {
  if (days.value.length <= 8) {
    return ['daily']
  }

  if (days.value.length <= 31) {
    return ['daily', 'weekly']
  }

  return ['weekly', 'monthly']
})

const periodLabels = {
  daily: 'Diário',
  weekly: 'Semanal',
  monthly: 'Mensal'
} as const

// Ensure the model value is always a valid period
watch(periods, () => {
  if (!periods.value.includes(model.value)) {
    model.value = periods.value[0]!
  }
})
</script>

<template>
  <USelect
    v-model="model"
    :items="
      periods.map((period) => ({ label: periodLabels[period], value: period }))
    "
    variant="ghost"
    class="data-[state=open]:bg-elevated"
    :ui="{
      trailingIcon:
        'group-data-[state=open]:rotate-180 transition-transform duration-200'
    }"
  />
</template>
