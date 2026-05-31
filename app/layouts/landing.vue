<template>
  <div class="min-h-dvh bg-default flex flex-col">
    <header class="sticky top-0 z-50 border-b border-default/60 bg-default/80 backdrop-blur-xl">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <NuxtLink to="/" class="flex items-center gap-3 group">
            <img src="/logo_big.svg" alt="SAM" class="h-8 transition-opacity group-hover:opacity-75">
            <div class="hidden sm:flex flex-col leading-none gap-0.5">
              <span class="text-sm font-bold text-highlighted tracking-tight">SAM</span>
              <span class="text-xs text-muted">Vila do Conde</span>
            </div>
          </NuxtLink>

          <nav class="flex items-center gap-1">
            <UColorModeButton color="neutral" variant="ghost" />
            <UButton
              label="Entrar"
              variant="ghost"
              color="neutral"
              to="/login"
              class="hidden sm:flex"
            />
            <UButton
              label="Criar conta"
              color="primary"
              to="/register"
            />
          </nav>
        </div>
      </div>
    </header>

    <main class="flex-1">
      <slot />
    </main>

    <footer class="border-t border-default bg-elevated/30">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div class="flex flex-col sm:flex-row items-center justify-between gap-5">
          <div class="flex items-center gap-3">
            <img src="/logo_big.svg" alt="SAM" class="h-6 opacity-50">
            <p class="text-sm text-muted">
              Sistema de Apoio Municipal
            </p>
          </div>
          <div class="flex items-center gap-5 text-sm">
            <NuxtLink to="/painel" class="text-muted hover:text-highlighted transition-colors">
              Painel público
            </NuxtLink>
            <NuxtLink to="/login" class="text-muted hover:text-highlighted transition-colors">
              Entrar
            </NuxtLink>
            <NuxtLink to="/register" class="text-muted hover:text-highlighted transition-colors">
              Registar
            </NuxtLink>
          </div>
        </div>
        <div class="mt-8 pt-6 border-t border-default text-center">
          <p class="text-xs text-muted">
            © 2026 Câmara Municipal de Vila do Conde · Plataforma oficial de apoio e solidariedade municipal
          </p>
        </div>
      </div>
    </footer>
  </div>
</template>
