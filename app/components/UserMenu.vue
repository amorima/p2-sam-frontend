<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

defineProps<{
  collapsed?: boolean
}>()

const colorMode = useColorMode()
const appConfig = useAppConfig()

const colors = [
  'red',
  'orange',
  'amber',
  'yellow',
  'lime',
  'green',
  'emerald',
  'teal',
  'cyan',
  'sky',
  'blue',
  'indigo',
  'violet',
  'purple',
  'fuchsia',
  'pink',
  'rose'
]
const neutrals = ['slate', 'gray', 'zinc', 'neutral', 'stone']

const user = ref({
  name: 'Benjamin Canac',
  avatar: {
    src: 'https://github.com/benjamincanac.png',
    alt: 'Benjamin Canac'
  }
})

const primaryColors = {
  red: 'Vermelho',
  orange: 'Laranja',
  amber: 'Âmbar',
  yellow: 'Amarelo',
  lime: 'Lima',
  green: 'Verde',
  emerald: 'Esmeralda',
  teal: 'Azul-petróleo',
  cyan: 'Ciano',
  sky: 'Céu',
  blue: 'Azul',
  indigo: 'Índigo',
  violet: 'Violeta',
  purple: 'Roxo',
  fuchsia: 'Fúcsia',
  pink: 'Rosa',
  rose: 'Rosa-escuro'
} as const

const neutralColors = {
  slate: 'Lousa',
  gray: 'Cinzento',
  zinc: 'Zinco',
  neutral: 'Neutro',
  stone: 'Pedra'
} as const

const items = computed<DropdownMenuItem[][]>(() => [
  [
    {
      type: 'label',
      label: user.value.name,
      avatar: user.value.avatar
    }
  ],
  [
    {
      label: 'Perfil',
      icon: 'i-lucide-user'
    },
    {
      label: 'Faturação',
      icon: 'i-lucide-credit-card'
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
          content: {
            align: 'center',
            collisionPadding: 16
          },
          children: colors.map(color => ({
            label: primaryColors[color as keyof typeof primaryColors],
            chip: color,
            slot: 'chip',
            checked: appConfig.ui.colors.primary === color,
            type: 'checkbox',
            onSelect: (e) => {
              e.preventDefault()

              appConfig.ui.colors.primary = color
            }
          }))
        },
        {
          label: 'Cor neutra',
          slot: 'chip',
          chip:
            appConfig.ui.colors.neutral === 'neutral'
              ? 'old-neutral'
              : appConfig.ui.colors.neutral,
          content: {
            align: 'end',
            collisionPadding: 16
          },
          children: neutrals.map(color => ({
            label: neutralColors[color as keyof typeof neutralColors],
            chip: color === 'neutral' ? 'old-neutral' : color,
            slot: 'chip',
            type: 'checkbox',
            checked: appConfig.ui.colors.neutral === color,
            onSelect: (e) => {
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
            if (checked) {
              colorMode.preference = 'dark'
            }
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
      label: 'Modelos',
      icon: 'i-lucide-layout-template',
      children: [
        {
          label: 'Inicial',
          to: 'https://starter-template.nuxt.dev/'
        },
        {
          label: 'Página de destino',
          to: 'https://landing-template.nuxt.dev/'
        },
        {
          label: 'Documentação',
          to: 'https://docs-template.nuxt.dev/'
        },
        {
          label: 'SaaS',
          to: 'https://saas-template.nuxt.dev/'
        },
        {
          label: 'Painel',
          to: 'https://dashboard-template.nuxt.dev/',
          color: 'primary',
          checked: true,
          type: 'checkbox'
        },
        {
          label: 'Chat',
          to: 'https://chat-template.nuxt.dev/'
        },
        {
          label: 'Portefólio',
          to: 'https://portfolio-template.nuxt.dev/'
        },
        {
          label: 'Registo de alterações',
          to: 'https://changelog-template.nuxt.dev/'
        }
      ]
    }
  ],
  [
    {
      label: 'Documentação',
      icon: 'i-lucide-book-open',
      to: 'https://ui.nuxt.com/docs/getting-started/installation/nuxt',
      target: '_blank'
    },
    {
      label: 'Repositório GitHub',
      icon: 'i-simple-icons-github',
      to: 'https://github.com/nuxt-ui-templates/dashboard',
      target: '_blank'
    },
    {
      label: 'Terminar sessão',
      icon: 'i-lucide-log-out'
    }
  ]
])
</script>

<template>
  <UDropdownMenu
    :items="items"
    :content="{ align: 'center', collisionPadding: 12 }"
    :ui="{
      content: collapsed ? 'w-48' : 'w-(--reka-dropdown-menu-trigger-width)'
    }"
  >
    <UButton
      v-bind="{
        ...user,
        label: collapsed ? undefined : user?.name,
        trailingIcon: collapsed ? undefined : 'i-lucide-chevrons-up-down'
      }"
      color="neutral"
      variant="ghost"
      block
      :square="collapsed"
      class="data-[state=open]:bg-elevated"
      :ui="{
        trailingIcon: 'text-dimmed'
      }"
    />

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
