<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const toast = useToast()
const { isAdmin } = useAuth()

const open = ref(false)

const links = computed<NavigationMenuItem[][]>(() => {
  const notificacoesItem: NavigationMenuItem = {
    label: 'Notificações',
    icon: 'i-lucide-bell',
    to: '/inbox',
    onSelect: () => { open.value = false }
  }

  const mecenasItem: NavigationMenuItem = {
    label: 'Mecenas',
    icon: 'i-lucide-hand-coins',
    to: '/mecenas',
    type: 'trigger' as const,
    defaultOpen: false,
    children: isAdmin.value
      ? [
          {
            label: 'Todas as Doações',
            to: '/mecenas',
            exact: true,
            onSelect: () => { open.value = false }
          },
          {
            label: 'Doação Manual',
            to: '/mecenas/doacao_manual',
            onSelect: () => { open.value = false }
          }
        ]
      : [
          {
            label: 'As Minhas Doações',
            to: '/mecenas',
            exact: true,
            onSelect: () => { open.value = false }
          },
          {
            label: 'Nova Doação',
            to: '/mecenas/doacao',
            onSelect: () => { open.value = false }
          }
        ]
  }

  const definicoesItem: NavigationMenuItem = {
    label: 'Definições',
    to: '/settings',
    icon: 'i-lucide-settings',
    defaultOpen: true,
    type: 'trigger' as const,
    children: [
      {
        label: 'Geral',
        to: '/settings',
        exact: true,
        onSelect: () => { open.value = false }
      },
      {
        label: 'Membros',
        to: '/settings/members',
        onSelect: () => { open.value = false }
      },
      {
        label: 'Notificações',
        to: '/settings/notifications',
        onSelect: () => { open.value = false }
      },
      {
        label: 'Segurança',
        to: '/settings/security',
        onSelect: () => { open.value = false }
      }
    ]
  }

  if (!isAdmin.value) {
    return [[notificacoesItem, mecenasItem, definicoesItem]]
  }

  return [[
    {
      label: 'Início',
      icon: 'i-lucide-house',
      to: '/',
      exact: true,
      onSelect: () => { open.value = false }
    },
    notificacoesItem,
    mecenasItem,
    {
      label: 'Registo de pedidos',
      icon: 'i-lucide-clipboard-list',
      onSelect: () => { open.value = false }
    },
    {
      label: 'Doações de cidadãos',
      icon: 'i-lucide-heart-handshake',
      onSelect: () => { open.value = false }
    },
    {
      label: 'Registo de negócios',
      icon: 'i-lucide-briefcase',
      onSelect: () => { open.value = false }
    },
    {
      label: 'Estado de equipamentos',
      icon: 'i-lucide-monitor-cog',
      onSelect: () => { open.value = false }
    },
    {
      label: 'Utilizadores',
      icon: 'i-lucide-users',
      to: '/customers',
      onSelect: () => { open.value = false }
    },
    definicoesItem
  ]]
})

const groups = computed(() => [
  {
    id: 'links',
    label: 'Ir para',
    items: links.value.flat()
  },
  {
    id: 'code',
    label: 'Repositórios',
    items: [
      {
        id: 'frontend',
        label: 'Ver código front-end',
        icon: 'i-simple-icons-github',
        to: 'https://github.com/amorima/p2-sam-frontend',
        target: '_blank'
      },
      {
        id: 'backend',
        label: 'Ver código back-end',
        icon: 'i-simple-icons-github',
        to: 'https://github.com/amorima/p2-sam-backend',
        target: '_blank'
      },
      {
        id: 'data-generator',
        label: 'Ver código de geração de dados',
        icon: 'i-simple-icons-github',
        to: 'https://github.com/amorima/p2-SAM-data-generator',
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
          label="Pesquisar..."
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

    <UDashboardSearch :groups="groups" placeholder="Escreva um comando ou pesquise" />

    <slot />

    <NotificationsSlideover />
  </UDashboardGroup>
</template>
