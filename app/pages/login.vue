<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { UserRole } from '~/composables/useAuth'

definePageMeta({ layout: 'auth' })

const { login } = useAuth()
const toast = useToast()
const router = useRouter()

const roleOptions: { label: string, value: UserRole, icon: string, description: string }[] = [
  { label: 'Mecenas', value: 'patron', icon: 'i-lucide-hand-coins', description: 'Doador / Patrocinador' },
  { label: 'Instituição', value: 'institution', icon: 'i-lucide-building-2', description: 'Entidade beneficiária' },
  { label: 'Negócio', value: 'business', icon: 'i-lucide-briefcase', description: 'Parceiro comercial' },
  { label: 'Administrador', value: 'admin', icon: 'i-lucide-shield-check', description: 'Acesso total ao sistema' }
]

const selectedRole = ref<UserRole>('patron')
const showPassword = ref(false)
const isSubmitting = ref(false)

const schema = z.object({
  nif_nipc: z.string().min(1, 'Campo obrigatório'),
  password: z.string().min(1, 'Password obrigatória')
})
type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({ nif_nipc: '', password: '' })

watch(selectedRole, () => {
  state.nif_nipc = ''
  state.password = ''
})

async function onSubmit(event: FormSubmitEvent<Schema>) {
  isSubmitting.value = true
  try {
    await login(event.data.nif_nipc, event.data.password, selectedRole.value)
    const redirectMap: Record<UserRole, string> = {
      admin: '/',
      patron: '/mecenas',
      institution: '/instituicoes',
      business: '/negocios'
    }
    toast.add({ title: 'Sessão iniciada', icon: 'i-lucide-check', color: 'success' })
    router.push(redirectMap[selectedRole.value])
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string }, statusMessage?: string }
    toast.add({
      title: 'Erro ao iniciar sessão',
      description: e?.data?.statusMessage ?? e?.statusMessage ?? 'Verifique os seus dados.',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <UCard class="shadow-lg">
    <template #header>
      <div class="space-y-1">
        <h2 class="text-lg font-semibold text-highlighted">
          Iniciar Sessão
        </h2>
        <p class="text-sm text-muted">
          Escolha o seu tipo de acesso e introduza as credenciais.
        </p>
      </div>
    </template>

    <div class="space-y-5">
      <!-- Role selector -->
      <div>
        <p class="text-xs font-medium text-muted uppercase tracking-wide mb-2">
          Tipo de utilizador
        </p>
        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="opt in roleOptions"
            :key="opt.value"
            type="button"
            class="flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-colors focus:outline-none"
            :class="selectedRole === opt.value
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-default bg-elevated/30 text-muted hover:bg-elevated/60'"
            @click="selectedRole = opt.value"
          >
            <UIcon :name="opt.icon" class="size-4 shrink-0" />
            <div class="min-w-0">
              <p class="text-xs font-semibold leading-tight truncate" :class="selectedRole === opt.value ? 'text-primary' : 'text-highlighted'">
                {{ opt.label }}
              </p>
              <p class="text-[10px] text-muted leading-tight truncate">
                {{ opt.description }}
              </p>
            </div>
          </button>
        </div>
      </div>

      <USeparator />

      <!-- Credentials form -->
      <UForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="NIF / NIPC" name="nif_nipc" required>
          <UInput
            v-model="state.nif_nipc"
            placeholder="Ex.: 510123456"
            class="w-full font-mono"
            autocomplete="username"
          />
        </UFormField>

        <UFormField label="Password" name="password" required>
          <UInput
            v-model="state.password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="••••••••"
            class="w-full"
            autocomplete="current-password"
            :ui="{ trailing: 'pe-1' }"
          >
            <template #trailing>
              <UButton
                :icon="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                color="neutral"
                variant="ghost"
                size="sm"
                @click="showPassword = !showPassword"
              />
            </template>
          </UInput>
        </UFormField>

        <UButton
          type="submit"
          label="Entrar"
          icon="i-lucide-log-in"
          color="primary"
          block
          :loading="isSubmitting"
          class="mt-2"
        />
      </UForm>
    </div>

    <template #footer>
      <p class="text-center text-sm text-muted">
        Não tem conta?
        <UButton
          label="Registar-se"
          variant="link"
          color="primary"
          to="/register"
          class="px-1"
        />
      </p>
    </template>
  </UCard>
</template>
