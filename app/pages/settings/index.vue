<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

const fileRef = ref<HTMLInputElement>()
const userProfile = useUserProfile()
const { isAdmin } = useAuth()

const printReceiptEnabled = ref(true)
const baudRate = ref('9600')
const baudRateOptions = ['9600', '19200', '38400', '57600', '115200'].map(v => ({ label: `${v} baud`, value: v }))

const { isSupported: serialSupported, hasPort, requestPort } = useSerialPrint()

onMounted(() => {
  const stored = localStorage.getItem('sam_print_receipt_enabled')
  if (stored !== null) printReceiptEnabled.value = stored === 'true'
  baudRate.value = localStorage.getItem('sam_print_baud_rate') ?? '9600'
})

function savePrintSetting(val: boolean) {
  localStorage.setItem('sam_print_receipt_enabled', String(val))
}

function saveBaudRate(val: string) {
  localStorage.setItem('sam_print_baud_rate', val)
}

const profileSchema = z.object({
  name: z.string().min(2, 'Demasiado curto'),
  email: z.string().email('Email inválido'),
  username: z.string().min(2, 'Demasiado curto'),
  avatar: z.string().optional(),
  bio: z.string().optional()
})

type ProfileSchema = z.output<typeof profileSchema>

const profile = reactive<Partial<ProfileSchema>>({
  name: userProfile.profile.value.name,
  email: 'ben@nuxtlabs.com',
  username: userProfile.defaultName,
  avatar: userProfile.profile.value.avatar,
  bio: undefined
})

const toast = useToast()

async function onSubmit(event: FormSubmitEvent<ProfileSchema>) {
  userProfile.profile.value.name
    = profile.name || userProfile.profile.value.name
  userProfile.profile.value.avatar
    = profile.avatar || userProfile.profile.value.avatar

  toast.add({
    title: 'Sucesso',
    description: 'As tuas definições foram atualizadas.',
    icon: 'i-lucide-check',
    color: 'success'
  })

  console.log(event.data)
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

  const previewUrl = URL.createObjectURL(file)
  profile.avatar = previewUrl
  userProfile.profile.value.avatar = previewUrl

  try {
    const filename = encodeURIComponent(file.name)
    const { public: { backendBase } } = useRuntimeConfig()

    const formData = new FormData()
    formData.append('file', file)

    const uploadRes = await fetch(`${backendBase}/api/upload/avatar?nome=${filename}`, {
      method: 'POST',
      body: formData
    })

    if (!uploadRes.ok) {
      const text = await uploadRes.text()
      throw new Error(text || uploadRes.statusText)
    }

    const uploadData: { url?: string } = await uploadRes.json()

    if (!uploadData.url) {
      throw new Error('Nenhuma URL retornada pelo servidor')
    }

    profile.avatar = uploadData.url
    userProfile.profile.value.avatar = uploadData.url

    toast.add({
      title: 'Sucesso',
      description: 'Avatar carregado com sucesso.',
      icon: 'i-lucide-check',
      color: 'success'
    })
  } catch (err) {
    console.error('Upload failed', err)

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
          <UAvatar :src="profile.avatar" :alt="profile.name" size="lg" />
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
        name="serial_port"
        label="Porta da impressora"
        description="Selecione a porta USB/Serial da impressora térmica. O browser pedirá permissão na primeira vez."
        class="flex max-sm:flex-col justify-between items-start not-last:pb-4 gap-4 pt-4"
      >
        <div class="flex items-center gap-3">
          <UBadge
            :color="hasPort ? 'success' : 'neutral'"
            :label="hasPort ? 'Ligada' : 'Não ligada'"
            :icon="hasPort ? 'i-lucide-printer' : 'i-lucide-printer'"
            variant="subtle"
          />
          <UButton
            label="Selecionar porta"
            icon="i-lucide-plug"
            color="neutral"
            :disabled="!serialSupported"
            @click="requestPort"
          />
          <UTooltip v-if="!serialSupported" text="Web Serial requer Chrome ou Edge">
            <UIcon name="i-lucide-alert-circle" class="text-warning" />
          </UTooltip>
        </div>
      </UFormField>

      <UFormField
        name="baud_rate"
        label="Velocidade de comunicação"
        description="9600 é o valor padrão para a maioria das impressoras térmicas. Ajuste se necessário."
        class="flex max-sm:flex-col justify-between items-start not-last:pb-4 gap-4 pt-4"
      >
        <USelect
          v-model="baudRate"
          :items="baudRateOptions"
          class="min-w-40"
          @update:model-value="saveBaudRate"
        />
      </UFormField>
    </UPageCard>
  </template>
</template>
