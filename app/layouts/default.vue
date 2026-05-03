<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()
const toast = useToast()

const open = ref(false)

const links = [
  [
    {
      label: 'Início',
      icon: 'i-lucide-house',
      to: '/',
      exact: true,
      onSelect: () => {
        open.value = false
      }
    },
    {
      label: 'Notificações',
      icon: 'i-lucide-bell',
      to: '/inbox',
      onSelect: () => {
        open.value = false
      }
    },
    {
      label: 'Registo de doações',
      icon: 'i-lucide-hand-coins',
      onSelect: () => {
        open.value = false
      }
    },
    {
      label: 'Registo de pedidos',
      icon: 'i-lucide-clipboard-list',
      onSelect: () => {
        open.value = false
      }
    },
    {
      label: 'Doações de cidadãos',
      icon: 'i-lucide-heart-handshake',
      onSelect: () => {
        open.value = false
      }
    },
    {
      label: 'Registo de negócios',
      icon: 'i-lucide-briefcase',
      onSelect: () => {
        open.value = false
      }
    },
    {
      label: 'Estado de equipamentos',
      icon: 'i-lucide-monitor-cog',
      onSelect: () => {
        open.value = false
      }
    },
    {
      label: 'Utilizadores',
      icon: 'i-lucide-users',
      to: '/customers',
      onSelect: () => {
        open.value = false
      }
    },
    {
      label: 'Definições',
      to: '/settings',
      icon: 'i-lucide-settings',
      defaultOpen: true,
      type: 'trigger',
      children: [
        {
          label: 'Geral',
          to: '/settings',
          exact: true,
          onSelect: () => {
            open.value = false
          }
        },
        {
          label: 'Membros',
          to: '/settings/members',
          onSelect: () => {
            open.value = false
          }
        },
        {
          label: 'Notificações',
          to: '/settings/notifications',
          onSelect: () => {
            open.value = false
          }
        },
        {
          label: 'Segurança',
          to: '/settings/security',
          onSelect: () => {
            open.value = false
          }
        }
      ]
    }
  ]
] satisfies NavigationMenuItem[][]

const groups = computed(() => [
  {
    id: 'links',
    label: 'Ir para',
    items: links.flat()
  },
  {
    id: 'code',
    label: 'Código',
    items: [
      {
        id: 'source',
        label: 'Ver o código da página',
        icon: 'i-simple-icons-github',
        to: `https://github.com/nuxt-ui-templates/dashboard/blob/main/app/pages${route.path === '/' ? '/index' : route.path}.vue`,
        target: '_blank'
      }
    ]
  }
])

onMounted(async () => {
  const cookie = useCookie('cookie-consent')
  if (cookie.value === 'accepted') {
    return
  }

  toast.add({
    title:
      'Usamos cookies próprios para melhorar a tua experiência no nosso sítio.',
    duration: 0,
    close: false,
    actions: [
      {
        label: 'Aceitar',
        color: 'neutral',
        variant: 'outline',
        onClick: () => {
          cookie.value = 'accepted'
        }
      },
      {
        label: 'Recusar',
        color: 'neutral',
        variant: 'ghost'
      }
    ]
  })
})
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="default"
      v-model:open="open"
      collapsible
      resizable
      class="bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <template #header="{ collapsed }">
        <TeamsMenu :collapsed="collapsed" />
      </template>

      <template #default="{ collapsed }">
        <UDashboardSearchButton
          :collapsed="collapsed"
          placeholder="Pesquisar"
          class="bg-transparent ring-default"
        />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[0]"
          orientation="vertical"
          tooltip
          popover
        />
      </template>

      <template #footer="{ collapsed }">
        <UserMenu :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>

    <UDashboardSearch :groups="groups" />

    <slot />

    <NotificationsSlideover />
  </UDashboardGroup>
</template>
