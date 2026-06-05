<script setup lang="ts">
import type { GoodsService } from '~/utils/domain'

definePageMeta({ middleware: 'admin-only' })

const toast = useToast()

const { data, status, refresh } = await useFetch<{ items: GoodsService[] }>('/api/goods-services?limit=500', {
  lazy: true, server: false
})

const items = computed<GoodsService[]>(() => data.value?.items ?? [])
const bens = computed(() => items.value.filter(g => g.tipo_bem === 'BEM'))
const servicos = computed(() => items.value.filter(g => g.tipo_bem === 'SERVICO'))

const showForm = ref(false)
const newNome = ref('')
const newTipo = ref<'BEM' | 'SERVICO'>('SERVICO')
const isSubmitting = ref(false)

const confirmOpen = ref(false)
const pendingDelete = ref<string | null>(null)
const isDeleting = ref(false)

const tipoOptions = [
  { label: 'Serviço', value: 'SERVICO' },
  { label: 'Bem', value: 'BEM' }
]

async function addItem() {
  const nome = newNome.value.trim()
  if (!nome) {
    toast.add({ title: 'Nome obrigatório', color: 'error' })
    return
  }
  isSubmitting.value = true
  try {
    await $fetch('/api/goods-services', {
      method: 'POST',
      body: { tipo_bem_servico: nome, tipo_bem: newTipo.value.toLowerCase() }
    })
    toast.add({ title: 'Adicionado', description: nome, color: 'success' })
    newNome.value = ''
    newTipo.value = 'SERVICO'
    showForm.value = false
    await refresh()
  } catch (err: unknown) {
    const e = err as { data?: { errors?: Array<Record<string, string>> } }
    const msg = e?.data?.errors?.[0]?.tipo_bem_servico ?? 'Erro ao adicionar'
    toast.add({ title: msg, color: 'error' })
  } finally {
    isSubmitting.value = false
  }
}

function removeItem(tipo_bem_servico: string) {
  pendingDelete.value = tipo_bem_servico
  confirmOpen.value = true
}

async function confirmDelete() {
  if (!pendingDelete.value) return
  isDeleting.value = true
  try {
    await $fetch(`/api/goods-services/${encodeURIComponent(pendingDelete.value)}`, { method: 'DELETE' })
    toast.add({ title: 'Eliminado', description: pendingDelete.value, color: 'success' })
    confirmOpen.value = false
    pendingDelete.value = null
    await refresh()
  } catch {
    toast.add({ title: 'Erro ao eliminar', color: 'error' })
  } finally {
    isDeleting.value = false
  }
}
</script>

<template>
  <UDashboardPanel id="bens-servicos">
    <template #header>
      <UDashboardNavbar title="Bens e Serviços">
        <template #leading>
          <UDashboardSidebarCollapse />
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
            label="Adicionar"
            icon="i-lucide-plus"
            color="primary"
            @click="showForm = !showForm"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- Add form -->
      <div v-if="showForm" class="mb-6 p-4 rounded-lg border border-default bg-elevated/30 space-y-3 max-w-lg">
        <p class="text-sm font-semibold text-highlighted">
          Novo item
        </p>
        <div class="flex gap-3">
          <UInput
            v-model="newNome"
            placeholder="Nome do bem ou serviço"
            class="flex-1"
            @keydown.enter="addItem"
          />
          <USelect
            v-model="newTipo"
            :items="tipoOptions"
            value-key="value"
            label-key="label"
            class="w-36"
          />
        </div>
        <div class="flex justify-end gap-2">
          <UButton
            label="Cancelar"
            color="neutral"
            variant="subtle"
            @click="showForm = false"
          />
          <UButton
            label="Adicionar"
            color="primary"
            :loading="isSubmitting"
            @click="addItem"
          />
        </div>
      </div>

      <div v-if="status === 'pending'" class="flex items-center justify-center py-16 text-muted gap-2">
        <UIcon name="i-lucide-loader-circle" class="animate-spin" />
        A carregar…
      </div>

      <div v-else class="grid lg:grid-cols-2 gap-6">
        <!-- Serviços -->
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-hand-helping" class="text-primary" />
              <h3 class="font-semibold">
                Serviços ({{ servicos.length }})
              </h3>
            </div>
          </template>
          <ul class="divide-y divide-default">
            <li
              v-for="g in servicos"
              :key="g.tipo_bem_servico"
              class="flex items-center justify-between py-2 gap-2"
            >
              <span class="text-sm">{{ g.tipo_bem_servico }}</span>
              <UButton
                icon="i-lucide-trash-2"
                size="xs"
                color="error"
                variant="ghost"
                @click="removeItem(g.tipo_bem_servico)"
              />
            </li>
            <li v-if="!servicos.length" class="py-4 text-center text-sm text-muted">
              Sem serviços registados.
            </li>
          </ul>
        </UCard>

        <!-- Bens -->
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-package" class="text-primary" />
              <h3 class="font-semibold">
                Bens ({{ bens.length }})
              </h3>
            </div>
          </template>
          <ul class="divide-y divide-default">
            <li
              v-for="g in bens"
              :key="g.tipo_bem_servico"
              class="flex items-center justify-between py-2 gap-2"
            >
              <span class="text-sm">{{ g.tipo_bem_servico }}</span>
              <UButton
                icon="i-lucide-trash-2"
                size="xs"
                color="error"
                variant="ghost"
                @click="removeItem(g.tipo_bem_servico)"
              />
            </li>
            <li v-if="!bens.length" class="py-4 text-center text-sm text-muted">
              Sem bens registados.
            </li>
          </ul>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>

  <UModal
    v-model:open="confirmOpen"
    title="Eliminar item"
    :description="`Tens a certeza que queres eliminar &quot;${pendingDelete}&quot;? Esta ação não pode ser anulada.`"
  >
    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton
          label="Cancelar"
          color="neutral"
          variant="subtle"
          :disabled="isDeleting"
          @click="confirmOpen = false"
        />
        <UButton
          label="Eliminar"
          color="error"
          variant="solid"
          :loading="isDeleting"
          @click="confirmDelete"
        />
      </div>
    </template>
  </UModal>
</template>
