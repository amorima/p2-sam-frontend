<script setup lang="ts">
import { breakpointsTailwind } from '@vueuse/core'
import type { AppNotification } from '~/composables/useNotifications'

const tabItems = [
  { label: 'Todas', value: 'all' },
  { label: 'Não Lidas', value: 'unread' }
]
const selectedTab = ref('all')

const { notifications, unreadCount, markAllAsRead, deleteAllRead, loadHistory, loading } = useNotifications()

// Always load fresh from MongoDB when the inbox opens, regardless of socket state
onMounted(() => loadHistory())

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
          <UDropdownMenu
            :items="[
              [{
                label: 'Marcar todas como lidas',
                icon: 'i-lucide-check-check',
                disabled: unreadCount === 0,
                onSelect: markAllAsRead
              }],
              [{
                label: 'Apagar lidas',
                icon: 'i-lucide-trash-2',
                color: 'error',
                disabled: notifications.filter(n => n.lida).length === 0,
                onSelect: () => { deleteAllRead(); selectedNotification = null }
              }]
            ]"
          >
            <UButton
              icon="i-lucide-ellipsis-vertical"
              color="neutral"
              variant="ghost"
              size="xs"
            />
          </UDropdownMenu>
        </div>
      </template>
    </UDashboardNavbar>

    <div v-if="loading && notifications.length === 0" class="divide-y divide-default">
      <div v-for="i in 6" :key="i" class="p-4 sm:px-6 space-y-1.5">
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <USkeleton class="size-4 rounded shrink-0" />
            <USkeleton class="h-3.5 w-36" />
          </div>
          <USkeleton class="h-3 w-10" />
        </div>
        <USkeleton class="h-3 w-52 ml-6" />
      </div>
    </div>
    <InboxList
      v-else
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
