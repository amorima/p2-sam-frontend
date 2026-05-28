<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

const toast = useToast()
const router = useRouter()
const { isAdmin } = useAuth()

if (!isAdmin.value) await navigateTo('/instituicoes')

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/

const schema = z.object({
  nif_nipc: z.string().regex(/^\d{9}$/, 'NIF/NIPC deve ter exatamente 9 dígitos'),
  nome_entidade: z.string().min(2, 'Nome obrigatório'),
  email_login: z.string().email('Email inválido'),
  password: z.string().regex(passwordRegex, 'Min. 8 caracteres, com maiúscula, minúscula, número e !@#$%^&*'),
  url_comprovativo_estatuto: z.string().url('URL inválido'),
  geo_latitude: z.number(),
  geo_longitude: z.number(),
  rua: z.string().min(2, 'Indique a rua'),
  n_porta: z.string().min(1, 'Indique o número de porta'),
  codigo_postal: z.string().regex(/^\d{4}-\d{3}$/, 'Formato 0000-000'),
  freguesia: z.string().min(2, 'Indique a freguesia'),
  concelho: z.string().min(2, 'Indique o concelho'),
  distrito: z.string().min(2, 'Indique o distrito'),
  pais: z.string().min(2, 'Indique o país'),
  contacto: z.string().min(6, 'Contacto inválido'),
  nome_contacto: z.string().min(2, 'Nome do responsável obrigatório'),
  descricao_contacto: z.string().min(2, 'Descrição obrigatória')
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  nif_nipc: '',
  nome_entidade: '',
  email_login: '',
  password: '',
  url_comprovativo_estatuto: '',
  geo_latitude: 41.3526,
  geo_longitude: -8.7396,
  rua: '',
  n_porta: '',
  codigo_postal: '',
  freguesia: 'Vila do Conde',
  concelho: 'Vila do Conde',
  distrito: 'Porto',
  pais: 'Portugal',
  contacto: '',
  nome_contacto: '',
  descricao_contacto: 'Responsável'
})

const isSubmitting = ref(false)

let geocodeTimer: ReturnType<typeof setTimeout> | null = null
async function resolveCoordinates() {
  const parts = [state.rua, state.n_porta, state.codigo_postal, state.freguesia, state.concelho]
    .filter(p => typeof p === 'string' && p.trim().length > 0)
  if (parts.length < 3) return
  try {
    const res = await $fetch<{ lat: number | null, lng: number | null }>('/api/geocode', {
      query: { address: parts.join(', ') }
    })
    if (res?.lat != null && res?.lng != null) {
      state.geo_latitude = res.lat
      state.geo_longitude = res.lng
    }
  } catch { /* silent */ }
}
watch(
  () => [state.rua, state.n_porta, state.codigo_postal, state.freguesia, state.concelho],
  () => {
    if (geocodeTimer) clearTimeout(geocodeTimer)
    geocodeTimer = setTimeout(resolveCoordinates, 800)
  }
)

async function onSubmit(event: FormSubmitEvent<Schema>) {
  isSubmitting.value = true
  try {
    await $fetch('/api/institutions', {
      method: 'POST',
      body: {
        entity: {
          nif_nipc: event.data.nif_nipc,
          nome_entidade: event.data.nome_entidade,
          email_login: event.data.email_login,
          password: event.data.password
        },
        institution: {
          url_comprovativo_estatuto: event.data.url_comprovativo_estatuto,
          geo_latitude: event.data.geo_latitude,
          geo_longitude: event.data.geo_longitude
        },
        location: {
          rua: event.data.rua,
          n_porta: event.data.n_porta,
          codigo_postal: event.data.codigo_postal,
          freguesia: event.data.freguesia,
          concelho: event.data.concelho,
          distrito: event.data.distrito,
          pais: event.data.pais
        },
        contacts: [{
          contacto: event.data.contacto,
          nome_contacto: event.data.nome_contacto,
          descricao: event.data.descricao_contacto
        }]
      }
    })
    toast.add({
      title: 'Instituição registada',
      description: `${event.data.nome_entidade} adicionada com sucesso.`,
      icon: 'i-lucide-check',
      color: 'success'
    })
    router.push('/instituicoes')
  } catch (err: unknown) {
    const e = err as { statusMessage?: string }
    toast.add({ title: 'Erro ao registar', description: e?.statusMessage ?? 'Não foi possível registar a instituição.', icon: 'i-lucide-x', color: 'error' })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <UDashboardPanel id="instituicao-registo">
    <template #header>
      <UDashboardNavbar title="Registar Instituição">
        <template #leading>
          <UDashboardSidebarCollapse />
          <UButton
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="ghost"
            to="/instituicoes"
            class="hidden lg:flex"
          />
        </template>
        <template #right>
          <UButton
            label="Cancelar"
            color="neutral"
            variant="ghost"
            to="/instituicoes"
          />
          <UButton
            form="inst-registo"
            label="Registar Instituição"
            icon="i-lucide-save"
            color="primary"
            type="submit"
            :loading="isSubmitting"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UForm
        id="inst-registo"
        :schema="schema"
        :state="state"
        class="space-y-6"
        @submit="onSubmit"
      >
        <!-- Dados da Instituição -->
        <UPageCard variant="subtle">
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-clipboard-list" class="size-4 text-muted" />
              <h3 class="font-semibold text-highlighted">
                Dados da Instituição
              </h3>
            </div>
          </template>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <UFormField name="nif_nipc" label="NIF / NIPC" required>
              <UInput
                v-model="state.nif_nipc"
                class="w-full font-mono"
                maxlength="9"
                placeholder="510100200"
              />
            </UFormField>
            <UFormField name="nome_entidade" label="Nome da Instituição" required>
              <UInput v-model="state.nome_entidade" class="w-full" placeholder="Ex.: Associação de Apoio Social" />
            </UFormField>
            <UFormField name="email_login" label="Email de Login" required>
              <UInput
                v-model="state.email_login"
                type="email"
                class="w-full"
                placeholder="geral@instituicao.pt"
              />
            </UFormField>
            <UFormField
              name="password"
              label="Palavra-passe (acesso inicial)"
              required
              help="Min. 8 caracteres, maiúscula, minúscula, número e símbolo"
            >
              <UInput
                v-model="state.password"
                type="password"
                class="w-full font-mono"
                placeholder="••••••••"
              />
            </UFormField>
            <UFormField
              name="url_comprovativo_estatuto"
              label="URL do Estatuto"
              required
              class="sm:col-span-2"
            >
              <UInput
                v-model="state.url_comprovativo_estatuto"
                class="w-full font-mono"
                placeholder="https://..."
              />
            </UFormField>
          </div>
        </UPageCard>

        <!-- Localização -->
        <UPageCard variant="subtle">
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-map-pin" class="size-4 text-muted" />
              <h3 class="font-semibold text-highlighted">
                Localização
              </h3>
            </div>
          </template>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <UFormField
              name="rua"
              label="Rua"
              required
              class="sm:col-span-2"
            >
              <UInput v-model="state.rua" class="w-full" placeholder="Rua de Exemplo" />
            </UFormField>
            <UFormField name="n_porta" label="Nº Porta" required>
              <UInput v-model="state.n_porta" class="w-full" placeholder="10" />
            </UFormField>
            <UFormField name="codigo_postal" label="Código Postal" required>
              <UInput v-model="state.codigo_postal" class="w-full font-mono" placeholder="4480-100" />
            </UFormField>
            <UFormField name="freguesia" label="Freguesia" required>
              <UInput v-model="state.freguesia" class="w-full" />
            </UFormField>
            <UFormField name="concelho" label="Concelho" required>
              <UInput v-model="state.concelho" class="w-full" />
            </UFormField>
            <UFormField name="distrito" label="Distrito" required>
              <UInput v-model="state.distrito" class="w-full" />
            </UFormField>
            <UFormField name="pais" label="País" required>
              <UInput v-model="state.pais" class="w-full" />
            </UFormField>
          </div>
        </UPageCard>

        <!-- Contacto Responsável -->
        <UPageCard variant="subtle">
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-user" class="size-4 text-muted" />
              <h3 class="font-semibold text-highlighted">
                Contacto Responsável
              </h3>
            </div>
          </template>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <UFormField name="nome_contacto" label="Nome" required>
              <UInput v-model="state.nome_contacto" class="w-full" placeholder="Ex.: Maria Santos" />
            </UFormField>
            <UFormField name="contacto" label="Telefone / Email de Contacto" required>
              <UInput v-model="state.contacto" class="w-full" placeholder="912345678" />
            </UFormField>
            <UFormField
              name="descricao_contacto"
              label="Função"
              required
              class="sm:col-span-2"
            >
              <UInput v-model="state.descricao_contacto" class="w-full" placeholder="Responsável, Presidente, Coordenador..." />
            </UFormField>
          </div>
        </UPageCard>
      </UForm>
    </template>
  </UDashboardPanel>
</template>
