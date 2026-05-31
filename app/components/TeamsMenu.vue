<script setup lang="ts">
defineProps<{ collapsed?: boolean }>()

const { role } = useAuth()

const homePath = computed(() => {
  switch (role.value) {
    case 'patron': return '/mecenas'
    case 'institution': return '/instituicoes'
    case 'business': return '/negocios'
    default: return '/home'
  }
})
</script>

<template>
  <NuxtLink
    :to="homePath"
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
    <template v-else>
      <img src="/logo_big_light.svg" alt="SAM" class="h-8 w-auto object-contain dark:hidden">
      <img src="/logo_big.svg" alt="SAM" class="h-8 w-auto object-contain hidden dark:block">
    </template>
  </NuxtLink>
</template>
