<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useNeeds } from '~/composables/useNeeds'

interface DraftOffer {
  tipo_bem_servico: string
  descricao: string
  valor_total: number
  desconto: number
  tipo_bem: 'bem' | 'servico'
}

const toast = useToast()
const router = useRouter()
const { isAdmin } = useAuth()
const { businesses, goodsServices, createBusinessRemote } = useNeeds()

if (!isAdmin.value) {
  await navigateTo('/negocios')
}

const docNumber = useState('docNumber.negocio', () => {
  const year = new Date().getFullYear()
  const rand = String(Math.floor(1000 + Math.random() * 9000))
  return `NEG-${year}-${rand}`
})

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/

const schema = z.object({
  nif_nipc: z.string().regex(/^\d{9}$/, 'NIF/NIPC deve ter exatamente 9 dígitos'),
  nome_entidade: z.string().min(2, 'Nome obrigatório'),
  email_login: z.string().email('Email inválido'),
  password: z.string().regex(passwordRegex, 'Min. 8 caracteres, com maiúscula, minúscula, número e !@#$%^&*'),
  iban: z.string().min(15, 'IBAN inválido'),
  geo_latitude: z.number(),
  geo_longitude: z.number(),
  url_certidao_permanente: z.string().url('URL inválido'),
  inicio_atividade: z.string().min(4, 'Indique a data de início de atividade'),
  rua: z.string().min(2, 'Indique a rua'),
  n_porta: z.string().min(1, 'Indique o número de porta'),
  codigo_postal: z.string().regex(/^\d{4}-\d{3}$/, 'Código postal deve ter o formato 0000-000'),
  freguesia: z.string().min(2, 'Indique a freguesia'),
  concelho: z.string().min(2, 'Indique o concelho'),
  distrito: z.string().min(2, 'Indique o distrito'),
  pais: z.string().min(2, 'Indique o país'),
  contacto: z.string().min(6, 'Indique um contacto válido'),
  nome_contacto: z.string().min(2, 'Indique o nome do responsável'),
  descricao_contacto: z.string().min(2, 'Indique a função/descrição do contacto')
})

type Schema = z.output<typeof schema>

const today = new Date().toISOString().slice(0, 10)

const state = reactive<Partial<Schema>>({
  nif_nipc: '',
  nome_entidade: '',
  email_login: '',
  password: '',
  iban: '',
  geo_latitude: 41.3526,
  geo_longitude: -8.7396,
  url_certidao_permanente: '',
  inicio_atividade: today,
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

watch(() => state.nif_nipc, (v) => {
  if (v && !state.url_certidao_permanente) {
    state.url_certidao_permanente = `https://certidoes.negocio.pt/${v}.pdf`
  }
})

let geocodeTimer: ReturnType<typeof setTimeout> | null = null

async function resolveCoordinates() {
  const parts = [state.rua, state.n_porta, state.codigo_postal, state.freguesia, state.concelho, state.distrito, state.pais]
    .filter(p => typeof p === 'string' && p.trim().length > 0)
  if (parts.length < 3) return
  const address = parts.join(', ')
  try {
    const res = await $fetch<{ lat: number | null, lng: number | null }>('/api/geocode', {
      query: { address }
    })
    if (res?.lat != null && res?.lng != null) {
      state.geo_latitude = res.lat
      state.geo_longitude = res.lng
    }
  } catch {
    // silent — fallback to defaults from state
  }
}

watch(
  () => [state.rua, state.n_porta, state.codigo_postal, state.freguesia, state.concelho, state.distrito, state.pais],
  () => {
    if (geocodeTimer) clearTimeout(geocodeTimer)
    geocodeTimer = setTimeout(resolveCoordinates, 800)
  }
)

// Offers draft list (negócios só registam SERVIÇOS — bens vão para painéis/lockers)
const offers = ref<DraftOffer[]>([])
const showAddOffer = ref(false)
const newOfferCategory = ref('')
const newOfferDescricao = ref('')
const newOfferValor = ref<number | undefined>(undefined)
const newOfferDesconto = ref<number>(100)
const isProBono = computed(() => newOfferDesconto.value === 100)

const categoryOptions = computed(() =>
  goodsServices.value
    .filter(g => g.tipo_bem === 'SERVICO')
    .map(g => ({
      label: g.tipo_bem_servico,
      value: g.tipo_bem_servico
    }))
)

function addOfferDraft() {
  const cat = newOfferCategory.value.trim()
  if (!cat || !newOfferDescricao.value.trim() || newOfferValor.value === undefined || newOfferValor.value === null || newOfferValor.value <= 0) {
    toast.add({ title: 'Campos obrigatórios', description: 'Preencha categoria, descrição e valor.', icon: 'i-lucide-alert-circle', color: 'warning' })
    return
  }
  if (offers.value.some(o => o.tipo_bem_servico === cat)) {
    toast.add({ title: 'Categoria já adicionada', icon: 'i-lucide-alert-circle', color: 'warning' })
    return
  }
  offers.value.push({
    tipo_bem_servico: cat,
    descricao: newOfferDescricao.value.trim(),
    valor_total: newOfferValor.value,
    desconto: newOfferDesconto.value,
    tipo_bem: 'servico'
  })
  showAddOffer.value = false
  newOfferCategory.value = ''
  newOfferDescricao.value = ''
  newOfferValor.value = undefined
  newOfferDesconto.value = 100
}

function removeOfferDraft(idx: number) {
  offers.value.splice(idx, 1)
}

function descontoLabel(o: DraftOffer): { text: string, color: 'success' | 'warning' | 'info' } {
  if (o.desconto >= 100) return { text: 'Pro bono', color: 'success' }
  if (o.desconto >= 50) return { text: `${o.desconto}% desconto`, color: 'warning' }
  return { text: `${o.desconto}% desconto`, color: 'info' }
}

async function onSubmit(event: FormSubmitEvent<Schema>) {
  if (businesses.value.some(b => b.resource.nif_nipc === event.data.nif_nipc)) {
    toast.add({ title: 'NIF/NIPC já existe', description: 'Já existe um negócio com este NIF/NIPC.', icon: 'i-lucide-alert-circle', color: 'error' })
    return
  }
  isSubmitting.value = true
  try {
    await createBusinessRemote({
      entity: {
        nif_nipc: event.data.nif_nipc,
        nome_entidade: event.data.nome_entidade,
        email_login: event.data.email_login,
        password: event.data.password,
        iban: event.data.iban
      },
      business: {
        geo_latitude: event.data.geo_latitude,
        geo_longitude: event.data.geo_longitude,
        url_certidao_permanente: event.data.url_certidao_permanente,
        inicio_atividade: event.data.inicio_atividade
      },
      location: {
        codigo_postal: event.data.codigo_postal,
        concelho: event.data.concelho,
        distrito: event.data.distrito,
        freguesia: event.data.freguesia,
        pais: event.data.pais,
        rua: event.data.rua,
        n_porta: event.data.n_porta
      },
      contacts: [{
        contacto: event.data.contacto,
        nome_contacto: event.data.nome_contacto,
        descricao: event.data.descricao_contacto
      }],
      offers: offers.value.length ? offers.value : undefined
    })
    const offerCount = offers.value.length
    toast.add({
      title: 'Negócio registado',
      description: offerCount > 0
        ? `${event.data.nome_entidade} adicionado com ${offerCount} oferta${offerCount > 1 ? 's' : ''}.`
        : `${event.data.nome_entidade} adicionado. Pode adicionar categorias no perfil do negócio.`,
      icon: 'i-lucide-check',
      color: 'success'
    })
    router.push('/negocios/gestao')
  } catch (e) {
    const msg = (e as { statusMessage?: string })?.statusMessage ?? 'Não foi possível registar o negócio.'
    toast.add({ title: 'Erro ao registar', description: msg, icon: 'i-lucide-x', color: 'error' })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <UDashboardPanel id="negocio-registo">
    <template #header>
      <UDashboardNavbar title="Registo Manual de Negócio">
        <template #leading>
          <UDashboardSidebarCollapse />
          <UButton
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="ghost"
            to="/negocios"
            class="hidden lg:flex"
          />
        </template>
        <template #right>
          <UButton
            label="Cancelar"
            color="neutral"
            variant="ghost"
            to="/negocios"
          />
          <UButton
            form="negocio-form"
            label="Registar Negócio"
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
        id="negocio-form"
        :schema="schema"
        :state="state"
        class="space-y-6"
        @submit="onSubmit"
      >
        <UPageCard variant="subtle" class="px-6 py-4">
          <div class="flex flex-wrap items-center gap-x-8 gap-y-4">
            <div class="flex items-center gap-3">
              <UIcon name="i-lucide-file-text" class="size-5 text-muted shrink-0" />
              <div>
                <p class="text-xs text-muted uppercase tracking-wide font-medium">
                  Nº Documento
                </p>
                <p class="font-mono font-semibold text-highlighted">
                  {{ docNumber }}
                </p>
              </div>
            </div>
          </div>
        </UPageCard>

        <UPageCard variant="subtle">
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-store" class="size-4 text-muted" />
              <h3 class="font-semibold text-highlighted">
                Dados do Negócio
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
            <UFormField name="nome_entidade" label="Nome do Negócio" required>
              <UInput v-model="state.nome_entidade" class="w-full" placeholder="Ex.: Advogados Costa & Associados" />
            </UFormField>
            <UFormField name="email_login" label="Email de Login" required>
              <UInput
                v-model="state.email_login"
                type="email"
                class="w-full"
                placeholder="contacto@negocio.pt"
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
            <UFormField name="iban" label="IBAN" required>
              <UInput v-model="state.iban" class="w-full font-mono" placeholder="PT50..." />
            </UFormField>
            <UFormField name="inicio_atividade" label="Início de Atividade" required>
              <UInput v-model="state.inicio_atividade" type="date" class="w-full" />
            </UFormField>
            <UFormField
              name="url_certidao_permanente"
              label="URL Certidão Permanente"
              required
              class="sm:col-span-2"
            >
              <UInput v-model="state.url_certidao_permanente" class="w-full font-mono" placeholder="https://..." />
            </UFormField>
          </div>
        </UPageCard>

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
            <UFormField name="rua" label="Rua" required>
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
              <UInput v-model="state.nome_contacto" class="w-full" placeholder="Ex.: João Silva" />
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
              <UInput v-model="state.descricao_contacto" class="w-full" placeholder="Responsável, Gerente, Sócio..." />
            </UFormField>
          </div>
        </UPageCard>

        <UPageCard variant="subtle">
          <template #header>
            <div class="flex items-center justify-between gap-4 flex-wrap">
              <div class="flex items-center gap-2 min-w-0">
                <UIcon name="i-lucide-tags" class="size-4 text-muted shrink-0" />
                <h3 class="font-semibold text-highlighted">
                  Categorias e Ofertas
                </h3>
              </div>
              <UButton
                label="Adicionar Categoria"
                icon="i-lucide-plus"
                color="primary"
                variant="subtle"
                size="sm"
                class="ml-auto shrink-0"
                @click="showAddOffer = !showAddOffer"
              />
            </div>
          </template>

          <p class="text-xs text-muted mb-3">
            Os negócios oferecem <strong>serviços</strong> à comunidade (apoio jurídico, consultas, transporte, etc.). Os bens essenciais são doados por cidadãos via painéis municipais.
          </p>

          <div v-if="showAddOffer" class="mb-4 p-4 rounded-lg border border-default bg-elevated/30 space-y-3">
            <p class="text-xs font-semibold text-muted uppercase tracking-wide">
              Nova Categoria / Oferta
            </p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <UFormField label="Categoria (serviço)">
                <USelectMenu
                  v-model="newOfferCategory"
                  :items="categoryOptions"
                  value-key="value"
                  label-key="label"
                  search-placeholder="Pesquisar serviço..."
                  placeholder="Escolher..."
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Valor Base (€)">
                <UInput
                  v-model.number="newOfferValor"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0,00"
                  trailing-icon="i-lucide-euro"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Descrição da oferta" class="sm:col-span-2">
                <UInput v-model="newOfferDescricao" placeholder="Ex.: Consultas jurídicas em direito civil e família" class="w-full" />
              </UFormField>
              <UFormField label="Desconto (%)" class="sm:col-span-2">
                <div class="flex items-center gap-3">
                  <UInput
                    v-model.number="newOfferDesconto"
                    type="number"
                    min="0"
                    max="100"
                    step="5"
                    class="w-32"
                  />
                  <UBadge
                    v-if="isProBono"
                    color="success"
                    variant="subtle"
                    icon="i-lucide-heart"
                  >
                    Pro bono
                  </UBadge>
                  <span v-else class="text-xs text-muted">
                    0% = preço normal · 100% = pro bono
                  </span>
                </div>
              </UFormField>
            </div>
            <div class="flex justify-end gap-2 pt-2">
              <UButton
                label="Cancelar"
                color="neutral"
                variant="subtle"
                size="sm"
                @click="showAddOffer = false"
              />
              <UButton
                label="Adicionar"
                icon="i-lucide-check"
                color="primary"
                size="sm"
                @click="addOfferDraft"
              />
            </div>
          </div>

          <div v-if="offers.length === 0" class="text-center py-8 text-sm text-muted">
            <UIcon name="i-lucide-tags" class="size-8 mb-2 mx-auto" />
            <p>Ainda não foram adicionadas categorias.</p>
            <p class="mt-1">
              Pode adicionar agora ou mais tarde no perfil do negócio.
            </p>
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="(o, idx) in offers"
              :key="`${o.tipo_bem_servico}-${idx}`"
              class="grid grid-cols-1 md:grid-cols-[1fr_auto_auto_auto] gap-3 items-center rounded-lg border border-default bg-elevated/30 px-4 py-3"
            >
              <div class="min-w-0">
                <p class="font-medium text-highlighted truncate">
                  {{ o.tipo_bem_servico }}
                </p>
                <p class="text-xs text-muted truncate">
                  {{ o.descricao }}
                </p>
              </div>
              <div class="text-sm tabular-nums text-muted">
                {{ new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(o.valor_total) }}
              </div>
              <UBadge
                :color="descontoLabel(o).color"
                variant="subtle"
                size="sm"
              >
                {{ descontoLabel(o).text }}
              </UBadge>
              <UButton
                icon="i-lucide-trash-2"
                color="error"
                variant="ghost"
                size="sm"
                @click="removeOfferDraft(idx)"
              />
            </div>
          </div>
        </UPageCard>

        <UPageCard variant="subtle">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p class="text-xs text-muted uppercase tracking-wide font-medium">
                Resumo
              </p>
              <p class="text-base font-semibold text-highlighted mt-1">
                {{ state.nome_entidade || 'Novo negócio' }}
              </p>
              <p class="text-sm text-muted mt-0.5">
                NIF {{ state.nif_nipc || '—' }} · {{ state.email_login || 'sem email' }}
              </p>
            </div>
            <div class="flex gap-2">
              <UButton
                label="Cancelar"
                color="neutral"
                variant="outline"
                to="/negocios"
              />
              <UButton
                form="negocio-form"
                label="Registar Negócio"
                icon="i-lucide-save"
                color="primary"
                type="submit"
                :loading="isSubmitting"
              />
            </div>
          </div>
        </UPageCard>
      </UForm>
    </template>
  </UDashboardPanel>
</template>
