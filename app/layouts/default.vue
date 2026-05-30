<script setup lang="ts">
import type { NavigationMenuItem, CommandPaletteItem } from '@nuxt/ui'

const toast = useToast()
const { isAdmin, isInstitution, isBusiness } = useAuth()
const { unreadCount } = useNotifications()
useDashboard()

const open = ref(false)

const links = computed<NavigationMenuItem[][]>(() => {
  const notificacoesItem: NavigationMenuItem = {
    label: 'Notificações',
    icon: 'i-lucide-bell',
    to: '/inbox',
    badge: unreadCount.value > 0 ? String(unreadCount.value > 99 ? '99+' : unreadCount.value) : undefined,
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
          },
          {
            label: 'Registar Mecenas',
            to: '/mecenas/registo',
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

  const instituicoesItem: NavigationMenuItem = {
    label: 'Instituições',
    icon: 'i-lucide-clipboard-list',
    to: '/instituicoes',
    type: 'trigger' as const,
    defaultOpen: false,
    children: isAdmin.value
      ? [
          {
            label: 'Todos os Pedidos',
            to: '/instituicoes',
            exact: true,
            onSelect: () => { open.value = false }
          },
          {
            label: 'Aprovação de Pedidos',
            to: '/instituicoes/aprovacao',
            onSelect: () => { open.value = false }
          },
          {
            label: 'Pedido Manual',
            to: '/instituicoes/pedido_manual',
            onSelect: () => { open.value = false }
          },
          {
            label: 'Registar Instituição',
            to: '/instituicoes/registo',
            onSelect: () => { open.value = false }
          }
        ]
      : [
          {
            label: 'Os Meus Pedidos',
            to: '/instituicoes',
            exact: true,
            onSelect: () => { open.value = false }
          },
          {
            label: 'Novo Pedido',
            to: '/instituicoes/pedido',
            onSelect: () => { open.value = false }
          }
        ]
  }

  const negociosItem: NavigationMenuItem = {
    label: 'Negócios',
    icon: 'i-lucide-briefcase',
    to: '/negocios',
    type: 'trigger' as const,
    defaultOpen: false,
    children: isAdmin.value
      ? [
          {
            label: 'Pedidos',
            to: '/negocios',
            exact: true,
            onSelect: () => { open.value = false }
          },
          {
            label: 'Gestão de Negócios',
            to: '/negocios/gestao',
            onSelect: () => { open.value = false }
          },
          {
            label: 'Registo Manual',
            to: '/negocios/registo',
            onSelect: () => { open.value = false }
          }
        ]
      : [
          {
            label: 'Pedidos',
            to: '/negocios',
            exact: true,
            onSelect: () => { open.value = false }
          },
          {
            label: 'O Meu Negócio',
            to: '/negocios/meu',
            onSelect: () => { open.value = false }
          }
        ]
  }

  if (isInstitution.value) {
    return [[notificacoesItem, instituicoesItem]]
  }

  if (isBusiness.value) {
    return [[notificacoesItem, negociosItem]]
  }

  if (!isAdmin.value) {
    return [[notificacoesItem, mecenasItem]]
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
    {
      label: 'Doações de cidadãos',
      icon: 'i-lucide-heart-handshake',
      to: '/doacoes',
      onSelect: () => { open.value = false }
    },
    mecenasItem,
    instituicoesItem,
    negociosItem,
    {
      label: 'Estado de equipamentos',
      icon: 'i-lucide-monitor-cog',
      to: '/equipamentos',
      onSelect: () => { open.value = false }
    },
    {
      label: 'Utilizadores',
      icon: 'i-lucide-users',
      to: '/customers',
      onSelect: () => { open.value = false }
    },
    {
      label: 'Bens e Serviços',
      icon: 'i-lucide-package',
      to: '/bens-servicos',
      onSelect: () => { open.value = false }
    }
  ]]
})

const groups = computed(() => [
  {
    id: 'links',
    label: 'Ir para',
    items: links.value.flat() as unknown as CommandPaletteItem[]
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
  </UDashboardGroup>
</template>
