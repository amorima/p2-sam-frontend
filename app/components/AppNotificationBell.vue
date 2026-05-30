<script setup lang="ts">
const { isNotificationsSlideoverOpen } = useDashboard()
const { unreadCount } = useNotifications()
</script>

<template>
  <UTooltip text="Notificações" :shortcuts="['N']">
    <UButton
      color="neutral"
      variant="ghost"
      square
      @click="isNotificationsSlideoverOpen = true"
    >
      <UChip
        color="error"
        inset
        :show="unreadCount > 0"
        :text="unreadCount > 9 ? '9+' : String(unreadCount)"
      >
        <UIcon name="i-lucide-bell" class="size-5 shrink-0" />
      </UChip>
    </UButton>
  </UTooltip>
</template>
