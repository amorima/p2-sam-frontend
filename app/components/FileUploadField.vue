<script setup lang="ts">
// Reusable document upload field. Replaces "paste a URL" inputs: the user picks
// a file, it is streamed straight to MinIO (bucket `files`) and the resulting
// public URL is stored as the field value. Shows an elegant loading state while
// the upload is in flight.
const props = withDefaults(defineProps<{
  modelValue?: string
  accept?: string
  bucket?: 'files' | 'avatar'
  hint?: string
}>(), {
  modelValue: '',
  accept: '.pdf,.png,.jpg,.jpeg,application/pdf,image/*',
  bucket: 'files',
  hint: 'PDF ou imagem'
})

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const toast = useToast()
const input = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
const uploadedName = ref('')

const fileLabel = computed(() => {
  if (uploadedName.value) return uploadedName.value
  if (props.modelValue) {
    try {
      return decodeURIComponent(props.modelValue.split('/').pop() || 'Documento carregado')
    } catch {
      return 'Documento carregado'
    }
  }
  return ''
})

function pick() {
  input.value?.click()
}

function sanitize(name: string) {
  const dot = name.lastIndexOf('.')
  const base = (dot > 0 ? name.slice(0, dot) : name).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 60)
  const ext = dot > 0 ? name.slice(dot) : ''
  return `${Date.now()}_${base}${ext}`
}

async function onChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  uploading.value = true
  try {
    const form = new FormData()
    form.append('file', file)
    const nome = sanitize(file.name)
    const res = await $fetch<{ url: string, fileName: string }>(
      `/api/upload/${props.bucket}?nome=${encodeURIComponent(nome)}`,
      { method: 'POST', body: form }
    )
    uploadedName.value = file.name
    emit('update:modelValue', res.url)
    toast.add({ title: 'Ficheiro carregado', description: file.name, icon: 'i-lucide-check', color: 'success' })
  } catch (err: unknown) {
    const msg = (err as { statusMessage?: string, data?: { statusMessage?: string } })?.statusMessage
      ?? (err as { data?: { statusMessage?: string } })?.data?.statusMessage
      ?? 'Não foi possível carregar o ficheiro.'
    toast.add({ title: 'Erro no upload', description: msg, icon: 'i-lucide-x', color: 'error' })
  } finally {
    uploading.value = false
    if (input.value) input.value.value = ''
  }
}

function remove() {
  uploadedName.value = ''
  emit('update:modelValue', '')
}
</script>

<template>
  <div class="w-full">
    <input
      ref="input"
      type="file"
      :accept="accept"
      class="hidden"
      @change="onChange"
    >

    <!-- Uploading state -->
    <div
      v-if="uploading"
      class="relative overflow-hidden flex items-center gap-3 rounded-lg border border-primary/40 bg-primary/5 px-4 py-3"
    >
      <UIcon name="i-lucide-loader-circle" class="size-5 text-primary animate-spin shrink-0" />
      <div class="min-w-0">
        <p class="text-sm font-medium text-highlighted">
          A carregar ficheiro…
        </p>
        <p class="text-xs text-muted">
          Aguarde enquanto enviamos o documento.
        </p>
      </div>
      <span class="upload-shimmer absolute inset-x-0 bottom-0 h-0.5" />
    </div>

    <!-- Uploaded state -->
    <div
      v-else-if="modelValue"
      class="flex items-center gap-3 rounded-lg border border-success/40 bg-success/5 px-4 py-3"
    >
      <UIcon name="i-lucide-file-check-2" class="size-5 text-success shrink-0" />
      <div class="min-w-0 flex-1">
        <p class="text-sm font-medium text-highlighted truncate">
          {{ fileLabel }}
        </p>
        <a
          :href="modelValue"
          target="_blank"
          rel="noopener"
          class="text-xs text-primary hover:underline"
        >
          Ver documento
        </a>
      </div>
      <UButton
        icon="i-lucide-refresh-cw"
        size="xs"
        color="neutral"
        variant="ghost"
        title="Substituir"
        @click="pick"
      />
      <UButton
        icon="i-lucide-x"
        size="xs"
        color="error"
        variant="ghost"
        title="Remover"
        @click="remove"
      />
    </div>

    <!-- Empty state -->
    <button
      v-else
      type="button"
      class="upload-dropzone group w-full flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-default hover:border-primary/60 hover:bg-primary/5 transition-colors px-4 py-6 text-center"
      @click="pick"
    >
      <UIcon name="i-lucide-upload-cloud" class="size-7 text-muted group-hover:text-primary transition-colors" />
      <span class="text-sm font-medium text-highlighted">Carregar ficheiro</span>
      <span class="text-xs text-muted">{{ hint }}</span>
    </button>
  </div>
</template>

<style scoped>
.upload-shimmer {
  background: linear-gradient(90deg, transparent, var(--ui-primary, #3b82f6), transparent);
  background-size: 40% 100%;
  background-repeat: no-repeat;
  animation: upload-shimmer 1.1s ease-in-out infinite;
}
@keyframes upload-shimmer {
  0% { background-position: -40% 0; }
  100% { background-position: 140% 0; }
}
</style>
