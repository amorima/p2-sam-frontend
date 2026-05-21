<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

const props = defineProps<{
  collapsed?: boolean
}>()

const colorMode = useColorMode()
const appConfig = useAppConfig()
const userProfile = useUserProfile()
const { logout } = useAuth()
const isCollapsed = computed(() => !!props.collapsed)

const displayName = computed(() => userProfile.name.value)
const displayAvatar = computed(() => userProfile.avatar.value)

const colors = [
  'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald',
  'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple',
  'fuchsia', 'pink', 'rose'
]
const neutrals = ['slate', 'gray', 'zinc', 'neutral', 'stone']

const primaryColors = {
  red: 'Vermelho', orange: 'Laranja', amber: 'Âmbar', yellow: 'Amarelo',
  lime: 'Lima', green: 'Verde', emerald: 'Esmeralda', teal: 'Azul-petróleo',
  cyan: 'Ciano', sky: 'Céu', blue: 'Azul', indigo: 'Índigo',
  violet: 'Violeta', purple: 'Roxo', fuchsia: 'Fúcsia', pink: 'Rosa',
  rose: 'Rosa-escuro'
} as const

const neutralColors = {
  slate: 'Lousa', gray: 'Cinzento', zinc: 'Zinco',
  neutral: 'Neutro', stone: 'Pedra'
} as const

const items = computed<DropdownMenuItem[][]>(() => [
  [
    {
      type: 'label',
      label: displayName.value,
      avatar: displayAvatar.value !== '/user.svg'
        ? { src: displayAvatar.value, alt: displayName.value }
        : { alt: displayName.value }
    }
  ],
  [
    {
      label: 'Perfil',
      icon: 'i-lucide-user'
    },
    {
      label: 'Definições',
      icon: 'i-lucide-settings',
      to: '/settings'
    }
  ],
  [
    {
      label: 'Tema',
      icon: 'i-lucide-palette',
      children: [
        {
          label: 'Cor primária',
          slot: 'chip',
          chip: appConfig.ui.colors.primary,
          content: { align: 'center', collisionPadding: 16 },
          children: colors.map(color => ({
            label: primaryColors[color as keyof typeof primaryColors],
            chip: color,
            slot: 'chip',
            checked: appConfig.ui.colors.primary === color,
            type: 'checkbox',
            onSelect: (e: Event) => {
              e.preventDefault()
              appConfig.ui.colors.primary = color
            }
          }))
        },
        {
          label: 'Cor neutra',
          slot: 'chip',
          chip: appConfig.ui.colors.neutral === 'neutral' ? 'old-neutral' : appConfig.ui.colors.neutral,
          content: { align: 'end', collisionPadding: 16 },
          children: neutrals.map(color => ({
            label: neutralColors[color as keyof typeof neutralColors],
            chip: color === 'neutral' ? 'old-neutral' : color,
            slot: 'chip',
            type: 'checkbox',
            checked: appConfig.ui.colors.neutral === color,
            onSelect: (e: Event) => {
              e.preventDefault()
              appConfig.ui.colors.neutral = color
            }
          }))
        }
      ]
    },
    {
      label: 'Aparência',
      icon: 'i-lucide-sun-moon',
      children: [
        {
          label: 'Claro',
          icon: 'i-lucide-sun',
          type: 'checkbox',
          checked: colorMode.value === 'light',
          onSelect(e: Event) {
            e.preventDefault()
            colorMode.preference = 'light'
          }
        },
        {
          label: 'Escuro',
          icon: 'i-lucide-moon',
          type: 'checkbox',
          checked: colorMode.value === 'dark',
          onUpdateChecked(checked: boolean) {
            if (checked) colorMode.preference = 'dark'
          },
          onSelect(e: Event) {
            e.preventDefault()
          }
        }
      ]
    }
  ],
  [
    {
      label: 'Terminar sessão',
      icon: 'i-lucide-log-out',
      onSelect: () => logout()
    }
  ]
])
</script>

<template>
  <UDropdownMenu
    :items="items"
    :content="{ align: 'center', collisionPadding: 12 }"
    :ui="{
      content: isCollapsed ? 'w-48' : 'w-(--reka-dropdown-menu-trigger-width)'
    }"
  >
    <!-- Trigger button with theme-adaptive avatar -->
    <UButton
      :label="isCollapsed ? undefined : displayName"
      :trailing-icon="isCollapsed ? undefined : 'i-lucide-chevrons-up-down'"
      color="neutral"
      variant="ghost"
      block
      :square="isCollapsed"
      class="data-[state=open]:bg-elevated"
      :ui="{ trailingIcon: 'text-dimmed' }"
    >
      <template #leading>
        <AppUserAvatar :src="displayAvatar" :alt="displayName" size="xs" />
      </template>
    </UButton>

    <template #chip-leading="{ item }">
      <div class="inline-flex items-center justify-center shrink-0 size-5">
        <span
          class="rounded-full ring ring-bg bg-(--chip-light) dark:bg-(--chip-dark) size-2"
          :style="{
            '--chip-light': `var(--color-${(item as any).chip}-500)`,
            '--chip-dark': `var(--color-${(item as any).chip}-400)`
          }"
        />
      </div>
    </template>
  </UDropdownMenu>
</template>
