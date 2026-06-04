<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useNeeds } from '~/composables/useNeeds'

definePageMeta({ layout: 'auth' })

const toast = useToast()
const router = useRouter()

type RoleType = 'patron' | 'institution' | 'business'

const roleOptions: { label: string, value: RoleType, icon: string, description: string, color: string }[] = [
  {
    label: 'Mecenas',
    value: 'patron',
    icon: 'i-lucide-hand-coins',
    description: 'Faço doações financeiras ou em espécie para apoiar as instituições.',
    color: 'text-success'
  },
  {
    label: 'Instituição',
    value: 'institution',
    icon: 'i-lucide-building-2',
    description: 'Represento uma organização que necessita de apoio do SAM.',
    color: 'text-info'
  },
  {
    label: 'Negócio',
    value: 'business',
    icon: 'i-lucide-briefcase',
    description: 'Sou um parceiro comercial que oferece bens ou serviços.',
    color: 'text-warning'
  }
]

const route = useRoute()
const step = ref<1 | 2 | 3 | 4>(1)
const initialRole = (['patron', 'institution', 'business'] as RoleType[]).includes(route.query.role as RoleType)
  ? (route.query.role as RoleType)
  : 'patron'
const selectedRole = ref<RoleType>(initialRole)
const isSubmitting = ref(false)
const showPassword = ref(false)
const showPasswordConfirm = ref(false)

interface DraftOffer {
  tipo_bem_servico: string
  descricao: string
  valor_total: number
  desconto: number
  tipo_bem: 'bem' | 'servico'
}

const { goodsServices } = useNeeds()

const offers = ref<DraftOffer[]>([])
const showAddOffer = ref(false)
const newOfferCategory = ref('')
const newOfferTipo = ref<'BEM' | 'SERVICO'>('SERVICO')
const newOfferDescricao = ref('')
const newOfferValor = ref<number | undefined>(undefined)
const newOfferDesconto = ref<number>(100)
const isProBono = computed(() => newOfferDesconto.value === 100)

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
  const existingService = goodsServices.value.find(g => g.tipo_bem_servico === cat)
  const tipo_bem = existingService
    ? existingService.tipo_bem as 'bem' | 'servico'
    : (newOfferTipo.value === 'BEM' ? 'bem' : 'servico')
  offers.value.push({
    tipo_bem_servico: cat,
    descricao: newOfferDescricao.value.trim(),
    valor_total: newOfferValor.value,
    desconto: newOfferDesconto.value,
    tipo_bem
  })
  showAddOffer.value = false
  newOfferCategory.value = ''
  newOfferTipo.value = 'SERVICO'
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

// Reset upload fields when role changes
watch(selectedRole, () => {
  entityState.url_comprovativo_estatuto = ''
  entityState.url_certidao_permanente = ''
})

// ── Step 2: Entity schema & state ─────────────────────────────────────────────

const entitySchema = z.object({
  nif_nipc: z.string().length(9, 'NIF/NIPC deve ter exatamente 9 dígitos').regex(/^\d{9}$/, 'Apenas dígitos'),
  nome_entidade: z.string().min(2, 'Nome obrigatório (mín. 2 caracteres)').max(45),
  email_login: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  password_confirm: z.string().min(1, 'Confirme a password'),
  iban: z.string().optional(),
  inicio_atividade: z.string().optional(),
  url_comprovativo_estatuto: z.string().optional(),
  url_certidao_permanente: z.string().optional()
}).superRefine((data, ctx) => {
  if (data.password !== data.password_confirm) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'As passwords não coincidem', path: ['password_confirm'] })
  }
})

type EntitySchema = z.output<typeof entitySchema>

const entityState = reactive<Partial<EntitySchema>>({
  nif_nipc: '',
  nome_entidade: '',
  email_login: '',
  password: '',
  password_confirm: '',
  iban: '',
  inicio_atividade: new Date().toISOString().split('T')[0],
  url_comprovativo_estatuto: '',
  url_certidao_permanente: ''
})

// ── Step 3: Location schema & state ──────────────────────────────────────────

const locationSchema = z.object({
  rua: z.string().min(2, 'Morada obrigatória'),
  n_porta: z.string().min(1, 'Nº de porta obrigatório').max(5),
  codigo_postal: z.string().regex(/^\d{4}-\d{3}$/, 'Formato: 0000-000'),
  freguesia: z.string().min(2, 'Freguesia obrigatória'),
  concelho: z.string().min(2, 'Concelho obrigatório'),
  distrito: z.string().min(2, 'Distrito obrigatório'),
  pais: z.string().min(2, 'País obrigatório')
})

type LocationSchema = z.output<typeof locationSchema>

const locationState = reactive<Partial<LocationSchema>>({
  rua: '',
  n_porta: '',
  codigo_postal: '',
  freguesia: '',
  concelho: '',
  distrito: '',
  pais: 'Portugal'
})

// ── Step navigation ───────────────────────────────────────────────────────────

const stepTitles = computed(() =>
  selectedRole.value === 'business'
    ? ['Tipo de conta', 'Dados da entidade', 'Morada', 'Ofertas']
    : ['Tipo de conta', 'Dados da entidade', 'Morada']
)

async function onStep2Submit(_event: FormSubmitEvent<EntitySchema>) {
  if (selectedRole.value === 'institution' && !entityState.url_comprovativo_estatuto) {
    toast.add({ title: 'Ficheiro obrigatório', description: 'Carregue o comprovativo de estatuto antes de continuar.', icon: 'i-lucide-alert-circle', color: 'warning' })
    return
  }
  if (selectedRole.value === 'business' && !entityState.url_certidao_permanente) {
    toast.add({ title: 'Ficheiro obrigatório', description: 'Carregue a certidão permanente antes de continuar.', icon: 'i-lucide-alert-circle', color: 'warning' })
    return
  }
  step.value = 3
}

async function geocodeFromAddress(loc: LocationSchema): Promise<{ lat: number, lng: number }> {
  const address = `${loc.rua}, ${loc.n_porta}, ${loc.codigo_postal} ${loc.concelho}, ${loc.pais}`
  try {
    const result = await $fetch<{ lat: number | null, lng: number | null }>('/api/geocode', {
      params: { address }
    })
    if (result.lat && result.lng) return { lat: result.lat, lng: result.lng }
  } catch {
    // geocoding is best-effort; fall through to default coordinates
  }
  // Default: center of Vila do Conde
  return { lat: 41.3526, lng: -8.7396 }
}

const savedLocation = ref<LocationSchema | null>(null)
const savedCoords = ref<{ lat: number, lng: number }>({ lat: 41.3526, lng: -8.7396 })

async function submitRegistration() {
  if (!savedLocation.value) return
  isSubmitting.value = true
  try {
    const coords = savedCoords.value
    const payload: Record<string, unknown> = {
      role: selectedRole.value,
      entity: {
        nif_nipc: entityState.nif_nipc,
        nome_entidade: entityState.nome_entidade,
        email_login: entityState.email_login,
        password: entityState.password,
        iban: entityState.iban || undefined
      },
      location: savedLocation.value
    }

    if (selectedRole.value === 'institution') {
      payload.institution = {
        geo_latitude: coords.lat,
        geo_longitude: coords.lng,
        url_comprovativo_estatuto: entityState.url_comprovativo_estatuto
      }
    }

    if (selectedRole.value === 'business') {
      payload.business = {
        geo_latitude: coords.lat,
        geo_longitude: coords.lng,
        url_certidao_permanente: entityState.url_certidao_permanente,
        inicio_atividade: entityState.inicio_atividade
      }
      if (offers.value.length) {
        payload.offers = offers.value
      }
    }

    await $fetch('/api/auth/register', { method: 'POST', body: payload })

    toast.add({
      title: 'Registo concluído!',
      description: 'A sua conta foi criada com sucesso. Inicie sessão para continuar.',
      icon: 'i-lucide-check-circle',
      color: 'success'
    })
    router.push('/login')
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string }, statusMessage?: string }
    toast.add({
      title: 'Erro ao registar',
      description: e?.data?.statusMessage ?? e?.statusMessage ?? 'Não foi possível criar a conta. Verifique os dados.',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
  } finally {
    isSubmitting.value = false
  }
}

async function onStep3Submit(event: FormSubmitEvent<LocationSchema>) {
  savedLocation.value = event.data
  savedCoords.value = await geocodeFromAddress(event.data)
  if (selectedRole.value === 'business') {
    step.value = 4
    return
  }
  await submitRegistration()
}

async function onStep4Submit() {
  await submitRegistration()
}
</script>

<template>
  <div class="space-y-4">
    <!-- Step indicator -->
    <div class="flex items-center justify-center gap-2">
      <template v-for="(title, idx) in stepTitles" :key="idx">
        <div class="flex items-center gap-1.5">
          <div
            class="flex items-center justify-center size-7 rounded-full text-xs font-bold transition-colors"
            :class="step > idx + 1
              ? 'bg-primary text-white'
              : step === idx + 1
                ? 'bg-primary text-white ring-4 ring-primary/20'
                : 'bg-elevated text-muted'"
          >
            <UIcon v-if="step > idx + 1" name="i-lucide-check" class="size-3.5" />
            <span v-else>{{ idx + 1 }}</span>
          </div>
          <span
            class="text-xs font-medium hidden sm:block"
            :class="step === idx + 1 ? 'text-highlighted' : 'text-muted'"
          >{{ title }}</span>
        </div>
        <div v-if="idx < stepTitles.length - 1" class="flex-1 h-px bg-default max-w-8" />
      </template>
    </div>

    <!-- Step 1: Role selection -->
    <UCard v-if="step === 1" class="shadow-lg">
      <template #header>
        <div class="space-y-1">
          <h2 class="text-lg font-semibold text-highlighted">
            Tipo de conta
          </h2>
          <p class="text-sm text-muted">
            Selecione como pretende participar no SAM.
          </p>
        </div>
      </template>

      <div class="space-y-3">
        <button
          v-for="opt in roleOptions"
          :key="opt.value"
          type="button"
          class="w-full flex items-start gap-4 rounded-xl border px-4 py-4 text-left transition-colors focus:outline-none"
          :class="selectedRole === opt.value
            ? 'border-primary bg-primary/5'
            : 'border-default bg-elevated/20 hover:bg-elevated/50'"
          @click="selectedRole = opt.value"
        >
          <div
            class="flex items-center justify-center size-10 rounded-lg shrink-0 mt-0.5"
            :class="selectedRole === opt.value ? 'bg-primary/15' : 'bg-elevated'"
          >
            <UIcon
              :name="opt.icon"
              class="size-5"
              :class="selectedRole === opt.value ? 'text-primary' : opt.color"
            />
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-highlighted text-sm">
              {{ opt.label }}
            </p>
            <p class="text-xs text-muted mt-0.5 leading-relaxed">
              {{ opt.description }}
            </p>
          </div>
          <div
            class="size-4 rounded-full border-2 shrink-0 mt-1 transition-colors"
            :class="selectedRole === opt.value ? 'border-primary bg-primary' : 'border-muted'"
          />
        </button>
      </div>

      <template #footer>
        <div class="flex items-center justify-between">
          <UButton
            label="Já tenho conta"
            variant="link"
            color="neutral"
            to="/login"
          />
          <UButton
            label="Continuar"
            icon="i-lucide-arrow-right"
            trailing
            color="primary"
            @click="step = 2"
          />
        </div>
      </template>
    </UCard>

    <!-- Step 2: Entity data -->
    <UCard v-else-if="step === 2" class="shadow-lg">
      <template #header>
        <div class="flex items-center gap-3">
          <UButton
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="ghost"
            size="sm"
            @click="step = 1"
          />
          <div>
            <h2 class="text-lg font-semibold text-highlighted">
              Dados da entidade
            </h2>
            <p class="text-xs text-muted">
              Preencha os dados da sua conta
            </p>
          </div>
        </div>
      </template>

      <UForm
        id="step2-form"
        :schema="entitySchema"
        :state="entityState"
        class="space-y-4"
        @submit="onStep2Submit"
      >
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormField
            name="nif_nipc"
            label="NIF / NIPC"
            required
            class="sm:col-span-2"
          >
            <UInput
              v-model="entityState.nif_nipc"
              class="w-full font-mono"
              maxlength="9"
              placeholder="510123456"
              autocomplete="off"
            />
          </UFormField>

          <UFormField
            name="nome_entidade"
            label="Nome"
            required
            class="sm:col-span-2"
          >
            <UInput
              v-model="entityState.nome_entidade"
              class="w-full"
              :placeholder="selectedRole === 'patron' ? 'Ex.: João Silva' : selectedRole === 'institution' ? 'Ex.: Cruz Vermelha de Vila do Conde' : 'Ex.: Costa & Associados Lda'"
            />
          </UFormField>

          <UFormField
            name="email_login"
            label="Email"
            required
            class="sm:col-span-2"
          >
            <UInput
              v-model="entityState.email_login"
              type="email"
              class="w-full"
              placeholder="contacto@exemplo.pt"
              autocomplete="email"
            />
          </UFormField>

          <UFormField name="password" label="Password" required>
            <UInput
              v-model="entityState.password"
              :type="showPassword ? 'text' : 'password'"
              class="w-full"
              placeholder="Mínimo 6 caracteres"
              autocomplete="new-password"
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

          <UFormField name="password_confirm" label="Confirmar password" required>
            <UInput
              v-model="entityState.password_confirm"
              :type="showPasswordConfirm ? 'text' : 'password'"
              class="w-full"
              placeholder="Repita a password"
              autocomplete="new-password"
              :ui="{ trailing: 'pe-1' }"
            >
              <template #trailing>
                <UButton
                  :icon="showPasswordConfirm ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                  color="neutral"
                  variant="ghost"
                  size="sm"
                  @click="showPasswordConfirm = !showPasswordConfirm"
                />
              </template>
            </UInput>
          </UFormField>

          <UFormField name="iban" label="IBAN" class="sm:col-span-2">
            <UInput v-model="entityState.iban" class="w-full font-mono" placeholder="PT50 0000 0000 0000 0000 0000 0 (opcional)" />
          </UFormField>
        </div>

        <!-- Institution-specific -->
        <template v-if="selectedRole === 'institution'">
          <USeparator label="Dados da instituição" />
          <UFormField label="Comprovativo de estatuto" required>
            <FileUploadField
              v-model="entityState.url_comprovativo_estatuto"
              hint="PDF, JPG ou PNG — comprovativo de estatuto"
            />
          </UFormField>
        </template>

        <!-- Business-specific -->
        <template v-if="selectedRole === 'business'">
          <USeparator label="Dados do negócio" />
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <UFormField label="Certidão permanente" required class="sm:col-span-2">
              <FileUploadField
                v-model="entityState.url_certidao_permanente"
                hint="PDF, JPG ou PNG — certidão permanente do negócio"
              />
            </UFormField>

            <UFormField
              name="inicio_atividade"
              label="Data de início de atividade"
              required
              class="sm:col-span-2"
            >
              <UInput v-model="entityState.inicio_atividade" type="date" class="w-full" />
            </UFormField>
          </div>
        </template>
      </UForm>

      <template #footer>
        <div class="flex justify-end">
          <UButton
            form="step2-form"
            type="submit"
            label="Continuar"
            icon="i-lucide-arrow-right"
            trailing
            color="primary"
          />
        </div>
      </template>
    </UCard>

    <!-- Step 3: Location -->
    <UCard v-else-if="step === 3" class="shadow-lg">
      <template #header>
        <div class="flex items-center gap-3">
          <UButton
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="ghost"
            size="sm"
            @click="step = 2"
          />
          <div>
            <h2 class="text-lg font-semibold text-highlighted">
              Morada
            </h2>
            <p class="text-xs text-muted">
              Indique a localização da entidade — as coordenadas serão obtidas automaticamente
            </p>
          </div>
        </div>
      </template>

      <UForm
        id="step3-form"
        :schema="locationSchema"
        :state="locationState"
        class="space-y-4"
        @submit="onStep3Submit"
      >
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormField
            name="rua"
            label="Rua / Avenida"
            required
            class="sm:col-span-2"
          >
            <UInput v-model="locationState.rua" class="w-full" placeholder="Ex.: Praça Vasco da Gama" />
          </UFormField>

          <UFormField name="n_porta" label="Nº de porta" required>
            <UInput
              v-model="locationState.n_porta"
              class="w-full"
              placeholder="Ex.: 12"
              maxlength="5"
            />
          </UFormField>

          <UFormField name="codigo_postal" label="Código postal" required>
            <UInput v-model="locationState.codigo_postal" class="w-full font-mono" placeholder="4480-454" />
          </UFormField>

          <UFormField name="freguesia" label="Freguesia" required>
            <UInput v-model="locationState.freguesia" class="w-full" placeholder="Ex.: Vila do Conde" />
          </UFormField>

          <UFormField name="concelho" label="Concelho" required>
            <UInput v-model="locationState.concelho" class="w-full" placeholder="Ex.: Vila do Conde" />
          </UFormField>

          <UFormField name="distrito" label="Distrito" required>
            <UInput v-model="locationState.distrito" class="w-full" placeholder="Ex.: Porto" />
          </UFormField>

          <UFormField name="pais" label="País" required>
            <UInput v-model="locationState.pais" class="w-full" placeholder="Portugal" />
          </UFormField>
        </div>
      </UForm>

      <template #footer>
        <div class="flex flex-col gap-2">
          <div class="flex justify-end">
            <UButton
              form="step3-form"
              type="submit"
              :label="selectedRole === 'business' ? 'Continuar' : 'Criar conta'"
              :icon="selectedRole === 'business' ? 'i-lucide-arrow-right' : 'i-lucide-user-plus'"
              :trailing="selectedRole === 'business'"
              color="primary"
              :loading="isSubmitting"
            />
          </div>
          <p class="text-xs text-muted text-center">
            Ao registar aceita os termos de utilização do SAM.
          </p>
        </div>
      </template>
    </UCard>

    <!-- Step 4: Offers (business only) -->
    <UCard v-else class="shadow-lg">
      <template #header>
        <div class="flex items-center justify-between gap-3 flex-wrap">
          <div class="flex items-center gap-3 min-w-0">
            <UButton
              icon="i-lucide-arrow-left"
              color="neutral"
              variant="ghost"
              size="sm"
              @click="step = 3"
            />
            <div>
              <h2 class="text-lg font-semibold text-highlighted">
                Ofertas
              </h2>
              <p class="text-xs text-muted">
                Adicione os serviços que o seu negócio disponibiliza. Pode adicionar mais tarde.
              </p>
            </div>
          </div>
          <UButton
            label="Adicionar"
            icon="i-lucide-plus"
            color="primary"
            variant="subtle"
            size="sm"
            @click="showAddOffer = !showAddOffer"
          />
        </div>
      </template>

      <div class="space-y-4">
        <p class="text-xs text-muted">
          Os negócios oferecem <strong>serviços</strong> à comunidade (apoio jurídico, consultas, transporte, etc.). Os bens essenciais são doados por cidadãos via painéis municipais.
        </p>

        <div v-if="showAddOffer" class="p-4 rounded-lg border border-default bg-elevated/30 space-y-3">
          <p class="text-xs font-semibold text-muted uppercase tracking-wide">
            Nova Categoria / Oferta
          </p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <UFormField
              label="Categoria"
              help="Escolha uma categoria existente ou crie uma nova."
            >
              <NegociosCategoryField
                v-model="newOfferCategory"
                v-model:tipo="newOfferTipo"
                :goods-services="goodsServices"
                :exclude="offers.map(o => o.tipo_bem_servico)"
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
          <p>Sem ofertas adicionadas (opcional)</p>
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
      </div>

      <template #footer>
        <div class="flex flex-col gap-2">
          <div class="flex justify-end">
            <UButton
              label="Criar conta"
              icon="i-lucide-user-plus"
              color="primary"
              :loading="isSubmitting"
              @click="onStep4Submit"
            />
          </div>
          <p class="text-xs text-muted text-center">
            Ao registar aceita os termos de utilização do SAM.
          </p>
        </div>
      </template>
    </UCard>
  </div>
</template>
