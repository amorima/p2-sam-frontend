<script setup lang="ts">
const props = defineProps<{
  src?: string | null
  alt?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
}>()

const isDefault = computed(() => !props.src || props.src === '/user.svg')

const sizeClass: Record<string, string> = {
  'xs': 'size-6',
  'sm': 'size-8',
  'md': 'size-10',
  'lg': 'size-12',
  'xl': 'size-16',
  '2xl': 'size-20',
  '3xl': 'size-24'
}

const containerClass = computed(
  () => sizeClass[props.size ?? 'sm'] ?? sizeClass.sm
)
</script>

<template>
  <UAvatar
    v-if="!isDefault"
    :src="src ?? undefined"
    :alt="alt"
    :size="(size as any) ?? 'sm'"
  />
  <div
    v-else
    :class="[containerClass, 'rounded-full bg-elevated border border-default flex items-center justify-center shrink-0']"
    :aria-label="alt"
  >
    <!-- Inline SVG so currentColor inherits from text-muted and adapts to the active theme -->
    <svg
      viewBox="0 0 128 128"
      class="size-[62%] fill-current text-muted"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M30,49c0,18.7,15.3,34,34,34s34-15.3,34-34S82.7,15,64,15S30,30.3,30,49z
        M90,49c0,14.3-11.7,26-26,26S38,63.3,38,49s11.7-26,26-26S90,34.7,90,49z"
      />
      <path
        d="M24.4,119.4C35,108.8,49,103,64,103s29,5.8,39.6,16.4l5.7-5.7
        C97.2,101.7,81.1,95,64,95s-33.2,6.7-45.3,18.7L24.4,119.4z"
      />
    </svg>
  </div>
</template>
