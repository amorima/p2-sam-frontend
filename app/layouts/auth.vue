<template>
  <div class="min-h-dvh bg-default flex flex-col items-center justify-center p-4">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center size-14 bg-primary rounded-2xl mb-4 shadow-lg">
          <UIcon name="i-lucide-landmark" class="size-7 text-white" />
        </div>
        <h1 class="text-2xl font-bold text-highlighted">
          Sistema de Apoio Municipal
        </h1>
        <p class="text-sm text-muted mt-1">
          Vila do Conde
        </p>
      </div>
      <slot />
    </div>
  </div>
</template>
