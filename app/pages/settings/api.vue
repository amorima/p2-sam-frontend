<script setup lang="ts">
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const toast = useToast()
const { role } = useAuth()
const session = useCookie<import('~/composables/useAuth').AuthSession | null>('auth-session')

interface ApiToken {
  _id: string
  token_prefix: string
  label: string
  last_used_at: string | null
  createdAt: string
}

const { data: tokens, refresh, status } = await useFetch<ApiToken[]>('/api/api-tokens', { lazy: true })

const activeToken = computed(() => tokens.value?.[0] ?? null)

// One-time revealed token after generation
const newTokenValue = ref('')
const newTokenCopied = ref(false)
const generating = ref(false)
const revoking = ref(false)

const nif = computed(() => session.value?.nif ?? '')
const userRole = computed(() => role.value ?? '')

const roleBadgeColor = computed(() => {
  const map: Record<string, string> = { patron: 'info', institution: 'success', business: 'warning', admin: 'error' }
  return map[userRole.value] ?? 'neutral'
})

const roleBadgeLabel = computed(() => {
  const map: Record<string, string> = { patron: 'Mecenas', institution: 'Instituição', business: 'Negócio', admin: 'Admin' }
  return map[userRole.value] ?? userRole.value
})

const curlPath = computed(() => {
  const map: Record<string, string> = { patron: 'patrons', institution: 'institutions', business: 'business' }
  const segment = map[userRole.value] ?? 'patrons'
  return `/${segment}/${nif.value}`
})

function relativeDate(d: string | null) {
  if (!d) return 'Nunca'
  return formatDistanceToNow(new Date(d), { addSuffix: true, locale: ptBR })
}

async function generateToken() {
  generating.value = true
  newTokenValue.value = ''
  newTokenCopied.value = false
  try {
    const data = await $fetch<{ token: string }>('/api/api-tokens', { method: 'POST' })
    newTokenValue.value = data.token
    await refresh()
    toast.add({ title: 'Token gerado', description: 'Copie o token agora — não voltará a ser mostrado.', color: 'success', icon: 'i-lucide-key' })
  } catch (err: unknown) {
    const e = err as { data?: { description?: string }, statusMessage?: string }
    toast.add({ title: 'Erro ao gerar token', description: e?.data?.description ?? e?.statusMessage ?? 'Ocorreu um erro.', color: 'error', icon: 'i-lucide-x' })
  } finally {
    generating.value = false
  }
}

async function revokeToken(id: string) {
  revoking.value = true
  try {
    await $fetch(`/api/api-tokens/${id}`, { method: 'DELETE' })
    await refresh()
    toast.add({ title: 'Token revogado', color: 'success', icon: 'i-lucide-check' })
  } catch (err: unknown) {
    const e = err as { data?: { description?: string }, statusMessage?: string }
    toast.add({ title: 'Erro ao revogar', description: e?.data?.description ?? e?.statusMessage, color: 'error', icon: 'i-lucide-x' })
  } finally {
    revoking.value = false
  }
}

async function copyNewToken() {
  if (!newTokenValue.value) return
  await navigator.clipboard.writeText(newTokenValue.value).catch(() => {})
  newTokenCopied.value = true
  toast.add({ title: 'Token copiado!', color: 'success', icon: 'i-lucide-check', duration: 2000 })
}

async function copyCurl() {
  const example = `curl -H "Authorization: Bearer <token>" \\\n  https://apisam.netdw.tech${curlPath.value}`
  await navigator.clipboard.writeText(example).catch(() => {})
  toast.add({ title: 'Exemplo copiado', color: 'success', icon: 'i-lucide-check', duration: 2000 })
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- One-time token reveal -->
    <div v-if="newTokenValue" class="rounded-xl border-2 border-success/40 bg-success/5 p-4 sm:p-6 space-y-4">
      <div class="flex flex-wrap items-center gap-2">
        <UIcon name="i-lucide-shield-check" class="size-5 text-success shrink-0" />
        <p class="font-semibold text-highlighted">
          Token gerado — copie agora
        </p>
        <UBadge color="error" variant="subtle" size="sm">
          Mostrado apenas uma vez
        </UBadge>
      </div>
      <p class="text-sm text-muted">
        Este token não voltará a ser visível. Guarde-o num local seguro antes de fechar esta secção.
      </p>
      <div class="flex items-center gap-2 min-w-0">
        <div class="flex-1 min-w-0 font-mono text-xs bg-default border border-default rounded-lg px-3 py-2.5 overflow-x-auto whitespace-nowrap select-all">
          {{ newTokenValue }}
        </div>
        <UButton
          :icon="newTokenCopied ? 'i-lucide-check' : 'i-lucide-copy'"
          :color="newTokenCopied ? 'success' : 'neutral'"
          variant="outline"
          size="sm"
          class="shrink-0"
          @click="copyNewToken"
        />
      </div>
      <UButton
        label="Já copiei, dispensar"
        color="neutral"
        variant="ghost"
        size="sm"
        icon="i-lucide-x"
        @click="newTokenValue = ''"
      />
    </div>

    <!-- Token status card -->
    <UPageCard variant="subtle">
      <template #header>
        <div class="flex flex-wrap items-center gap-2">
          <span class="font-semibold text-base">Token Permanente de API</span>
          <UBadge :color="(roleBadgeColor as any)" variant="subtle" size="sm">
            {{ roleBadgeLabel }}
          </UBadge>
        </div>
        <p class="text-sm text-muted mt-1">
          Identificador: <span class="font-mono">{{ nif }}</span>
        </p>
      </template>

      <div v-if="status === 'idle' || status === 'pending'" class="py-6 flex items-center gap-2 text-muted">
        <UIcon name="i-lucide-loader-circle" class="size-4 animate-spin" />
        <span class="text-sm">A carregar...</span>
      </div>

      <template v-else>
        <!-- Active token -->
        <div v-if="activeToken" class="space-y-4">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div class="space-y-2 min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <UIcon name="i-lucide-key" class="size-4 text-success shrink-0" />
                <span class="font-mono text-sm font-semibold text-highlighted">{{ activeToken.token_prefix }}...</span>
                <UBadge color="success" variant="soft" size="sm">
                  Ativo
                </UBadge>
              </div>
              <div class="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted">
                <span>Criado {{ relativeDate(activeToken.createdAt) }}</span>
                <span>Último uso: {{ relativeDate(activeToken.last_used_at) }}</span>
              </div>
            </div>
            <UButton
              label="Revogar"
              icon="i-lucide-trash-2"
              color="error"
              variant="subtle"
              size="sm"
              :loading="revoking"
              @click="revokeToken(activeToken._id)"
            />
          </div>
          <USeparator />
          <div class="flex flex-wrap items-center gap-3">
            <UButton
              label="Regenerar token"
              icon="i-lucide-refresh-cw"
              color="primary"
              variant="soft"
              size="sm"
              :loading="generating"
              @click="generateToken"
            />
            <p class="text-xs text-muted">
              O token atual será imediatamente revogado.
            </p>
          </div>
        </div>

        <!-- No token -->
        <div v-else class="py-6 flex flex-col items-center text-center gap-4">
          <div class="flex size-12 items-center justify-center rounded-full bg-elevated">
            <UIcon name="i-lucide-key" class="size-6 text-muted" />
          </div>
          <div>
            <p class="font-medium text-highlighted">
              Sem token ativo
            </p>
            <p class="text-sm text-muted mt-1">
              Gere um token para aceder à API programaticamente.
            </p>
          </div>
          <UButton
            label="Gerar token"
            icon="i-lucide-plus"
            color="primary"
            :loading="generating"
            @click="generateToken"
          />
        </div>
      </template>
    </UPageCard>

    <!-- Info alert -->
    <UAlert
      icon="i-lucide-info"
      color="info"
      variant="subtle"
      title="Tokens permanentes"
      description="Ao contrário dos tokens de sessão JWT, este token não expira automaticamente. Permanece válido até ser revogado manualmente. Trate-o como uma password: não o partilhe nem o inclua em código público."
    />

    <!-- How to use -->
    <UPageCard title="Como usar" description="Inclua o token no cabeçalho de cada pedido à API." variant="subtle">
      <div class="mt-4 space-y-3">
        <div class="rounded-lg overflow-hidden border border-zinc-700 dark:border-zinc-600">
          <div class="flex items-center justify-between px-4 py-2 bg-zinc-800 dark:bg-zinc-900">
            <span class="text-xs text-zinc-400 font-mono">bash</span>
            <UButton
              icon="i-lucide-copy"
              color="neutral"
              variant="ghost"
              size="xs"
              class="text-zinc-400 hover:text-white"
              @click="copyCurl"
            />
          </div>
          <pre class="bg-zinc-900 dark:bg-zinc-950 p-4 text-xs text-zinc-100 overflow-x-auto font-mono leading-relaxed whitespace-pre"><code>curl -H "Authorization: Bearer &lt;token&gt;" \
  https://apisam.netdw.tech{{ curlPath }}</code></pre>
        </div>
        <p class="text-sm text-muted">
          Para referência completa de todos os endpoints, consulte a
          <ULink to="/docs/api" class="text-primary hover:underline underline-offset-2">Documentação da API</ULink>.
        </p>
      </div>
    </UPageCard>
  </div>
</template>
