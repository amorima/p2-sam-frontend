<script setup lang="ts">
import { breakpointsTailwind } from '@vueuse/core'
import type { AppNotification } from '~/composables/useNotifications'

const tabItems = [
  { label: 'Todas', value: 'all' },
  { label: 'Não Lidas', value: 'unread' }
]
const selectedTab = ref('all')

const { notifications, unreadCount, markAllAsRead } = useNotifications()

const filteredNotifications = computed<AppNotification[]>(() => {
  if (selectedTab.value === 'unread') return notifications.value.filter(n => !n.lida)
  return notifications.value
})

const selectedNotification = ref<AppNotification | null>(null)

const isDetailOpen = computed({
  get: () => !!selectedNotification.value,
  set: (v) => { if (!v) selectedNotification.value = null }
})

watch(filteredNotifications, () => {
  if (selectedNotification.value && !filteredNotifications.value.find(n => n._id === selectedNotification.value!._id)) {
    selectedNotification.value = null
  }
})

const breakpoints = useBreakpoints(breakpointsTailwind)
const isMobile = breakpoints.smaller('lg')
</script>

<template>
  <UDashboardPanel
    id="inbox-list"
    :default-size="28"
    :min-size="22"
    :max-size="36"
    resizable
  >
    <UDashboardNavbar title="Notificações">
      <template #leading>
        <UDashboardSidebarCollapse />
      </template>

      <template #trailing>
        <UBadge :label="filteredNotifications.length" variant="subtle" />
      </template>

      <template #right>
        <div class="flex items-center gap-2">
          <UTabs
            v-model="selectedTab"
            :items="tabItems"
            :content="false"
            size="xs"
          />
          <UTooltip v-if="unreadCount > 0" text="Marcar todas como lidas">
            <UButton
              icon="i-lucide-check-check"
              color="neutral"
              variant="ghost"
              size="xs"
              @click="markAllAsRead()"
            />
          </UTooltip>
        </div>
      </template>
    </UDashboardNavbar>

    <InboxList
      v-model="selectedNotification"
      :notifications="filteredNotifications"
    />
  </UDashboardPanel>

  <InboxNotificationDetail
    v-if="selectedNotification && !isMobile"
    :notification="selectedNotification"
    @close="selectedNotification = null"
  />
  <div v-else-if="!isMobile" class="hidden lg:flex flex-1 items-center justify-center">
    <div class="text-center space-y-2">
      <UIcon name="i-lucide-bell" class="size-16 text-dimmed mx-auto" />
      <p class="text-muted text-sm">
        Selecione uma notificação
      </p>
    </div>
  </div>

  <ClientOnly>
    <USlideover v-if="isMobile" v-model:open="isDetailOpen">
      <template #content>
        <InboxNotificationDetail
          v-if="selectedNotification"
          :notification="selectedNotification"
          @close="selectedNotification = null"
        />
      </template>
    </USlideover>
  </ClientOnly>
</template>
