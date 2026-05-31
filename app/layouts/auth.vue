<template>
  <div class="min-h-dvh bg-default flex flex-col items-center justify-center p-4">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <img src="/logo_big_light.svg" alt="SAM" class="h-16 mx-auto mb-4 dark:hidden">
        <img src="/logo_big.svg" alt="SAM" class="h-16 mx-auto mb-4 hidden dark:block">
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
