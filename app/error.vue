<script setup lang="ts">
import type { NuxtError } from "#app";

defineProps<{
  error: NuxtError;
}>();

useSeoMeta({
  title: "Página não encontrada",
  description: "Pedimos desculpa, mas esta página não foi encontrada.",
});

useHead({
  htmlAttrs: {
    lang: "pt-PT",
  },
});
</script>

<template>
  <UApp>
    <UError :error="error" />
  </UApp>
</template>
