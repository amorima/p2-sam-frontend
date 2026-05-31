<script setup lang="ts">
import type { CustomerKind, CustomerDetail } from '~/types'
import type { AuthSession } from '~/composables/useAuth'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const kind = computed(() => String(route.params.kind) as CustomerKind)
const id = computed(() => String(route.params.id))

const KIND_LABEL: Record<CustomerKind, string> = {
  patron: 'Mecenas',
  business: 'Negócio',
  institution: 'Instituição',
  citizen: 'Cidadão'
}

const KIND_ICON: Record<CustomerKind, string> = {
  patron: 'i-lucide-hand-coins',
  business: 'i-lucide-briefcase',
  institution: 'i-lucide-clipboard-list',
  citizen: 'i-lucide-user'
}

const session = useCookie<AuthSession | null>('auth-session')
const authHeader = computed(() =>
  session.value?.accessToken
    ? { authorization: `Bearer ${session.value.accessToken}` }
    : undefined
)

const { isAdmin, role } = useAuth()
const isOwnProfile = computed(() => session.value?.nif === id.value)
const canAdminister = computed(() => isAdmin.value && !isOwnProfile.value)

const ownSectionMap: Record<string, string> = {
  patron: '/mecenas',
  institution: '/instituicoes',
  business: '/negocios'
}
const ownSection = computed(() => role.value ? (ownSectionMap[role.value] ?? '/') : '/')

const { data: user, status, refresh, error } = await useFetch<CustomerDetail>(
  () => `/api/customers/${kind.value}/${encodeURIComponent(id.value)}`,
  { lazy: true }
)

watch(error, (err) => {
  if (!err) return
  const code = (err as { statusCode?: number })?.statusCode
  if ((code === 401 || code === 403) && isOwnProfile.value && !isAdmin.value) {
    navigateTo(ownSection.value)
  }
})

const fullAddress = computed(() => {
  const loc = user.value?.locations?.[0]
  if (!loc) return null
  return [loc.rua, loc.n_porta, loc.freguesia, loc.concelho, loc.distrito, loc.pais]
    .filter(Boolean)
    .join(', ')
})

async function deleteUser() {
  if (!user.value) return
  if (!confirm(`Eliminar ${user.value.name}? Esta ação não pode ser anulada.`)) return

  try {
    await $fetch(`/api/customers/${kind.value}/${encodeURIComponent(id.value)}`, {
      method: 'DELETE',
      headers: authHeader.value
    })
    toast.add({ title: 'Utilizador eliminado', color: 'success' })
    router.push('/customers')
  } catch (err: unknown) {
    const e = err as { statusMessage?: string, data?: { description?: string } }
    toast.add({
      title: 'Erro ao eliminar',
      description: e?.data?.description ?? e?.statusMessage,
      color: 'error'
    })
  }
}

const blockModalOpen = ref(false)

async function applyBlock(blocked: boolean, reason: string | null) {
  try {
    await $fetch(`/api/customers/${kind.value}/${encodeURIComponent(id.value)}/block`, {
      method: 'PATCH',
      body: { blocked: blocked ? 1 : 0, reason },
      headers: authHeader.value
    })
    toast.add({
      title: blocked ? 'Utilizador bloqueado' : 'Utilizador desbloqueado',
      color: 'success'
    })
    await refresh()
  } catch (err: unknown) {
    const e = err as { statusMessage?: string, data?: { description?: string } }
    toast.add({
      title: 'Erro a atualizar bloqueio',
      description: e?.data?.description ?? e?.statusMessage,
      color: 'error'
    })
  }
}

async function toggleBlocked() {
  if (!user.value) return
  if (user.value.blocked) {
    await applyBlock(false, null)
  } else {
    blockModalOpen.value = true
  }
}

function onBlockConfirm(reason: string) {
  applyBlock(true, reason)
}

function copyToClipboard(value: string, label: string) {
  navigator.clipboard.writeText(value)
  toast.add({ title: `${label} copiado`, description: value })
}
</script>

<template>
  <UDashboardPanel id="utilizador-detail">
    <template #header>
      <UDashboardNavbar :title="user?.name ?? 'Utilizador'">
        <template #leading>
          <UDashboardSidebarCollapse />
          <UButton
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="ghost"
            to="/customers"
            class="hidden lg:flex"
          />
        </template>
        <template #right>
          <UButton
            icon="i-lucide-refresh-cw"
            color="neutral"
            variant="ghost"
            :loading="status === 'pending'"
            @click="refresh()"
          />
          <UButton
            v-if="user && canAdminister"
            :icon="user.blocked ? 'i-lucide-shield-check' : 'i-lucide-shield-off'"
            :color="user.blocked ? 'success' : 'warning'"
            variant="subtle"
            :label="user.blocked ? 'Desbloquear' : 'Bloquear'"
            @click="toggleBlocked"
          />
          <UButton
            v-if="user && canAdminister"
            icon="i-lucide-trash"
            color="error"
            variant="subtle"
            label="Eliminar"
            @click="deleteUser"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div v-if="status === 'idle' || status === 'pending'" class="flex items-center justify-center py-16 text-muted gap-2">
        <UIcon name="i-lucide-loader-circle" class="animate-spin" />
        A carregar utilizador…
      </div>

      <div v-else-if="error || !user" class="flex flex-col items-center justify-center py-16 text-muted gap-3">
        <UIcon name="i-lucide-circle-alert" class="text-error text-3xl" />
        <p>Não foi possível carregar este utilizador.</p>
        <UButton
          color="neutral"
          variant="subtle"
          :to="isAdmin ? '/customers' : ownSection"
          :label="isAdmin ? 'Voltar à lista' : 'Voltar à minha área'"
        />
      </div>

      <div v-else class="grid gap-6 lg:grid-cols-3">
        <!-- Identity card -->
        <UCard class="lg:col-span-1">
          <div class="flex flex-col items-center text-center gap-3">
            <UAvatar :src="user.avatar?.src" :alt="user.name" size="3xl" />
            <div>
              <h2 class="text-xl font-bold">
                {{ user.name }}
              </h2>
              <p class="text-sm text-muted">
                {{ user.email }}
              </p>
            </div>
            <div class="flex flex-wrap gap-2 justify-center">
              <UBadge variant="subtle" color="neutral">
                <template #leading>
                  <UIcon :name="KIND_ICON[user.kind]" />
                </template>
                {{ KIND_LABEL[user.kind] }}
              </UBadge>
              <UBadge
                :color="user.blocked ? 'error' : 'success'"
                variant="subtle"
              >
                {{ user.blocked ? 'Bloqueado' : 'Ativo' }}
              </UBadge>
            </div>
          </div>
        </UCard>

        <!-- Details -->
        <UCard class="lg:col-span-2">
          <template #header>
            <h3 class="text-base font-semibold">
              Detalhes
            </h3>
          </template>

          <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
            <div>
              <dt class="text-muted text-xs uppercase font-semibold mb-1">
                {{ user.kind === 'citizen' ? 'Contacto' : 'NIF/NIPC' }}
              </dt>
              <dd class="flex items-center gap-2">
                <span class="font-mono">{{ user.id }}</span>
                <UButton
                  icon="i-lucide-copy"
                  size="xs"
                  color="neutral"
                  variant="ghost"
                  @click="copyToClipboard(String(user.id), user.kind === 'citizen' ? 'Contacto' : 'NIF')"
                />
              </dd>
            </div>

            <div v-if="user.kind !== 'citizen'">
              <dt class="text-muted text-xs uppercase font-semibold mb-1">
                Email de login
              </dt>
              <dd>{{ user.email || '—' }}</dd>
            </div>

            <div v-if="user.iban">
              <dt class="text-muted text-xs uppercase font-semibold mb-1">
                IBAN
              </dt>
              <dd class="font-mono text-xs">
                {{ user.iban }}
              </dd>
            </div>

            <div v-if="user.kind === 'citizen'">
              <dt class="text-muted text-xs uppercase font-semibold mb-1">
                RGPD
              </dt>
              <dd>{{ user.rgpd ? 'Aceite' : 'Não aceite' }}</dd>
            </div>

            <div v-if="user.blocked && user.reason" class="sm:col-span-2">
              <dt class="text-muted text-xs uppercase font-semibold mb-1">
                Motivo do bloqueio
              </dt>
              <dd class="text-error">
                {{ user.reason }}
              </dd>
            </div>

            <div v-if="fullAddress" class="sm:col-span-2">
              <dt class="text-muted text-xs uppercase font-semibold mb-1">
                Morada
              </dt>
              <dd>{{ fullAddress }}</dd>
            </div>

            <div v-if="user.geo_latitude && user.geo_longitude">
              <dt class="text-muted text-xs uppercase font-semibold mb-1">
                Coordenadas
              </dt>
              <dd class="font-mono text-xs">
                {{ user.geo_latitude.toFixed(5) }}, {{ user.geo_longitude.toFixed(5) }}
              </dd>
            </div>

            <div v-if="user.url_comprovativo_estatuto" class="sm:col-span-2">
              <dt class="text-muted text-xs uppercase font-semibold mb-1">
                Estatuto
              </dt>
              <dd>
                <UButton
                  variant="link"
                  trailing-icon="i-lucide-external-link"
                  :to="`/api/download/files?nome=${encodeURIComponent(user.url_comprovativo_estatuto.split('/').pop() ?? '')}`"
                  target="_blank"
                  label="Abrir documento"
                />
              </dd>
            </div>
          </dl>
        </UCard>

        <!-- Contacts -->
        <UCard v-if="user.contacts && user.contacts.length" class="lg:col-span-3">
          <template #header>
            <h3 class="text-base font-semibold">
              Contactos
            </h3>
          </template>
          <ul class="divide-y divide-default">
            <li v-for="(c, idx) in user.contacts" :key="idx" class="py-2 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p class="font-medium">
                  {{ c.nome_contacto || 'Sem nome' }}
                </p>
                <p class="text-xs text-muted">
                  {{ c.descricao || '—' }}
                </p>
              </div>
              <div class="flex items-center gap-2">
                <span class="font-mono text-sm">{{ c.contacto }}</span>
                <UButton
                  icon="i-lucide-copy"
                  size="xs"
                  color="neutral"
                  variant="ghost"
                  @click="copyToClipboard(c.contacto || '', 'Contacto')"
                />
              </div>
            </li>
          </ul>
        </UCard>
      </div>

      <CustomersBlockReasonModal
        v-model:open="blockModalOpen"
        :count="1"
        :subject="user?.name ?? null"
        :default-reason="user?.reason ?? null"
        @confirm="onBlockConfirm"
      />
    </template>
  </UDashboardPanel>
</template>
