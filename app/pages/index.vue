<script setup lang="ts">
import { sub } from 'date-fns'
import type { Period, Range } from '~/types'

definePageMeta({ middleware: 'admin-only' })

const range = shallowRef<Range>({
  start: sub(new Date(), { days: 14 }),
  end: new Date()
})
const period = ref<Period>('daily')
</script>

<template>
  <UDashboardPanel id="home">
    <template #header>
      <UDashboardNavbar title="Início">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <template #left>
          <HomeDateRangePicker v-model="range" class="-ms-1" />
          <HomePeriodSelect v-model="period" :range="range" />
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <HomeStats />
      <HomeChart :period="period" :range="range" />
      <HomeSales class="mt-6" />
    </template>
  </UDashboardPanel>
</template>
