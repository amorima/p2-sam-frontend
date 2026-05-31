<script setup lang="ts">
import type { AuthSession, UserRole } from '~/composables/useAuth'

definePageMeta({ layout: 'landing' })

const session = useCookie<AuthSession | null>('auth-session')
if (session.value) {
  const redirectMap: Record<UserRole, string> = {
    admin: '/home',
    patron: '/mecenas',
    institution: '/instituicoes',
    business: '/negocios'
  }
  await navigateTo(redirectMap[session.value.role] ?? '/home')
}
</script>

<template>
  <div>
    <!-- ─── Hero ─────────────────────────────────────────────────────────── -->
    <section class="relative overflow-hidden pt-20 pb-28 lg:pt-28 lg:pb-36">
      <div class="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div class="absolute -top-40 right-0 h-[600px] w-[600px] translate-x-1/3 rounded-full bg-primary/8 blur-[120px]" />
        <div class="absolute bottom-0 left-0 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-primary/5 blur-[100px]" />
      </div>

      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="grid items-center gap-16 lg:grid-cols-2 lg:gap-20">
          <!-- Left: copy -->
          <div>
            <UBadge color="primary" variant="soft" class="mb-7 gap-1.5 px-3 py-1">
              <UIcon name="i-lucide-map-pin" class="size-3" />
              Câmara Municipal de Vila do Conde
            </UBadge>

            <h1 class="text-5xl font-bold leading-[1.08] tracking-tight text-highlighted sm:text-6xl">
              Ligamos quem<br>quer ajudar<br>
              <span class="text-primary">a quem precisa.</span>
            </h1>

            <p class="mt-6 max-w-md text-lg leading-relaxed text-muted">
              O SAM centraliza doações, pedidos de apoio e parcerias com negócios
              locais numa plataforma única ao serviço de Vila do Conde.
            </p>

            <div class="mt-10 flex flex-wrap gap-3">
              <UButton
                to="/register"
                size="xl"
                label="Criar conta"
                icon="i-lucide-user-plus"
                trailing-icon="i-lucide-arrow-right"
              />
              <UButton
                to="/login"
                size="xl"
                color="neutral"
                variant="outline"
                label="Iniciar sessão"
                icon="i-lucide-log-in"
              />
            </div>

            <p class="mt-5 text-sm text-muted">
              Gratuito · Aberto a mecenas, instituições e negócios locais
            </p>
          </div>

          <!-- Right: dashboard preview -->
          <div class="relative lg:mt-0">
            <div class="absolute -top-3 -right-3 z-10">
              <div class="flex items-center gap-2 rounded-xl border border-default bg-elevated px-3 py-2 shadow-lg">
                <span class="relative flex size-2">
                  <span class="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-75" />
                  <span class="relative inline-flex size-2 rounded-full bg-success" />
                </span>
                <p class="text-xs font-medium text-highlighted">
                  Sistema ativo
                </p>
              </div>
            </div>

            <div class="overflow-hidden rounded-2xl border border-default bg-elevated shadow-2xl shadow-black/10 ring-1 ring-black/5 dark:ring-white/5">
              <!-- Browser chrome -->
              <div class="flex items-center gap-3 border-b border-default bg-default/60 px-4 py-3">
                <div class="flex gap-1.5">
                  <div class="size-2.5 rounded-full bg-red-400/80" />
                  <div class="size-2.5 rounded-full bg-yellow-400/80" />
                  <div class="size-2.5 rounded-full bg-green-400/80" />
                </div>
                <div class="flex-1">
                  <div class="max-w-[180px] rounded bg-elevated px-3 py-1 font-mono text-xs text-muted">
                    sam.viladoconde.pt
                  </div>
                </div>
              </div>

              <!-- Dashboard content -->
              <div class="space-y-3 bg-default/40 p-4">
                <!-- Stats row -->
                <div class="grid grid-cols-3 gap-2">
                  <div class="rounded-xl border border-default bg-elevated p-3">
                    <p class="text-xs text-muted">
                      Doações
                    </p>
                    <p class="mt-1 text-2xl font-bold text-highlighted">
                      147
                    </p>
                    <p class="mt-0.5 text-xs text-success">
                      ↑ 12 este mês
                    </p>
                  </div>
                  <div class="rounded-xl border border-default bg-elevated p-3">
                    <p class="text-xs text-muted">
                      Pedidos
                    </p>
                    <p class="mt-1 text-2xl font-bold text-highlighted">
                      23
                    </p>
                    <p class="mt-0.5 text-xs text-warning">
                      ● 8 pendentes
                    </p>
                  </div>
                  <div class="rounded-xl border border-default bg-elevated p-3">
                    <p class="text-xs text-muted">
                      Mecenas
                    </p>
                    <p class="mt-1 text-2xl font-bold text-highlighted">
                      41
                    </p>
                    <p class="mt-0.5 text-xs text-primary">
                      ↑ 5 novos
                    </p>
                  </div>
                </div>

                <!-- Activity list -->
                <div class="overflow-hidden rounded-xl border border-default bg-elevated divide-y divide-default">
                  <div class="flex items-center gap-3 px-3 py-2.5">
                    <div class="flex size-8 shrink-0 items-center justify-center rounded-full bg-success/15">
                      <div class="size-2 rounded-full bg-success" />
                    </div>
                    <div class="min-w-0 flex-1">
                      <p class="truncate text-xs font-semibold text-highlighted">
                        Mecenas Silva & Filhos
                      </p>
                      <p class="truncate text-xs text-muted">
                        Doação em numerário · €250
                      </p>
                    </div>
                    <UBadge color="success" variant="soft" size="sm">
                      Aceite
                    </UBadge>
                  </div>
                  <div class="flex items-center gap-3 px-3 py-2.5">
                    <div class="flex size-8 shrink-0 items-center justify-center rounded-full bg-info/15">
                      <div class="size-2 rounded-full bg-info" />
                    </div>
                    <div class="min-w-0 flex-1">
                      <p class="truncate text-xs font-semibold text-highlighted">
                        Cruz Vermelha VC
                      </p>
                      <p class="truncate text-xs text-muted">
                        Pedido de bens aprovado
                      </p>
                    </div>
                    <UBadge color="info" variant="soft" size="sm">
                      Aprovado
                    </UBadge>
                  </div>
                  <div class="flex items-center gap-3 px-3 py-2.5">
                    <div class="flex size-8 shrink-0 items-center justify-center rounded-full bg-warning/15">
                      <div class="size-2 rounded-full bg-warning" />
                    </div>
                    <div class="min-w-0 flex-1">
                      <p class="truncate text-xs font-semibold text-highlighted">
                        Costa & Associados
                      </p>
                      <p class="truncate text-xs text-muted">
                        Parceria comercial registada
                      </p>
                    </div>
                    <UBadge color="warning" variant="soft" size="sm">
                      Novo
                    </UBadge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ─── Roles ─────────────────────────────────────────────────────────── -->
    <section class="border-t border-default py-20">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mb-14 text-center">
          <p class="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
            Quem pode aderir
          </p>
          <h2 class="text-3xl font-bold text-highlighted sm:text-4xl">
            Uma plataforma para toda a comunidade
          </h2>
          <p class="mx-auto mt-4 max-w-xl text-lg text-muted">
            Seja mecenas, instituição ou negócio local — o SAM tem um papel
            para cada entidade do município.
          </p>
        </div>

        <div class="grid gap-6 md:grid-cols-3">
          <!-- Mecenas -->
          <div class="group rounded-2xl border border-default bg-elevated/40 p-7 transition-all hover:border-success/30 hover:bg-elevated">
            <div class="mb-5 flex size-12 items-center justify-center rounded-xl bg-success/15">
              <UIcon name="i-lucide-hand-coins" class="size-6 text-success" />
            </div>
            <h3 class="mb-2 text-lg font-semibold text-highlighted">
              Mecenas
            </h3>
            <p class="mb-5 text-sm leading-relaxed text-muted">
              Empresas e cidadãos que querem apoiar a comunidade através de
              doações em numerário ou bens essenciais.
            </p>
            <ul class="space-y-2.5">
              <li class="flex items-center gap-2 text-sm text-muted">
                <UIcon name="i-lucide-check" class="size-4 shrink-0 text-success" />
                Doações em numerário por IBAN ou MB
              </li>
              <li class="flex items-center gap-2 text-sm text-muted">
                <UIcon name="i-lucide-check" class="size-4 shrink-0 text-success" />
                Doações em espécie via painéis
              </li>
              <li class="flex items-center gap-2 text-sm text-muted">
                <UIcon name="i-lucide-check" class="size-4 shrink-0 text-success" />
                Histórico completo de contribuições
              </li>
            </ul>
          </div>

          <!-- Institutions (highlighted) -->
          <div class="relative rounded-2xl border border-primary/25 bg-primary/5 p-7 transition-all hover:border-primary/40 hover:bg-primary/8">
            <div class="absolute right-5 top-5">
              <UBadge color="primary" variant="soft" size="sm">
                Mais comum
              </UBadge>
            </div>
            <div class="mb-5 flex size-12 items-center justify-center rounded-xl bg-primary/20">
              <UIcon name="i-lucide-building-2" class="size-6 text-primary" />
            </div>
            <h3 class="mb-2 text-lg font-semibold text-highlighted">
              Instituições
            </h3>
            <p class="mb-5 text-sm leading-relaxed text-muted">
              IPSS, associações e organizações sem fins lucrativos que necessitam
              de apoio para a sua atividade social e comunitária.
            </p>
            <ul class="space-y-2.5">
              <li class="flex items-center gap-2 text-sm text-muted">
                <UIcon name="i-lucide-check" class="size-4 shrink-0 text-primary" />
                Pedidos de bens e serviços
              </li>
              <li class="flex items-center gap-2 text-sm text-muted">
                <UIcon name="i-lucide-check" class="size-4 shrink-0 text-primary" />
                Acesso a painéis municipais
              </li>
              <li class="flex items-center gap-2 text-sm text-muted">
                <UIcon name="i-lucide-check" class="size-4 shrink-0 text-primary" />
                Notificações em tempo real
              </li>
            </ul>
          </div>

          <!-- Business -->
          <div class="group rounded-2xl border border-default bg-elevated/40 p-7 transition-all hover:border-warning/30 hover:bg-elevated">
            <div class="mb-5 flex size-12 items-center justify-center rounded-xl bg-warning/15">
              <UIcon name="i-lucide-briefcase" class="size-6 text-warning" />
            </div>
            <h3 class="mb-2 text-lg font-semibold text-highlighted">
              Negócios Locais
            </h3>
            <p class="mb-5 text-sm leading-relaxed text-muted">
              Empresas e prestadores de serviços que querem apoiar a comunidade
              através de parcerias e serviços pro bono.
            </p>
            <ul class="space-y-2.5">
              <li class="flex items-center gap-2 text-sm text-muted">
                <UIcon name="i-lucide-check" class="size-4 shrink-0 text-warning" />
                Catálogo de serviços e bens
              </li>
              <li class="flex items-center gap-2 text-sm text-muted">
                <UIcon name="i-lucide-check" class="size-4 shrink-0 text-warning" />
                Parcerias com instituições
              </li>
              <li class="flex items-center gap-2 text-sm text-muted">
                <UIcon name="i-lucide-check" class="size-4 shrink-0 text-warning" />
                Visibilidade no município
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- ─── How it works ──────────────────────────────────────────────────── -->
    <section class="border-t border-default bg-elevated/25 py-20">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mb-14 text-center">
          <p class="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
            Como funciona
          </p>
          <h2 class="text-3xl font-bold text-highlighted sm:text-4xl">
            Pronto em menos de 5 minutos
          </h2>
        </div>

        <div class="relative grid gap-10 md:grid-cols-3 md:gap-6">
          <div class="hidden md:block absolute top-8 left-[calc(33.3%+1rem)] right-[calc(33.3%+1rem)] h-px border-t border-dashed border-default" />

          <div class="flex flex-col items-center text-center md:items-center">
            <div class="mb-6 flex size-16 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/25 text-2xl font-bold">
              1
            </div>
            <h3 class="mb-2 text-lg font-semibold text-highlighted">
              Registe a sua entidade
            </h3>
            <p class="text-sm leading-relaxed text-muted">
              Escolha o tipo de conta e preencha os dados básicos da sua entidade.
              O processo é simples e leva apenas alguns minutos.
            </p>
          </div>

          <div class="flex flex-col items-center text-center">
            <div class="mb-6 flex size-16 items-center justify-center rounded-2xl border-2 border-primary/30 bg-elevated text-primary text-2xl font-bold">
              2
            </div>
            <h3 class="mb-2 text-lg font-semibold text-highlighted">
              Aguarde aprovação
            </h3>
            <p class="text-sm leading-relaxed text-muted">
              A câmara municipal verifica os seus dados e aprova o acesso à
              plataforma habitualmente em 24 horas.
            </p>
          </div>

          <div class="flex flex-col items-center text-center">
            <div class="mb-6 flex size-16 items-center justify-center rounded-2xl border-2 border-primary/30 bg-elevated text-primary text-2xl font-bold">
              3
            </div>
            <h3 class="mb-2 text-lg font-semibold text-highlighted">
              Comece a participar
            </h3>
            <p class="text-sm leading-relaxed text-muted">
              Doe, peça apoio ou ofereça serviços. O SAM gere a correspondência
              e mantém-no informado em tempo real.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- ─── Painel Municipal ───────────────────────────────────────────────── -->
    <section class="border-t border-default py-20">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="overflow-hidden rounded-3xl border border-default bg-elevated/40 p-8 md:p-12 lg:p-14">
          <div class="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <UBadge color="primary" variant="soft" class="mb-5 gap-1.5">
                <UIcon name="i-lucide-map" class="size-3" />
                Painel Municipal
              </UBadge>
              <h2 class="mb-4 text-3xl font-bold text-highlighted sm:text-4xl">
                Solidariedade<br>no terreno
              </h2>
              <p class="mb-6 leading-relaxed text-muted">
                O SAM integra painéis físicos distribuídos pelo município onde qualquer
                cidadão pode depositar ou recolher bens essenciais. Cada painel é
                monitorizado em tempo real e gerido diretamente na plataforma.
              </p>
              <UButton
                to="/painel"
                color="primary"
                variant="subtle"
                label="Ver painel público"
                icon="i-lucide-map-pin"
                trailing-icon="i-lucide-arrow-right"
              />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div class="rounded-xl border border-default bg-default p-5 space-y-2">
                <div class="flex size-9 items-center justify-center rounded-lg bg-primary/15">
                  <UIcon name="i-lucide-package" class="size-5 text-primary" />
                </div>
                <p class="text-sm font-semibold text-highlighted">
                  Bens essenciais
                </p>
                <p class="text-xs leading-relaxed text-muted">
                  Alimentos, roupa e artigos de higiene
                </p>
              </div>
              <div class="rounded-xl border border-default bg-default p-5 space-y-2">
                <div class="flex size-9 items-center justify-center rounded-lg bg-info/15">
                  <UIcon name="i-lucide-wifi" class="size-5 text-info" />
                </div>
                <p class="text-sm font-semibold text-highlighted">
                  Monitorizado
                </p>
                <p class="text-xs leading-relaxed text-muted">
                  Telemetria e estado em tempo real
                </p>
              </div>
              <div class="rounded-xl border border-default bg-default p-5 space-y-2">
                <div class="flex size-9 items-center justify-center rounded-lg bg-success/15">
                  <UIcon name="i-lucide-map-pin" class="size-5 text-success" />
                </div>
                <p class="text-sm font-semibold text-highlighted">
                  Georeferenciado
                </p>
                <p class="text-xs leading-relaxed text-muted">
                  Mapa interativo com localização
                </p>
              </div>
              <div class="rounded-xl border border-default bg-default p-5 space-y-2">
                <div class="flex size-9 items-center justify-center rounded-lg bg-warning/15">
                  <UIcon name="i-lucide-shield-check" class="size-5 text-warning" />
                </div>
                <p class="text-sm font-semibold text-highlighted">
                  Controlado
                </p>
                <p class="text-xs leading-relaxed text-muted">
                  Acesso auditado e rastreado
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ─── Final CTA ─────────────────────────────────────────────────────── -->
    <section class="border-t border-default bg-elevated/25 py-24">
      <div class="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 text-center">
        <div class="mb-6 flex justify-center">
          <img src="/logo_big.svg" alt="SAM" class="h-14 opacity-80">
        </div>
        <h2 class="text-3xl font-bold text-highlighted sm:text-4xl">
          Pronto para fazer a diferença?
        </h2>
        <p class="mx-auto mt-4 max-w-md text-lg text-muted">
          Junte-se ao SAM e ajude a construir uma comunidade mais solidária
          em Vila do Conde.
        </p>
        <div class="mt-10 flex flex-wrap justify-center gap-3">
          <UButton
            to="/register"
            size="xl"
            label="Criar conta gratuita"
            icon="i-lucide-user-plus"
          />
          <UButton
            to="/login"
            size="xl"
            color="neutral"
            variant="outline"
            label="Já tenho conta"
            icon="i-lucide-log-in"
          />
        </div>
      </div>
    </section>
  </div>
</template>
