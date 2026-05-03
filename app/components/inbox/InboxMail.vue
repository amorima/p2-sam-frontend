<script setup lang="ts">
import { format } from 'date-fns'
import type { Mail } from '~/types'

defineProps<{
  mail: Mail
}>()

const emits = defineEmits(['close'])

const dropdownItems = [
  [
    {
      label: 'Marcar como não lida',
      icon: 'i-lucide-check-circle'
    },
    {
      label: 'Marcar como importante',
      icon: 'i-lucide-triangle-alert'
    }
  ],
  [
    {
      label: 'Destacar',
      icon: 'i-lucide-star'
    }
  ]
]
</script>

<template>
  <UDashboardPanel id="inbox-2">
    <UDashboardNavbar :title="mail.subject" :toggle="false">
      <template #leading>
        <UButton
          icon="i-lucide-x"
          color="neutral"
          variant="ghost"
          class="-ms-1.5"
          @click="emits('close')"
        />
      </template>

      <template #right>
        <UDropdownMenu :items="dropdownItems">
          <UButton
            icon="i-lucide-ellipsis-vertical"
            color="neutral"
            variant="ghost"
          />
        </UDropdownMenu>
      </template>
    </UDashboardNavbar>

    <div
      class="flex flex-col sm:flex-row justify-between gap-1 p-4 sm:px-6 border-b border-default"
    >
      <div class="flex items-start gap-4 sm:my-1.5">
        <UAvatar v-bind="mail.from.avatar" :alt="mail.from.name" size="3xl" />

        <div class="min-w-0">
          <p class="font-semibold text-highlighted">
            {{ mail.from.name }}
          </p>
          <p class="text-muted">
            {{ mail.from.email }}
          </p>
        </div>
      </div>

      <p class="max-sm:pl-16 text-muted text-sm sm:mt-2">
        {{ format(new Date(mail.date), "dd MMM HH:mm") }}
      </p>
    </div>

    <div class="flex-1 p-4 sm:p-6 overflow-y-auto">
      <p class="whitespace-pre-wrap">
        {{ mail.body }}
      </p>
    </div>
  </UDashboardPanel>
</template>
