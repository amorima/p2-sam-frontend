<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

const fileRef = ref<HTMLInputElement>()
const userProfile = useUserProfile()
const { isAdmin } = useAuth()
const { name: authName, avatar: authAvatar, updateAvatar } = userProfile

const printReceiptEnabled = ref(true)
const { isAvailable: agentAvailable, selectedPrinter, fetchPrinters, checkAvailability } = usePrintAgent()
const printerItems = ref<{ label: string, value: string }[]>([])
const loadingPrinters = ref(false)

onMounted(async () => {
  const stored = localStorage.getItem('sam_print_receipt_enabled')
  if (stored !== null) printReceiptEnabled.value = stored === 'true'
  selectedPrinter.value = localStorage.getItem('sam_print_receipt_printer') ?? ''
  if (agentAvailable.value) await loadPrinters()
})

watch(agentAvailable, async (val) => {
  if (val) await loadPrinters()
})

async function loadPrinters() {
  loadingPrinters.value = true
  try {
    printerItems.value = (await fetchPrinters()).map(p => ({ label: p, value: p }))
  } catch { /* agent unavailable */ } finally {
    loadingPrinters.value = false
  }
}

function savePrintSetting(val: boolean) {
  localStorage.setItem('sam_print_receipt_enabled', String(val))
}

function onPrinterChange(name: string) {
  localStorage.setItem('sam_print_receipt_printer', name)
}

const profileSchema = z.object({
  name: z.string().min(2, 'Demasiado curto'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  username: z.string().min(2, 'Demasiado curto'),
  avatar: z.string().optional(),
  bio: z.string().optional()
})

type ProfileSchema = z.output<typeof profileSchema>

const profile = reactive<Partial<ProfileSchema>>({
  name: authName.value,
  email: '',
  username: authName.value,
  avatar: authAvatar.value,
  bio: undefined
})

const toast = useToast()

// Sync preview when localStorage loads the stored avatar on mount
watch(authAvatar, (url) => {
  profile.avatar = url
})

async function onSubmit(_event: FormSubmitEvent<ProfileSchema>) {
  toast.add({
    title: 'Sucesso',
    description: 'As tuas definições foram atualizadas.',
    icon: 'i-lucide-check',
    color: 'success'
  })
}

async function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement

  if (!input.files?.length) {
    return
  }

  const file = input.files[0]

  if (!file) {
    return
  }

  const allowedTypes = ['image/jpeg', 'image/gif', 'image/png']
  if (!allowedTypes.includes(file.type)) {
    toast.add({ title: 'Formato inválido', description: 'Apenas JPG, GIF ou PNG são permitidos.', icon: 'i-lucide-x', color: 'error' })
    return
  }

  if (file.size > 1 * 1024 * 1024) {
    toast.add({ title: 'Ficheiro demasiado grande', description: 'O avatar não pode exceder 1 MB.', icon: 'i-lucide-x', color: 'error' })
    return
  }

  // Optimistic preview while uploading
  profile.avatar = URL.createObjectURL(file)

  try {
    const formData = new FormData()
    formData.append('file', file)

    // Entity users go through PATCH /api/auth/avatar so the previous MinIO object
    // is removed and `entidade.profile_pic` is updated atomically server-side.
    // Admin has no entity row, so we keep the legacy upload path for them.
    const uploadUrl = isAdmin.value
      ? `/api/upload/avatar?nome=${encodeURIComponent(file.name)}`
      : `/api/auth/avatar`
    const uploadMethod = isAdmin.value ? 'POST' : 'PATCH'

    const uploadData = await $fetch<{ url: string, fileName: string }>(uploadUrl, {
      method: uploadMethod,
      body: formData
    })

    updateAvatar(uploadData.fileName)

    toast.add({
      title: 'Sucesso',
      description: 'Avatar carregado com sucesso.',
      icon: 'i-lucide-check',
      color: 'success'
    })
  } catch (err) {
    console.error('Upload failed', err)
    profile.avatar = authAvatar.value
    toast.add({
      title: 'Erro',
      description: 'Não foi possível carregar a imagem.',
      icon: 'i-lucide-x',
      color: 'error'
    })
  }
}

function onFileClick() {
  fileRef.value?.click()
}
</script>

<template>
  <UForm
    id="settings"
    :schema="profileSchema"
    :state="profile"
    @submit="onSubmit"
  >
    <UPageCard
      title="Perfil"
      description="Estas informações serão apresentadas publicamente."
      variant="naked"
      orientation="horizontal"
      class="mb-4"
    >
      <UButton
        form="settings"
        label="Guardar alterações"
        color="neutral"
        type="submit"
        class="w-fit lg:ms-auto"
      />
    </UPageCard>

    <UPageCard variant="subtle">
      <UFormField
        name="name"
        label="Nome"
        description="Vai aparecer em recibos, faturas e outras comunicações."
        required
        class="flex max-sm:flex-col justify-between items-start gap-4"
      >
        <UInput v-model="profile.name" autocomplete="off" />
      </UFormField>
      <USeparator />
      <UFormField
        name="email"
        label="Email"
        description="Usado para iniciar sessão, para recibos por email e atualizações do produto."
        required
        class="flex max-sm:flex-col justify-between items-start gap-4"
      >
        <UInput v-model="profile.email" type="email" autocomplete="off" />
      </UFormField>
      <USeparator />
      <UFormField
        name="username"
        label="Nome de utilizador"
        description="O teu nome de utilizador único para iniciar sessão e o URL do teu perfil."
        required
        class="flex max-sm:flex-col justify-between items-start gap-4"
      >
        <UInput v-model="profile.username" type="username" autocomplete="off" />
      </UFormField>
      <USeparator />
      <UFormField
        name="avatar"
        label="Foto de perfil"
        description="JPG, GIF ou PNG. Máximo de 1 MB."
        class="flex max-sm:flex-col justify-between sm:items-center gap-4"
      >
        <div class="flex flex-wrap items-center gap-3">
          <AppUserAvatar :src="profile.avatar" :alt="profile.name" size="lg" />
          <UButton label="Escolher" color="neutral" @click="onFileClick" />
          <input
            ref="fileRef"
            type="file"
            class="hidden"
            accept=".jpg, .jpeg, .png, .gif"
            @change="onFileChange"
          >
        </div>
      </UFormField>
      <USeparator />
      <UFormField
        name="bio"
        label="Biografia"
        description="Breve descrição do teu perfil. Os URLs ficam com ligação."
        class="flex max-sm:flex-col justify-between items-start gap-4"
        :ui="{ container: 'w-full' }"
      >
        <UTextarea
          v-model="profile.bio"
          :rows="5"
          autoresize
          class="w-full"
        />
      </UFormField>
    </UPageCard>
  </UForm>

  <template v-if="isAdmin">
    <UPageCard
      title="Impressora de Talões"
      description="Configurações para impressão automática de talões térmicos de 80mm."
      variant="naked"
      orientation="horizontal"
      class="mt-8 mb-4"
    />
    <UPageCard variant="subtle" :ui="{ container: 'divide-y divide-default' }">
      <UFormField
        name="print_receipt"
        label="Imprimir talão após confirmação de doação"
        description="Imprime automaticamente um talão térmico quando uma doação é confirmada no Painel do Cidadão."
        class="flex items-center justify-between not-last:pb-4 gap-2"
      >
        <USwitch v-model="printReceiptEnabled" @update:model-value="savePrintSetting" />
      </UFormField>

      <UFormField
        name="agent_status"
        label="Agente de impressão"
        description="Execute 'node print-agent.js' na máquina do kiosk. O agente comunica com a impressora via Windows."
        class="flex max-sm:flex-col justify-between items-start not-last:pb-4 gap-4 pt-4"
      >
        <div class="flex items-center gap-2">
          <UBadge
            :color="agentAvailable ? 'success' : 'error'"
            :label="agentAvailable ? 'Agente ativo' : 'Agente offline'"
            icon="i-lucide-circle-dot"
            variant="subtle"
          />
          <UButton
            icon="i-lucide-refresh-cw"
            color="neutral"
            variant="ghost"
            aria-label="Verificar agente"
            @click="checkAvailability"
          />
        </div>
      </UFormField>

      <UFormField
        name="printer_select"
        label="Impressora"
        description="Impressora a usar para os talões térmicos."
        class="flex max-sm:flex-col justify-between items-start not-last:pb-4 gap-4 pt-4"
      >
        <div class="flex items-center gap-2 min-w-64">
          <USelect
            v-model="selectedPrinter"
            :items="printerItems"
            placeholder="Selecionar impressora..."
            :loading="loadingPrinters"
            :disabled="!agentAvailable || loadingPrinters"
            class="flex-1"
            @update:model-value="onPrinterChange"
          />
          <UButton
            icon="i-lucide-refresh-cw"
            color="neutral"
            variant="ghost"
            :loading="loadingPrinters"
            :disabled="!agentAvailable"
            aria-label="Atualizar lista"
            @click="loadPrinters"
          />
        </div>
      </UFormField>
    </UPageCard>
  </template>
</template>
