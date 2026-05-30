<script setup lang="ts">
import * as z from 'zod'
import type { FormError, FormSubmitEvent } from '@nuxt/ui'
import type { AuthSession } from '~/composables/useAuth'

const toast = useToast()
const session = useCookie<AuthSession | null>('auth-session')
const { logout } = useAuth()

const passwordSchema = z.object({
  current: z.string().min(8, 'Tem de ter pelo menos 8 caracteres'),
  new: z.string()
    .min(8, 'Tem de ter pelo menos 8 caracteres')
    .regex(/[A-Z]/, 'Tem de conter uma maiúscula')
    .regex(/[a-z]/, 'Tem de conter uma minúscula')
    .regex(/[0-9]/, 'Tem de conter um número')
    .regex(/[!@#$%^&*]/, 'Tem de conter um caractere especial (!@#$%^&*)')
})

type PasswordSchema = z.output<typeof passwordSchema>

const password = reactive<Partial<PasswordSchema>>({ current: '', new: '' })
const savingPassword = ref(false)

const validate = (state: Partial<PasswordSchema>): FormError[] => {
  const errors: FormError[] = []
  if (state.current && state.new && state.current === state.new) {
    errors.push({ name: 'new', message: 'As palavras-passe têm de ser diferentes' })
  }
  return errors
}

async function onSubmit(event: FormSubmitEvent<PasswordSchema>) {
  savingPassword.value = true
  try {
    await $fetch('/api/auth/change-password', {
      method: 'PATCH',
      body: { currentPassword: event.data.current, newPassword: event.data.new }
    })
    toast.add({ title: 'Palavra-passe atualizada', icon: 'i-lucide-check', color: 'success' })
    password.current = ''
    password.new = ''
  } catch (err: unknown) {
    const e = err as { statusMessage?: string, data?: { description?: string, errors?: Array<Record<string, string>> } }
    const detail = e?.data?.errors?.[0] ? Object.values(e.data.errors[0])[0] : undefined
    toast.add({
      title: 'Erro',
      description: detail ?? e?.data?.description ?? e?.statusMessage ?? 'Não foi possível alterar a palavra-passe.',
      icon: 'i-lucide-x',
      color: 'error'
    })
  } finally {
    savingPassword.value = false
  }
}

// Account deletion
const deleteOpen = ref(false)
const deleting = ref(false)

async function confirmDelete() {
  if (!session.value?.nif) return
  deleting.value = true
  try {
    await $fetch('/api/account', { method: 'DELETE' })
    toast.add({ title: 'Conta eliminada', icon: 'i-lucide-check', color: 'success' })
    deleteOpen.value = false
    await logout()
  } catch (err: unknown) {
    const e = err as { statusMessage?: string, data?: { description?: string } }
    toast.add({
      title: 'Erro ao eliminar',
      description: e?.data?.description ?? e?.statusMessage ?? 'Não foi possível eliminar a conta.',
      icon: 'i-lucide-x',
      color: 'error'
    })
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <UPageCard
    title="Palavra-passe"
    description="Confirma a tua palavra-passe atual antes de definires uma nova."
    variant="subtle"
  >
    <UForm
      :schema="passwordSchema"
      :state="password"
      :validate="validate"
      class="flex flex-col gap-4 max-w-xs"
      @submit="onSubmit"
    >
      <UFormField name="current">
        <UInput
          v-model="password.current"
          type="password"
          placeholder="Palavra-passe atual"
          class="w-full"
        />
      </UFormField>

      <UFormField name="new">
        <UInput
          v-model="password.new"
          type="password"
          placeholder="Nova palavra-passe"
          class="w-full"
        />
      </UFormField>

      <UButton
        label="Atualizar"
        class="w-fit"
        type="submit"
        :loading="savingPassword"
      />
    </UForm>
  </UPageCard>

  <UPageCard
    title="Conta"
    description="Já não queres usar o nosso serviço? Podes eliminar a tua conta aqui. Esta ação não pode ser revertida. Todas as informações associadas a esta conta serão eliminadas permanentemente."
    class="bg-linear-to-tl from-error/10 from-5% to-default"
  >
    <template #footer>
      <UButton label="Eliminar conta" color="error" @click="deleteOpen = true" />
    </template>
  </UPageCard>

  <UModal v-model:open="deleteOpen" title="Eliminar conta" description="Esta ação é permanente e não pode ser revertida.">
    <template #body>
      <div class="space-y-4">
        <UAlert
          icon="i-lucide-alert-triangle"
          color="error"
          variant="subtle"
          title="Tem a certeza?"
          description="A sua conta e os dados associados serão eliminados permanentemente."
        />
        <div class="flex justify-end gap-2">
          <UButton
            label="Cancelar"
            color="neutral"
            variant="subtle"
            @click="deleteOpen = false"
          />
          <UButton
            label="Eliminar definitivamente"
            color="error"
            :loading="deleting"
            @click="confirmDelete"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
