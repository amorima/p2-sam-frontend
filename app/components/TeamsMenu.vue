<script setup lang="ts">
defineProps<{
  collapsed?: boolean
}>()
</script>

<template>
  <NuxtLink
    to="/"
    class="flex w-full items-center justify-center rounded-md transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    :class="collapsed ? 'p-2' : 'p-3'"
    aria-label="Ir para a homepage"
  >
    <img
      v-if="collapsed"
      src="/logo_small.svg"
      alt="SAM"
      class="h-8 w-8 object-contain"
    >
    <img
      v-else
      src="/logo_big.svg"
      alt="SAM"
      class="h-8 w-auto object-contain"
    >
  </NuxtLink>
</template>
