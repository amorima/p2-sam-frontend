<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { UserRole } from '~/composables/useAuth'

definePageMeta({ layout: 'auth' })

const { login } = useAuth()
const toast = useToast()
const router = useRouter()

const showPassword = ref(false)
const isSubmitting = ref(false)

const schema = z.object({
  nif_nipc: z.string().min(1, 'Campo obrigatório'),
  password: z.string().min(1, 'Password obrigatória')
})
type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({ nif_nipc: '', password: '' })

async function onSubmit(event: FormSubmitEvent<Schema>) {
  isSubmitting.value = true
  try {
    const result = await login(event.data.nif_nipc, event.data.password)
    const redirectMap: Record<UserRole, string> = {
      admin: '/',
      patron: '/mecenas',
      institution: '/instituicoes',
      business: '/negocios'
    }
    toast.add({ title: 'Sessão iniciada', icon: 'i-lucide-check', color: 'success' })
    router.push(redirectMap[result.role])
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
          Introduza as suas credenciais para aceder ao SAM.
        </p>
      </div>
    </template>

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
