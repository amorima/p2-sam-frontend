<script setup lang="ts">
import {
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  isSameDay,
  isSameWeek,
  isSameMonth,
  format
} from 'date-fns'
import { pt } from 'date-fns/locale'
import {
  VisXYContainer,
  VisLine,
  VisArea,
  VisAxis,
  VisCrosshair,
  VisTooltip
} from '@unovis/vue'
import type { Period, Range } from '~/types'

const cardRef = useTemplateRef<HTMLElement | null>('cardRef')

const props = defineProps<{
  period: Period
  range: Range
}>()

interface Donation {
  data: string
  valor_transacao: number
  estado: string
}

type DataRecord = { date: Date, amount: number }

const { width } = useElementSize(cardRef)
const chartData = ref<DataRecord[]>([])

const { data: donations } = await useAsyncData<Donation[]>(
  'home-chart-donations',
  () => $fetch<{ donations: Donation[] }>('/api/donations').then(r => r.donations ?? []).catch(() => []),
  { server: false, default: () => [] }
)

function isSameBucket(bucketDate: Date, donationDate: Date): boolean {
  if (props.period === 'daily') return isSameDay(bucketDate, donationDate)
  if (props.period === 'weekly') return isSameWeek(bucketDate, donationDate, { weekStartsOn: 1 })
  return isSameMonth(bucketDate, donationDate)
}

watch(
  [donations, () => props.period, () => props.range],
  () => {
    const { start, end } = props.range
    const weekOpts = { weekStartsOn: 1 as const }

    // Pre-filter to range so no out-of-range donations bleed into the first/last bucket
    const accepted = (donations.value ?? [])
      .filter(d => d.estado === 'ACEITE')
      .filter((d) => {
        const date = new Date(d.data)
        return date >= start && date <= end
      })

    const buckets: Date[]
      = props.period === 'daily'
        ? eachDayOfInterval({ start, end })
        : props.period === 'weekly'
          ? eachWeekOfInterval({ start, end }, weekOpts)
          : eachMonthOfInterval({ start, end })

    chartData.value = buckets.map(date => ({
      date,
      amount: accepted
        .filter(d => isSameBucket(date, new Date(d.data)))
        .reduce((sum, d) => sum + Number(d.valor_transacao), 0)
    }))
  },
  { immediate: true }
)

const x = (_: DataRecord, i: number) => i
const y = (d: DataRecord) => d.amount

const total = computed(() =>
  chartData.value.reduce((acc, { amount }) => acc + amount, 0)
)

const formatEUR = new Intl.NumberFormat('pt-PT', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0
}).format

function formatDate(date: Date): string {
  return {
    daily: format(date, 'd MMM', { locale: pt }),
    weekly: format(date, 'd MMM', { locale: pt }),
    monthly: format(date, 'MMM yyyy', { locale: pt })
  }[props.period]
}

const xTicks = (i: number) => {
  if (i === 0 || i === chartData.value.length - 1 || !chartData.value[i]) return ''
  return formatDate(chartData.value[i].date)
}

const template = (d: DataRecord) => `${formatDate(d.date)}: ${formatEUR(d.amount)}`
</script>

<template>
  <UCard
    ref="cardRef"
    :ui="{ root: 'overflow-visible', body: '!px-0 !pt-0 !pb-3' }"
  >
    <template #header>
      <div>
        <p class="text-xs text-muted uppercase mb-1.5">
          Valor das Doações Aceites
        </p>
        <p class="text-3xl text-highlighted font-semibold">
          {{ formatEUR(total) }}
        </p>
      </div>
    </template>

    <VisXYContainer
      :data="chartData"
      :padding="{ top: 40 }"
      class="h-96"
      :width="width"
    >
      <VisLine :x="x" :y="y" color="var(--ui-primary)" />
      <VisArea
        :x="x"
        :y="y"
        color="var(--ui-primary)"
        :opacity="0.1"
      />
      <VisAxis type="x" :x="x" :tick-format="xTicks" />
      <VisCrosshair
        :x="x"
        :y="y"
        color="var(--ui-primary)"
        :template="template"
      />
      <VisTooltip />
    </VisXYContainer>
  </UCard>
</template>

<style scoped>
.unovis-xy-container {
  --vis-crosshair-line-stroke-color: var(--ui-primary);
  --vis-crosshair-circle-stroke-color: var(--ui-bg);
  --vis-axis-grid-color: var(--ui-border);
  --vis-axis-tick-color: var(--ui-border);
  --vis-axis-tick-label-color: var(--ui-text-dimmed);
  --vis-tooltip-background-color: var(--ui-bg);
  --vis-tooltip-border-color: var(--ui-border);
  --vis-tooltip-text-color: var(--ui-text-highlighted);
}
</style>
