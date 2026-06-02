<script setup lang="ts">
const toast = useToast()

async function copyCode(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.add({
      title: 'Copiado',
      description: 'Código copiado para a área de transferência.',
      color: 'success',
      icon: 'i-lucide-check',
      duration: 2000
    })
  } catch {
    // silently ignore
  }
}

const sections = [
  { id: 'autenticacao', label: 'Autenticação' },
  { id: 'url-base', label: 'URL Base e Formato' },
  { id: 'erros', label: 'Erros' },
  { id: 'mecenas', label: 'Mecenas' },
  { id: 'instituicoes', label: 'Instituições' },
  { id: 'negocios', label: 'Negócios' },
  { id: 'notificacoes', label: 'Notificações' },
  { id: 'perfil', label: 'Perfil (Auth)' }
]

function scrollTo(id: string) {
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// Code snippets
const permanentTokenExample = `sam_a3f8c2e1d4b7a9f0e5c2d8b1a6f3e9c0d7b4a2f8e1c5d9b3a7f0e4c8d2b6a1f5e3`

const permanentTokenCurl = `# Substituir <token> pelo token obtido em Definições → API
curl -H "Authorization: Bearer sam_a3f8c2e1..." \\
  https://apisam.netdw.tech/patrons/123456789`

const loginCurl = `curl -X POST https://apisam.netdw.tech/users/login \\
  -H "Content-Type: application/json" \\
  -d '{"nif_nipc": "123456789", "password": "a-sua-password"}'`

const loginResponse = `{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "role": "patron",
  "nif": "123456789",
  "name": "Nome da Entidade"
}`

const refreshCurl = `curl -X POST https://apisam.netdw.tech/users/refresh \\
  -H "Content-Type: application/json" \\
  -d '{"refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}'`

const refreshResponse = `{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}`

const errorBody = `{
  "description": "mensagem de erro descritiva"
}`

// Patrons
const getPatronCurl = `curl -H "Authorization: Bearer <token>" \\
  https://apisam.netdw.tech/patrons/123456789`

const getPatronResponse = `{
  "nif_nipc": "123456789",
  "nome_entidade": "João Silva",
  "email_login": "joao@exemplo.pt",
  "iban": "PT50000201231234567890154",
  "blocked": false,
  "locations": [
    { "id": 1, "morada": "Rua das Flores, 10", "cidade": "Porto", "codigo_postal": "4000-001" }
  ],
  "contacts": [
    { "id": 1, "tipo": "email", "valor": "joao@exemplo.pt" }
  ]
}`

const patchPatronBody = `{
  "nome_entidade": "João Manuel Silva",
  "email_login": "joao.novo@exemplo.pt",
  "iban": "PT50000201231234567890154"
}`

const patchPatronCurl = `curl -X PATCH https://apisam.netdw.tech/patrons/123456789 \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{"nome_entidade": "João Manuel Silva"}'`

const patchPatronResponse = `{
  "nif_nipc": "123456789",
  "nome_entidade": "João Manuel Silva",
  "email_login": "joao.novo@exemplo.pt",
  "iban": "PT50000201231234567890154",
  "blocked": false,
  "locations": [],
  "contacts": []
}`

const getDonationsCurl = `curl -H "Authorization: Bearer <token>" \\
  https://apisam.netdw.tech/patrons/123456789/donations`

const getDonationsResponse = `[
  {
    "id_doacao": 42,
    "tipo": "NUMERARIO",
    "valor": 500.00,
    "data": "2025-03-15T10:00:00.000Z",
    "estado": "ACEITE",
    "nif_nipc": "123456789"
  },
  {
    "id_doacao": 43,
    "tipo": "ESPECIE",
    "valor": null,
    "data": "2025-04-01T09:00:00.000Z",
    "estado": "PENDENTE",
    "nif_nipc": "123456789"
  }
]`

const postDonationBody = `{
  "tipo": "NUMERARIO",
  "valor": 250.00,
  "data": "2025-05-31T12:00:00.000Z",
  "nif_nipc": "123456789"
}`

const postDonationCurl = `curl -X POST https://apisam.netdw.tech/patrons/123456789/donations \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{"tipo":"NUMERARIO","valor":250.00,"data":"2025-05-31T12:00:00.000Z","nif_nipc":"123456789"}'`

const postDonationResponse = `{
  "id_doacao": 44,
  "tipo": "NUMERARIO",
  "valor": 250.00,
  "data": "2025-05-31T12:00:00.000Z",
  "estado": "PENDENTE",
  "nif_nipc": "123456789"
}`

// Institutions
const getInstitutionCurl = `curl -H "Authorization: Bearer <token>" \\
  https://apisam.netdw.tech/institutions/500123456`

const getInstitutionResponse = `{
  "nif_nipc": "500123456",
  "nome_entidade": "Banco Alimentar do Porto",
  "email_login": "info@bancoalimentar.pt",
  "geo_latitude": 41.1579,
  "geo_longitude": -8.6291,
  "url_comprovativo_estatuto": "https://cdn.exemplo.pt/estatuto.pdf",
  "locations": [
    { "id": 2, "morada": "Rua da Constituição, 200", "cidade": "Porto", "codigo_postal": "4200-192" }
  ],
  "contacts": [
    { "id": 3, "tipo": "telefone", "valor": "222 000 001" }
  ]
}`

const getNeedsCurl = `curl -H "Authorization: Bearer <token>" \\
  "https://apisam.netdw.tech/needs?nif=500123456"`

const getNeedsResponse = `[
  {
    "id_pedido": 10,
    "nif_nipc": "500123456",
    "nome_entidade": "Banco Alimentar do Porto",
    "data": "2025-05-20T08:00:00.000Z",
    "estado": "PENDENTE",
    "urgente": true,
    "items": [
      { "id": 5, "tipo_bem_servico": "Alimentos enlatados", "tipo_bem": "BEM" },
      { "id": 6, "tipo_bem_servico": "Transporte de mercadorias", "tipo_bem": "SERVICO" }
    ]
  }
]`

const postNeedBody = `{
  "nif_nipc": "500123456",
  "nome_entidade": "Banco Alimentar do Porto",
  "data": "2025-06-01T00:00:00.000Z",
  "estado": "PENDENTE",
  "urgente": false,
  "items": [
    { "tipo_bem_servico": "Roupas de inverno", "tipo_bem": "BEM" },
    { "tipo_bem_servico": "Serviço de limpeza", "tipo_bem": "SERVICO" }
  ]
}`

const postNeedCurl = `curl -X POST https://apisam.netdw.tech/needs \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{"nif_nipc":"500123456","nome_entidade":"Banco Alimentar do Porto","data":"2025-06-01T00:00:00.000Z","estado":"PENDENTE","urgente":false,"items":[{"tipo_bem_servico":"Roupas de inverno","tipo_bem":"BEM"}]}'`

const postNeedResponse = `{
  "id_pedido": 11,
  "nif_nipc": "500123456",
  "nome_entidade": "Banco Alimentar do Porto",
  "data": "2025-06-01T00:00:00.000Z",
  "estado": "PENDENTE",
  "urgente": false,
  "items": [
    { "id": 7, "tipo_bem_servico": "Roupas de inverno", "tipo_bem": "BEM" }
  ]
}`

const patchNeedBody = `{
  "estado": "ACEITE"
}`

const patchNeedCurl = `curl -X PATCH https://apisam.netdw.tech/needs/11 \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{"estado": "ACEITE"}'`

const patchNeedResponse = `{
  "id_pedido": 11,
  "estado": "ACEITE",
  "urgente": false
}`

// Business
const getBusinessCurl = `curl -H "Authorization: Bearer <token>" \\
  https://apisam.netdw.tech/business/501234567`

const getBusinessResponse = `{
  "nif_nipc": "501234567",
  "nome_entidade": "Empresa Exemplo Lda",
  "email_login": "geral@empresa.pt",
  "inicio_atividade": "2010-01-15",
  "url_certidao_permanente": "https://cdn.exemplo.pt/certidao.pdf",
  "geo_latitude": 38.7169,
  "geo_longitude": -9.1399,
  "offers": [
    {
      "id": 3,
      "tipo_bem_servico": "Consultoria jurídica",
      "descricao": "Apoio jurídico mensal para associações",
      "valor_total": 1200.00,
      "desconto": 50,
      "tipo_bem": "SERVICO"
    }
  ]
}`

const patchBusinessBody = `{
  "nome_entidade": "Empresa Exemplo SA",
  "email_login": "novo@empresa.pt"
}`

const patchBusinessCurl = `curl -X PATCH https://apisam.netdw.tech/business/501234567 \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{"nome_entidade": "Empresa Exemplo SA"}'`

const patchBusinessResponse = `{
  "nif_nipc": "501234567",
  "nome_entidade": "Empresa Exemplo SA",
  "email_login": "novo@empresa.pt"
}`

const postOfferBody = `{
  "tipo_bem_servico": "Consultoria fiscal",
  "descricao": "Apoio na declaração anual de IRC para IPSS",
  "valor_total": 800.00,
  "desconto": 75,
  "tipo_bem": "SERVICO"
}`

const postOfferCurl = `curl -X POST https://apisam.netdw.tech/business/501234567/offers \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{"tipo_bem_servico":"Consultoria fiscal","descricao":"Apoio na declaração anual de IRC para IPSS","valor_total":800.00,"desconto":75,"tipo_bem":"SERVICO"}'`

const postOfferResponse = `{
  "id": 4,
  "tipo_bem_servico": "Consultoria fiscal",
  "descricao": "Apoio na declaração anual de IRC para IPSS",
  "valor_total": 800.00,
  "desconto": 75,
  "tipo_bem": "SERVICO"
}`

const patchOfferBody = `{
  "descricao": "Apoio na declaração anual de IRC para IPSS e Associações",
  "desconto": 80
}`

const patchOfferCurl = `curl -X PATCH https://apisam.netdw.tech/business/501234567/offers/4 \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{"desconto": 80}'`

const patchOfferResponse = `{
  "id": 4,
  "tipo_bem_servico": "Consultoria fiscal",
  "descricao": "Apoio na declaração anual de IRC para IPSS e Associações",
  "valor_total": 800.00,
  "desconto": 80,
  "tipo_bem": "SERVICO"
}`

const deleteOfferCurl = `curl -X DELETE https://apisam.netdw.tech/business/501234567/offers/4 \\
  -H "Authorization: Bearer <token>"`

// Notifications
const getNotificationsCurl = `curl -H "Authorization: Bearer <token>" \\
  https://apisam.netdw.tech/notifications/inbox`

const getNotificationsResponse = `[
  {
    "id": 101,
    "tipo": "DOACAO_ACEITE",
    "titulo": "Doação aceite",
    "corpo": "A sua doação de 250,00€ foi aceite pela instituição.",
    "lida": false,
    "data_criacao": "2025-05-30T14:22:00.000Z",
    "dados": { "id_doacao": 44 }
  },
  {
    "id": 100,
    "tipo": "PEDIDO_NOVO",
    "titulo": "Novo pedido de necessidade",
    "corpo": "O Banco Alimentar do Porto criou um novo pedido urgente.",
    "lida": true,
    "data_criacao": "2025-05-29T09:10:00.000Z",
    "dados": null
  }
]`

const patchNotificationBody = `{
  "lida": true
}`

const patchNotificationCurl = `curl -X PATCH https://apisam.netdw.tech/notifications/101 \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{"lida": true}'`

const patchNotificationResponse = `{
  "id": 101,
  "lida": true
}`

const deleteNotificationCurl = `curl -X DELETE https://apisam.netdw.tech/notifications/101 \\
  -H "Authorization: Bearer <token>"`

const deleteReadAllCurl = `curl -X DELETE https://apisam.netdw.tech/notifications/read-all \\
  -H "Authorization: Bearer <token>"`

// Auth profile
const getProfileCurl = `curl -H "Authorization: Bearer <token>" \\
  https://apisam.netdw.tech/users/profile`

const getProfileResponse = `{
  "nif_nipc": "123456789",
  "nome_entidade": "João Silva",
  "email_login": "joao@exemplo.pt",
  "role": "patron",
  "iban": "PT50000201231234567890154"
}`

const patchProfileBody = `{
  "nome_entidade": "João Manuel Silva",
  "iban": "PT50000201231234567890154"
}`

const patchProfileCurl = `curl -X PATCH https://apisam.netdw.tech/users/profile \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{"nome_entidade": "João Manuel Silva"}'`

const patchProfileResponse = `{
  "nif_nipc": "123456789",
  "nome_entidade": "João Manuel Silva",
  "email_login": "joao@exemplo.pt",
  "role": "patron",
  "iban": "PT50000201231234567890154"
}`

const changePasswordBody = `{
  "currentPassword": "password-atual",
  "newPassword": "nova-password-segura"
}`

const changePasswordCurl = `curl -X PATCH https://apisam.netdw.tech/users/change-password \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{"currentPassword":"password-atual","newPassword":"nova-password-segura"}'`

const changePasswordResponse = `{
  "description": "Password alterada com sucesso."
}`
</script>

<template>
  <UDashboardPanel id="docs-api">
    <template #header>
      <UDashboardNavbar title="Documentação da API">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="grid lg:grid-cols-4 gap-6 w-full max-w-7xl mx-auto py-6 px-2 sm:px-4">
        <!-- Main content -->
        <div class="lg:col-span-3 flex flex-col gap-10 min-w-0 w-full">
          <!-- ── 1. Autenticação ── -->
          <section id="autenticacao">
            <UPageCard variant="subtle">
              <template #header>
                <h2 class="text-xl font-bold flex items-center gap-2">
                  <UIcon name="i-lucide-lock" class="text-primary" />
                  Autenticação
                </h2>
              </template>

              <div class="flex flex-col gap-8 mt-2">
                <!-- Permanent token — primary method -->
                <div class="space-y-4">
                  <div class="flex flex-wrap items-center gap-2">
                    <h3 class="font-semibold text-highlighted">
                      Token permanente de API
                    </h3>
                    <UBadge
                      color="success"
                      variant="soft"
                      size="sm"
                      icon="i-lucide-star"
                    >
                      Recomendado
                    </UBadge>
                  </div>

                  <p class="text-sm text-muted">
                    O método principal para acesso programático à API do SAM é o <strong class="text-highlighted">token permanente</strong>. Ao contrário dos tokens de sessão JWT, este token <strong class="text-highlighted">não expira</strong> automaticamente — permanece válido até ser revogado manualmente.
                  </p>

                  <div class="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                    <p class="text-xs font-semibold text-primary uppercase tracking-wide">
                      Como obter o token
                    </p>
                    <ol class="text-sm text-muted space-y-1.5 list-decimal list-inside">
                      <li>Inicie sessão na plataforma SAM</li>
                      <li>Clique no seu nome na barra lateral esquerda</li>
                      <li>Selecione <strong class="text-highlighted">API</strong> no menu</li>
                      <li>Clique em <strong class="text-highlighted">Gerar token</strong> e copie-o de imediato — só é mostrado uma vez</li>
                    </ol>
                  </div>

                  <div class="space-y-2">
                    <p class="text-xs text-muted font-semibold uppercase">
                      Formato do token
                    </p>
                    <div class="p-3 bg-elevated rounded-lg border border-default">
                      <code class="font-mono text-xs break-all">sam_&lt;64 caracteres hexadecimais&gt;</code>
                    </div>
                    <p class="text-xs text-muted">
                      Exemplo: <code class="font-mono bg-elevated px-1 rounded text-xs break-all">{{ permanentTokenExample }}</code>
                    </p>
                  </div>

                  <div class="space-y-2">
                    <p class="text-xs text-muted font-semibold uppercase">
                      Utilização — cabeçalho obrigatório em todos os pedidos
                    </p>
                    <div class="p-3 bg-elevated rounded-lg border border-default">
                      <code class="font-mono text-sm">Authorization: Bearer sam_a3f8c2e1...</code>
                    </div>
                  </div>

                  <div class="space-y-2">
                    <p class="text-xs text-muted font-semibold uppercase">
                      Exemplo curl
                    </p>
                    <div class="rounded-lg bg-zinc-900 dark:bg-zinc-950 border border-zinc-700 overflow-hidden max-w-full">
                      <div class="flex items-center justify-between px-4 py-2 bg-zinc-800 border-b border-zinc-700">
                        <span class="text-xs text-zinc-400 font-mono">bash</span>
                        <UButton
                          icon="i-lucide-copy"
                          color="neutral"
                          variant="ghost"
                          size="xs"
                          class="text-zinc-400 hover:text-zinc-100"
                          @click="copyCode(permanentTokenCurl)"
                        />
                      </div>
                      <pre class="p-4 text-sm text-zinc-100 overflow-x-auto font-mono leading-relaxed"><code>{{ permanentTokenCurl }}</code></pre>
                    </div>
                  </div>

                  <UAlert
                    icon="i-lucide-shield-alert"
                    color="warning"
                    variant="soft"
                    title="Boas práticas de segurança"
                    description="Trate o token de API como uma password. Não o inclua em código público (repositórios, front-end, etc.). Em caso de comprometimento, revogue-o imediatamente em Definições → API."
                  />
                </div>

                <USeparator />

                <!-- JWT — secondary / session use -->
                <div class="space-y-4">
                  <div class="flex flex-wrap items-center gap-2">
                    <h3 class="font-semibold text-highlighted">
                      Autenticação por sessão JWT
                    </h3>
                    <UBadge color="neutral" variant="soft" size="sm">
                      Sessão temporária
                    </UBadge>
                  </div>

                  <p class="text-sm text-muted">
                    Os endpoints <code class="bg-elevated px-1 rounded text-xs font-mono">/users/login</code> e <code class="bg-elevated px-1 rounded text-xs font-mono">/users/refresh</code> destinam-se principalmente à aplicação web SAM. Se optar por usá-los para acesso programático, tenha em conta que o <code class="bg-elevated px-1 rounded text-xs font-mono">accessToken</code> expira periodicamente e precisa de ser renovado com o <code class="bg-elevated px-1 rounded text-xs font-mono">refreshToken</code>.
                  </p>

                  <div>
                    <div class="flex flex-wrap items-center gap-2 mb-2 min-w-0">
                      <UBadge color="success" variant="solid" size="sm">
                        POST
                      </UBadge>
                      <code class="font-mono text-sm break-all min-w-0">/users/login</code>
                      <span class="text-sm text-muted font-normal">— Iniciar sessão</span>
                    </div>
                    <p class="text-sm text-muted mb-3">
                      Autentica com NIF/NIPC e password. Devolve um <code class="bg-elevated px-1 rounded text-xs font-mono">accessToken</code> (curta duração) e um <code class="bg-elevated px-1 rounded text-xs font-mono">refreshToken</code> (longa duração).
                    </p>

                    <p class="text-xs text-muted font-semibold uppercase mb-1">
                      Corpo do pedido
                    </p>
                    <div class="rounded-lg bg-zinc-900 dark:bg-zinc-950 border border-zinc-700 overflow-hidden mb-3 max-w-full">
                      <div class="flex items-center justify-between px-4 py-2 bg-zinc-800 border-b border-zinc-700">
                        <span class="text-xs text-zinc-400 font-mono">json</span>
                      </div>
                      <pre class="p-4 text-sm text-zinc-100 overflow-x-auto font-mono leading-relaxed"><code>{"nif_nipc": "123456789", "password": "a-sua-password"}</code></pre>
                    </div>

                    <p class="text-xs text-muted font-semibold uppercase mb-1">
                      Resposta (200)
                    </p>
                    <div class="rounded-lg bg-zinc-900 dark:bg-zinc-950 border border-zinc-700 overflow-hidden mb-3 max-w-full">
                      <div class="flex items-center justify-between px-4 py-2 bg-zinc-800 border-b border-zinc-700">
                        <span class="text-xs text-zinc-400 font-mono">json</span>
                      </div>
                      <pre class="p-4 text-sm text-zinc-100 overflow-x-auto font-mono leading-relaxed"><code>{{ loginResponse }}</code></pre>
                    </div>

                    <div class="rounded-lg bg-zinc-900 dark:bg-zinc-950 border border-zinc-700 overflow-hidden max-w-full">
                      <div class="flex items-center justify-between px-4 py-2 bg-zinc-800 border-b border-zinc-700">
                        <span class="text-xs text-zinc-400 font-mono">bash</span>
                        <UButton
                          icon="i-lucide-copy"
                          color="neutral"
                          variant="ghost"
                          size="xs"
                          class="text-zinc-400 hover:text-zinc-100"
                          @click="copyCode(loginCurl)"
                        />
                      </div>
                      <pre class="p-4 text-sm text-zinc-100 overflow-x-auto font-mono leading-relaxed"><code>{{ loginCurl }}</code></pre>
                    </div>
                  </div>

                  <div>
                    <div class="flex flex-wrap items-center gap-2 mb-2 min-w-0">
                      <UBadge color="success" variant="solid" size="sm">
                        POST
                      </UBadge>
                      <code class="font-mono text-sm break-all min-w-0">/users/refresh</code>
                      <span class="text-sm text-muted font-normal">— Renovar accessToken</span>
                    </div>
                    <p class="text-sm text-muted mb-3">
                      Obtém um novo <code class="bg-elevated px-1 rounded text-xs font-mono">accessToken</code> sem necessidade de reautenticar com password. Não necessário ao usar token permanente.
                    </p>

                    <p class="text-xs text-muted font-semibold uppercase mb-1">
                      Corpo do pedido
                    </p>
                    <div class="rounded-lg bg-zinc-900 dark:bg-zinc-950 border border-zinc-700 overflow-hidden mb-3 max-w-full">
                      <div class="flex items-center justify-between px-4 py-2 bg-zinc-800 border-b border-zinc-700">
                        <span class="text-xs text-zinc-400 font-mono">json</span>
                      </div>
                      <pre class="p-4 text-sm text-zinc-100 overflow-x-auto font-mono leading-relaxed"><code>{"refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}</code></pre>
                    </div>

                    <p class="text-xs text-muted font-semibold uppercase mb-1">
                      Resposta (200)
                    </p>
                    <div class="rounded-lg bg-zinc-900 dark:bg-zinc-950 border border-zinc-700 overflow-hidden mb-3 max-w-full">
                      <div class="flex items-center justify-between px-4 py-2 bg-zinc-800 border-b border-zinc-700">
                        <span class="text-xs text-zinc-400 font-mono">json</span>
                      </div>
                      <pre class="p-4 text-sm text-zinc-100 overflow-x-auto font-mono leading-relaxed"><code>{{ refreshResponse }}</code></pre>
                    </div>

                    <div class="rounded-lg bg-zinc-900 dark:bg-zinc-950 border border-zinc-700 overflow-hidden max-w-full">
                      <div class="flex items-center justify-between px-4 py-2 bg-zinc-800 border-b border-zinc-700">
                        <span class="text-xs text-zinc-400 font-mono">bash</span>
                        <UButton
                          icon="i-lucide-copy"
                          color="neutral"
                          variant="ghost"
                          size="xs"
                          class="text-zinc-400 hover:text-zinc-100"
                          @click="copyCode(refreshCurl)"
                        />
                      </div>
                      <pre class="p-4 text-sm text-zinc-100 overflow-x-auto font-mono leading-relaxed"><code>{{ refreshCurl }}</code></pre>
                    </div>
                  </div>
                </div>
              </div>
            </UPageCard>
          </section>

          <!-- ── 2. URL Base ── -->
          <section id="url-base">
            <UPageCard variant="subtle">
              <template #header>
                <h2 class="text-xl font-bold flex items-center gap-2">
                  <UIcon name="i-lucide-globe" class="text-primary" />
                  URL Base e Formato
                </h2>
              </template>
              <div class="flex flex-col gap-4 mt-2">
                <div class="p-3 bg-elevated rounded-lg border border-default">
                  <code class="font-mono text-sm">https://apisam.netdw.tech</code>
                </div>
                <ul class="text-sm text-muted flex flex-col gap-2 list-disc list-inside">
                  <li>Todas as respostas são em formato <strong class="text-default">JSON</strong>.</li>
                  <li>Datas no formato <strong class="text-default">ISO 8601</strong> (ex: <code class="bg-elevated px-1 rounded text-xs font-mono">2025-05-31T12:00:00.000Z</code>).</li>
                  <li>Pedidos com corpo devem incluir o cabeçalho <code class="bg-elevated px-1 rounded text-xs font-mono">Content-Type: application/json</code>.</li>
                  <li>Respostas de sucesso com conteúdo devolvem o código <strong class="text-default">200</strong> ou <strong class="text-default">201</strong>.</li>
                  <li>Respostas sem conteúdo (ex: após DELETE) devolvem o código <strong class="text-default">204</strong>.</li>
                </ul>
              </div>
            </UPageCard>
          </section>

          <!-- ── 3. Erros ── -->
          <section id="erros">
            <UPageCard variant="subtle">
              <template #header>
                <h2 class="text-xl font-bold flex items-center gap-2">
                  <UIcon name="i-lucide-triangle-alert" class="text-primary" />
                  Erros
                </h2>
              </template>
              <div class="flex flex-col gap-4 mt-2">
                <p class="text-sm text-muted">
                  Quando ocorre um erro, a API devolve um objeto JSON com uma descrição legível.
                </p>

                <p class="text-xs text-muted font-semibold uppercase mb-1">
                  Formato do corpo de erro
                </p>
                <div class="rounded-lg bg-zinc-900 dark:bg-zinc-950 border border-zinc-700 overflow-hidden mb-4">
                  <div class="flex items-center justify-between px-4 py-2 bg-zinc-800 border-b border-zinc-700">
                    <span class="text-xs text-zinc-400 font-mono">json</span>
                  </div>
                  <pre class="p-4 text-sm text-zinc-100 overflow-x-auto font-mono leading-relaxed"><code>{{ errorBody }}</code></pre>
                </div>

                <div class="overflow-x-auto">
                  <table class="w-full text-sm border-collapse">
                    <thead>
                      <tr class="border-b border-default">
                        <th class="text-left py-2 px-3 font-semibold text-muted w-16">
                          Código
                        </th>
                        <th class="text-left py-2 px-3 font-semibold text-muted">
                          Significado
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr class="border-b border-default/50 hover:bg-elevated/50">
                        <td class="py-2 px-3">
                          <UBadge color="success" variant="subtle">
                            200
                          </UBadge>
                        </td>
                        <td class="py-2 px-3 text-muted">
                          Sucesso — pedido processado, conteúdo devolvido.
                        </td>
                      </tr>
                      <tr class="border-b border-default/50 hover:bg-elevated/50">
                        <td class="py-2 px-3">
                          <UBadge color="success" variant="subtle">
                            201
                          </UBadge>
                        </td>
                        <td class="py-2 px-3 text-muted">
                          Criado — recurso criado com sucesso.
                        </td>
                      </tr>
                      <tr class="border-b border-default/50 hover:bg-elevated/50">
                        <td class="py-2 px-3">
                          <UBadge color="neutral" variant="subtle">
                            204
                          </UBadge>
                        </td>
                        <td class="py-2 px-3 text-muted">
                          Sem conteúdo — pedido processado, sem corpo na resposta.
                        </td>
                      </tr>
                      <tr class="border-b border-default/50 hover:bg-elevated/50">
                        <td class="py-2 px-3">
                          <UBadge color="warning" variant="subtle">
                            400
                          </UBadge>
                        </td>
                        <td class="py-2 px-3 text-muted">
                          Pedido inválido — corpo ou parâmetros malformados.
                        </td>
                      </tr>
                      <tr class="border-b border-default/50 hover:bg-elevated/50">
                        <td class="py-2 px-3">
                          <UBadge color="error" variant="subtle">
                            401
                          </UBadge>
                        </td>
                        <td class="py-2 px-3 text-muted">
                          Não autenticado — token ausente, inválido ou expirado.
                        </td>
                      </tr>
                      <tr class="border-b border-default/50 hover:bg-elevated/50">
                        <td class="py-2 px-3">
                          <UBadge color="error" variant="subtle">
                            403
                          </UBadge>
                        </td>
                        <td class="py-2 px-3 text-muted">
                          Proibido — sem permissão para aceder ao recurso.
                        </td>
                      </tr>
                      <tr class="border-b border-default/50 hover:bg-elevated/50">
                        <td class="py-2 px-3">
                          <UBadge color="warning" variant="subtle">
                            404
                          </UBadge>
                        </td>
                        <td class="py-2 px-3 text-muted">
                          Não encontrado — recurso inexistente.
                        </td>
                      </tr>
                      <tr class="border-b border-default/50 hover:bg-elevated/50">
                        <td class="py-2 px-3">
                          <UBadge color="warning" variant="subtle">
                            422
                          </UBadge>
                        </td>
                        <td class="py-2 px-3 text-muted">
                          Entidade não processável — validação falhou nos dados enviados.
                        </td>
                      </tr>
                      <tr class="hover:bg-elevated/50">
                        <td class="py-2 px-3">
                          <UBadge color="error" variant="subtle">
                            500
                          </UBadge>
                        </td>
                        <td class="py-2 px-3 text-muted">
                          Erro interno — problema no servidor. Tente novamente mais tarde.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </UPageCard>
          </section>

          <!-- ── 4. Mecenas ── -->
          <section id="mecenas">
            <UPageCard variant="subtle">
              <template #header>
                <h2 class="text-xl font-bold flex items-center gap-2">
                  <UIcon name="i-lucide-heart-handshake" class="text-primary" />
                  Mecenas
                </h2>
              </template>
              <div class="flex flex-col gap-8 mt-2 min-w-0">
                <!-- GET /patrons/:nif -->
                <div>
                  <div class="flex flex-wrap items-center gap-2 mb-2 min-w-0">
                    <UBadge color="info" variant="solid" size="sm">
                      GET
                    </UBadge>
                    <code class="font-mono text-sm break-all min-w-0">/patrons/:nif</code>
                  </div>
                  <p class="text-sm text-muted mb-3">
                    Obtém o perfil completo de um mecenas, incluindo localizações e contactos.
                  </p>
                  <p class="text-xs text-zinc-500 mb-1 font-semibold uppercase">
                    Cabeçalhos obrigatórios
                  </p>
                  <div class="p-2 bg-elevated rounded border border-default mb-3 text-xs font-mono overflow-x-auto break-all">
                    Authorization: Bearer &lt;token&gt;
                  </div>
                  <p class="text-xs text-muted font-semibold uppercase mb-1">
                    Resposta (200)
                  </p>
                  <div class="rounded-lg bg-zinc-900 dark:bg-zinc-950 border border-zinc-700 overflow-hidden mb-3 max-w-full">
                    <div class="flex items-center justify-between px-4 py-2 bg-zinc-800 border-b border-zinc-700">
                      <span class="text-xs text-zinc-400 font-mono">json</span>
                    </div>
                    <pre class="p-4 text-sm text-zinc-100 overflow-x-auto font-mono leading-relaxed"><code>{{ getPatronResponse }}</code></pre>
                  </div>
                  <div class="rounded-lg bg-zinc-900 dark:bg-zinc-950 border border-zinc-700 overflow-hidden max-w-full">
                    <div class="flex items-center justify-between px-4 py-2 bg-zinc-800 border-b border-zinc-700">
                      <span class="text-xs text-zinc-400 font-mono">bash</span>
                      <UButton
                        icon="i-lucide-copy"
                        color="neutral"
                        variant="ghost"
                        size="xs"
                        class="text-zinc-400 hover:text-zinc-100"
                        @click="copyCode(getPatronCurl)"
                      />
                    </div>
                    <pre class="p-4 text-sm text-zinc-100 overflow-x-auto font-mono leading-relaxed"><code>{{ getPatronCurl }}</code></pre>
                  </div>
                </div>

                <!-- PATCH /patrons/:nif -->
                <div>
                  <div class="flex flex-wrap items-center gap-2 mb-2 min-w-0">
                    <UBadge color="warning" variant="solid" size="sm">
                      PATCH
                    </UBadge>
                    <code class="font-mono text-sm break-all min-w-0">/patrons/:nif</code>
                  </div>
                  <p class="text-sm text-muted mb-3">
                    Atualiza os dados de perfil do mecenas. Todos os campos são opcionais.
                  </p>
                  <p class="text-xs text-zinc-500 mb-1 font-semibold uppercase">
                    Cabeçalhos obrigatórios
                  </p>
                  <div class="p-2 bg-elevated rounded border border-default mb-3 text-xs font-mono overflow-x-auto break-all">
                    Authorization: Bearer &lt;token&gt;<br>Content-Type: application/json
                  </div>
                  <p class="text-xs text-muted font-semibold uppercase mb-1">
                    Corpo do pedido
                  </p>
                  <div class="rounded-lg bg-zinc-900 dark:bg-zinc-950 border border-zinc-700 overflow-hidden mb-3 max-w-full">
                    <div class="flex items-center justify-between px-4 py-2 bg-zinc-800 border-b border-zinc-700">
                      <span class="text-xs text-zinc-400 font-mono">json</span>
                    </div>
                    <pre class="p-4 text-sm text-zinc-100 overflow-x-auto font-mono leading-relaxed"><code>{{ patchPatronBody }}</code></pre>
                  </div>
                  <p class="text-xs text-muted font-semibold uppercase mb-1">
                    Resposta (200)
                  </p>
                  <div class="rounded-lg bg-zinc-900 dark:bg-zinc-950 border border-zinc-700 overflow-hidden mb-3 max-w-full">
                    <div class="flex items-center justify-between px-4 py-2 bg-zinc-800 border-b border-zinc-700">
                      <span class="text-xs text-zinc-400 font-mono">json</span>
                    </div>
                    <pre class="p-4 text-sm text-zinc-100 overflow-x-auto font-mono leading-relaxed"><code>{{ patchPatronResponse }}</code></pre>
                  </div>
                  <div class="rounded-lg bg-zinc-900 dark:bg-zinc-950 border border-zinc-700 overflow-hidden max-w-full">
                    <div class="flex items-center justify-between px-4 py-2 bg-zinc-800 border-b border-zinc-700">
                      <span class="text-xs text-zinc-400 font-mono">bash</span>
                      <UButton
                        icon="i-lucide-copy"
                        color="neutral"
                        variant="ghost"
                        size="xs"
                        class="text-zinc-400 hover:text-zinc-100"
                        @click="copyCode(patchPatronCurl)"
                      />
                    </div>
                    <pre class="p-4 text-sm text-zinc-100 overflow-x-auto font-mono leading-relaxed"><code>{{ patchPatronCurl }}</code></pre>
                  </div>
                </div>

                <!-- GET /patrons/:nif/donations -->
                <div>
                  <div class="flex flex-wrap items-center gap-2 mb-2 min-w-0">
                    <UBadge color="info" variant="solid" size="sm">
                      GET
                    </UBadge>
                    <code class="font-mono text-sm break-all min-w-0">/patrons/:nif/donations</code>
                  </div>
                  <p class="text-sm text-muted mb-3">
                    Lista todas as doações do mecenas. As doações podem ser em numerário (dinheiro) ou espécie (bens/serviços).
                  </p>
                  <p class="text-xs text-zinc-500 mb-1 font-semibold uppercase">
                    Cabeçalhos obrigatórios
                  </p>
                  <div class="p-2 bg-elevated rounded border border-default mb-3 text-xs font-mono overflow-x-auto break-all">
                    Authorization: Bearer &lt;token&gt;
                  </div>
                  <p class="text-xs text-muted font-semibold uppercase mb-1">
                    Resposta (200)
                  </p>
                  <div class="rounded-lg bg-zinc-900 dark:bg-zinc-950 border border-zinc-700 overflow-hidden mb-3 max-w-full">
                    <div class="flex items-center justify-between px-4 py-2 bg-zinc-800 border-b border-zinc-700">
                      <span class="text-xs text-zinc-400 font-mono">json</span>
                    </div>
                    <pre class="p-4 text-sm text-zinc-100 overflow-x-auto font-mono leading-relaxed"><code>{{ getDonationsResponse }}</code></pre>
                  </div>
                  <div class="rounded-lg bg-zinc-900 dark:bg-zinc-950 border border-zinc-700 overflow-hidden max-w-full">
                    <div class="flex items-center justify-between px-4 py-2 bg-zinc-800 border-b border-zinc-700">
                      <span class="text-xs text-zinc-400 font-mono">bash</span>
                      <UButton
                        icon="i-lucide-copy"
                        color="neutral"
                        variant="ghost"
                        size="xs"
                        class="text-zinc-400 hover:text-zinc-100"
                        @click="copyCode(getDonationsCurl)"
                      />
                    </div>
                    <pre class="p-4 text-sm text-zinc-100 overflow-x-auto font-mono leading-relaxed"><code>{{ getDonationsCurl }}</code></pre>
                  </div>
                </div>

                <!-- POST /patrons/:nif/donations -->
                <div>
                  <div class="flex flex-wrap items-center gap-2 mb-2 min-w-0">
                    <UBadge color="success" variant="solid" size="sm">
                      POST
                    </UBadge>
                    <code class="font-mono text-sm break-all min-w-0">/patrons/:nif/donations</code>
                  </div>
                  <p class="text-sm text-muted mb-3">
                    Regista uma nova doação. O campo <code class="bg-elevated px-1 rounded text-xs font-mono">valor</code> é obrigatório para doações <code class="bg-elevated px-1 rounded text-xs font-mono">NUMERARIO</code> e opcional para <code class="bg-elevated px-1 rounded text-xs font-mono">ESPECIE</code>.
                  </p>
                  <p class="text-xs text-zinc-500 mb-1 font-semibold uppercase">
                    Cabeçalhos obrigatórios
                  </p>
                  <div class="p-2 bg-elevated rounded border border-default mb-3 text-xs font-mono overflow-x-auto break-all">
                    Authorization: Bearer &lt;token&gt;<br>Content-Type: application/json
                  </div>
                  <p class="text-xs text-muted font-semibold uppercase mb-1">
                    Corpo do pedido
                  </p>
                  <div class="rounded-lg bg-zinc-900 dark:bg-zinc-950 border border-zinc-700 overflow-hidden mb-3 max-w-full">
                    <div class="flex items-center justify-between px-4 py-2 bg-zinc-800 border-b border-zinc-700">
                      <span class="text-xs text-zinc-400 font-mono">json</span>
                    </div>
                    <pre class="p-4 text-sm text-zinc-100 overflow-x-auto font-mono leading-relaxed"><code>{{ postDonationBody }}</code></pre>
                  </div>
                  <p class="text-xs text-muted font-semibold uppercase mb-1">
                    Resposta (201)
                  </p>
                  <div class="rounded-lg bg-zinc-900 dark:bg-zinc-950 border border-zinc-700 overflow-hidden mb-3 max-w-full">
                    <div class="flex items-center justify-between px-4 py-2 bg-zinc-800 border-b border-zinc-700">
                      <span class="text-xs text-zinc-400 font-mono">json</span>
                    </div>
                    <pre class="p-4 text-sm text-zinc-100 overflow-x-auto font-mono leading-relaxed"><code>{{ postDonationResponse }}</code></pre>
                  </div>
                  <div class="rounded-lg bg-zinc-900 dark:bg-zinc-950 border border-zinc-700 overflow-hidden max-w-full">
                    <div class="flex items-center justify-between px-4 py-2 bg-zinc-800 border-b border-zinc-700">
                      <span class="text-xs text-zinc-400 font-mono">bash</span>
                      <UButton
                        icon="i-lucide-copy"
                        color="neutral"
                        variant="ghost"
                        size="xs"
                        class="text-zinc-400 hover:text-zinc-100"
                        @click="copyCode(postDonationCurl)"
                      />
                    </div>
                    <pre class="p-4 text-sm text-zinc-100 overflow-x-auto font-mono leading-relaxed"><code>{{ postDonationCurl }}</code></pre>
                  </div>
                </div>
              </div>
            </UPageCard>
          </section>

          <!-- ── 5. Instituições ── -->
          <section id="instituicoes">
            <UPageCard variant="subtle">
              <template #header>
                <h2 class="text-xl font-bold flex items-center gap-2">
                  <UIcon name="i-lucide-building-2" class="text-primary" />
                  Instituições
                </h2>
              </template>
              <div class="flex flex-col gap-8 mt-2 min-w-0">
                <!-- GET /institutions/:nif -->
                <div>
                  <div class="flex flex-wrap items-center gap-2 mb-2 min-w-0">
                    <UBadge color="info" variant="solid" size="sm">
                      GET
                    </UBadge>
                    <code class="font-mono text-sm break-all min-w-0">/institutions/:nif</code>
                  </div>
                  <p class="text-sm text-muted mb-3">
                    Obtém o perfil da instituição incluindo localização geográfica e URL do comprovativo de estatuto.
                  </p>
                  <p class="text-xs text-zinc-500 mb-1 font-semibold uppercase">
                    Cabeçalhos obrigatórios
                  </p>
                  <div class="p-2 bg-elevated rounded border border-default mb-3 text-xs font-mono overflow-x-auto break-all">
                    Authorization: Bearer &lt;token&gt;
                  </div>
                  <p class="text-xs text-muted font-semibold uppercase mb-1">
                    Resposta (200)
                  </p>
                  <div class="rounded-lg bg-zinc-900 dark:bg-zinc-950 border border-zinc-700 overflow-hidden mb-3 max-w-full">
                    <div class="flex items-center justify-between px-4 py-2 bg-zinc-800 border-b border-zinc-700">
                      <span class="text-xs text-zinc-400 font-mono">json</span>
                    </div>
                    <pre class="p-4 text-sm text-zinc-100 overflow-x-auto font-mono leading-relaxed"><code>{{ getInstitutionResponse }}</code></pre>
                  </div>
                  <div class="rounded-lg bg-zinc-900 dark:bg-zinc-950 border border-zinc-700 overflow-hidden max-w-full">
                    <div class="flex items-center justify-between px-4 py-2 bg-zinc-800 border-b border-zinc-700">
                      <span class="text-xs text-zinc-400 font-mono">bash</span>
                      <UButton
                        icon="i-lucide-copy"
                        color="neutral"
                        variant="ghost"
                        size="xs"
                        class="text-zinc-400 hover:text-zinc-100"
                        @click="copyCode(getInstitutionCurl)"
                      />
                    </div>
                    <pre class="p-4 text-sm text-zinc-100 overflow-x-auto font-mono leading-relaxed"><code>{{ getInstitutionCurl }}</code></pre>
                  </div>
                </div>

                <!-- GET /needs -->
                <div>
                  <div class="flex flex-wrap items-center gap-2 mb-2 min-w-0">
                    <UBadge color="info" variant="solid" size="sm">
                      GET
                    </UBadge>
                    <code class="font-mono text-sm break-all min-w-0">/needs</code>
                    <span class="text-xs text-muted">query: ?nif=</span>
                  </div>
                  <p class="text-sm text-muted mb-3">
                    Lista os pedidos de necessidade. Filtrar por instituição com o parâmetro <code class="bg-elevated px-1 rounded text-xs font-mono">?nif=&lt;nif&gt;</code>.
                  </p>
                  <p class="text-xs text-zinc-500 mb-1 font-semibold uppercase">
                    Cabeçalhos obrigatórios
                  </p>
                  <div class="p-2 bg-elevated rounded border border-default mb-3 text-xs font-mono overflow-x-auto break-all">
                    Authorization: Bearer &lt;token&gt;
                  </div>
                  <p class="text-xs text-muted font-semibold uppercase mb-1">
                    Resposta (200)
                  </p>
                  <div class="rounded-lg bg-zinc-900 dark:bg-zinc-950 border border-zinc-700 overflow-hidden mb-3 max-w-full">
                    <div class="flex items-center justify-between px-4 py-2 bg-zinc-800 border-b border-zinc-700">
                      <span class="text-xs text-zinc-400 font-mono">json</span>
                    </div>
                    <pre class="p-4 text-sm text-zinc-100 overflow-x-auto font-mono leading-relaxed"><code>{{ getNeedsResponse }}</code></pre>
                  </div>
                  <div class="rounded-lg bg-zinc-900 dark:bg-zinc-950 border border-zinc-700 overflow-hidden max-w-full">
                    <div class="flex items-center justify-between px-4 py-2 bg-zinc-800 border-b border-zinc-700">
                      <span class="text-xs text-zinc-400 font-mono">bash</span>
                      <UButton
                        icon="i-lucide-copy"
                        color="neutral"
                        variant="ghost"
                        size="xs"
                        class="text-zinc-400 hover:text-zinc-100"
                        @click="copyCode(getNeedsCurl)"
                      />
                    </div>
                    <pre class="p-4 text-sm text-zinc-100 overflow-x-auto font-mono leading-relaxed"><code>{{ getNeedsCurl }}</code></pre>
                  </div>
                </div>

                <!-- POST /needs -->
                <div>
                  <div class="flex flex-wrap items-center gap-2 mb-2 min-w-0">
                    <UBadge color="success" variant="solid" size="sm">
                      POST
                    </UBadge>
                    <code class="font-mono text-sm break-all min-w-0">/needs</code>
                  </div>
                  <p class="text-sm text-muted mb-3">
                    Cria um novo pedido de necessidade com uma lista de itens (bens ou serviços). O estado inicial deve ser <code class="bg-elevated px-1 rounded text-xs font-mono">PENDENTE</code>.
                  </p>
                  <p class="text-xs text-zinc-500 mb-1 font-semibold uppercase">
                    Cabeçalhos obrigatórios
                  </p>
                  <div class="p-2 bg-elevated rounded border border-default mb-3 text-xs font-mono overflow-x-auto break-all">
                    Authorization: Bearer &lt;token&gt;<br>Content-Type: application/json
                  </div>
                  <p class="text-xs text-muted font-semibold uppercase mb-1">
                    Corpo do pedido
                  </p>
                  <div class="rounded-lg bg-zinc-900 dark:bg-zinc-950 border border-zinc-700 overflow-hidden mb-3 max-w-full">
                    <div class="flex items-center justify-between px-4 py-2 bg-zinc-800 border-b border-zinc-700">
                      <span class="text-xs text-zinc-400 font-mono">json</span>
                    </div>
                    <pre class="p-4 text-sm text-zinc-100 overflow-x-auto font-mono leading-relaxed"><code>{{ postNeedBody }}</code></pre>
                  </div>
                  <p class="text-xs text-muted font-semibold uppercase mb-1">
                    Resposta (201)
                  </p>
                  <div class="rounded-lg bg-zinc-900 dark:bg-zinc-950 border border-zinc-700 overflow-hidden mb-3 max-w-full">
                    <div class="flex items-center justify-between px-4 py-2 bg-zinc-800 border-b border-zinc-700">
                      <span class="text-xs text-zinc-400 font-mono">json</span>
                    </div>
                    <pre class="p-4 text-sm text-zinc-100 overflow-x-auto font-mono leading-relaxed"><code>{{ postNeedResponse }}</code></pre>
                  </div>
                  <div class="rounded-lg bg-zinc-900 dark:bg-zinc-950 border border-zinc-700 overflow-hidden max-w-full">
                    <div class="flex items-center justify-between px-4 py-2 bg-zinc-800 border-b border-zinc-700">
                      <span class="text-xs text-zinc-400 font-mono">bash</span>
                      <UButton
                        icon="i-lucide-copy"
                        color="neutral"
                        variant="ghost"
                        size="xs"
                        class="text-zinc-400 hover:text-zinc-100"
                        @click="copyCode(postNeedCurl)"
                      />
                    </div>
                    <pre class="p-4 text-sm text-zinc-100 overflow-x-auto font-mono leading-relaxed"><code>{{ postNeedCurl }}</code></pre>
                  </div>
                </div>

                <!-- PATCH /needs/:id -->
                <div>
                  <div class="flex flex-wrap items-center gap-2 mb-2 min-w-0">
                    <UBadge color="warning" variant="solid" size="sm">
                      PATCH
                    </UBadge>
                    <code class="font-mono text-sm break-all min-w-0">/needs/:id</code>
                  </div>
                  <p class="text-sm text-muted mb-3">
                    Atualiza o estado de um pedido. Os estados possíveis são <code class="bg-elevated px-1 rounded text-xs font-mono">PENDENTE</code>, <code class="bg-elevated px-1 rounded text-xs font-mono">ACEITE</code> e <code class="bg-elevated px-1 rounded text-xs font-mono">REJEITADO</code>.
                  </p>
                  <p class="text-xs text-zinc-500 mb-1 font-semibold uppercase">
                    Cabeçalhos obrigatórios
                  </p>
                  <div class="p-2 bg-elevated rounded border border-default mb-3 text-xs font-mono overflow-x-auto break-all">
                    Authorization: Bearer &lt;token&gt;<br>Content-Type: application/json
                  </div>
                  <p class="text-xs text-muted font-semibold uppercase mb-1">
                    Corpo do pedido
                  </p>
                  <div class="rounded-lg bg-zinc-900 dark:bg-zinc-950 border border-zinc-700 overflow-hidden mb-3 max-w-full">
                    <div class="flex items-center justify-between px-4 py-2 bg-zinc-800 border-b border-zinc-700">
                      <span class="text-xs text-zinc-400 font-mono">json</span>
                    </div>
                    <pre class="p-4 text-sm text-zinc-100 overflow-x-auto font-mono leading-relaxed"><code>{{ patchNeedBody }}</code></pre>
                  </div>
                  <p class="text-xs text-muted font-semibold uppercase mb-1">
                    Resposta (200)
                  </p>
                  <div class="rounded-lg bg-zinc-900 dark:bg-zinc-950 border border-zinc-700 overflow-hidden mb-3 max-w-full">
                    <div class="flex items-center justify-between px-4 py-2 bg-zinc-800 border-b border-zinc-700">
                      <span class="text-xs text-zinc-400 font-mono">json</span>
                    </div>
                    <pre class="p-4 text-sm text-zinc-100 overflow-x-auto font-mono leading-relaxed"><code>{{ patchNeedResponse }}</code></pre>
                  </div>
                  <div class="rounded-lg bg-zinc-900 dark:bg-zinc-950 border border-zinc-700 overflow-hidden max-w-full">
                    <div class="flex items-center justify-between px-4 py-2 bg-zinc-800 border-b border-zinc-700">
                      <span class="text-xs text-zinc-400 font-mono">bash</span>
                      <UButton
                        icon="i-lucide-copy"
                        color="neutral"
                        variant="ghost"
                        size="xs"
                        class="text-zinc-400 hover:text-zinc-100"
                        @click="copyCode(patchNeedCurl)"
                      />
                    </div>
                    <pre class="p-4 text-sm text-zinc-100 overflow-x-auto font-mono leading-relaxed"><code>{{ patchNeedCurl }}</code></pre>
                  </div>
                </div>
              </div>
            </UPageCard>
          </section>

          <!-- ── 6. Negócios ── -->
          <section id="negocios">
            <UPageCard variant="subtle">
              <template #header>
                <h2 class="text-xl font-bold flex items-center gap-2">
                  <UIcon name="i-lucide-briefcase" class="text-primary" />
                  Negócios
                </h2>
              </template>
              <div class="flex flex-col gap-8 mt-2 min-w-0">
                <!-- GET /business/:nif -->
                <div>
                  <div class="flex flex-wrap items-center gap-2 mb-2 min-w-0">
                    <UBadge color="info" variant="solid" size="sm">
                      GET
                    </UBadge>
                    <code class="font-mono text-sm break-all min-w-0">/business/:nif</code>
                  </div>
                  <p class="text-sm text-muted mb-3">
                    Obtém o perfil do negócio incluindo data de início de atividade, URL da certidão permanente e lista de ofertas.
                  </p>
                  <p class="text-xs text-zinc-500 mb-1 font-semibold uppercase">
                    Cabeçalhos obrigatórios
                  </p>
                  <div class="p-2 bg-elevated rounded border border-default mb-3 text-xs font-mono overflow-x-auto break-all">
                    Authorization: Bearer &lt;token&gt;
                  </div>
                  <p class="text-xs text-muted font-semibold uppercase mb-1">
                    Resposta (200)
                  </p>
                  <div class="rounded-lg bg-zinc-900 dark:bg-zinc-950 border border-zinc-700 overflow-hidden mb-3 max-w-full">
                    <div class="flex items-center justify-between px-4 py-2 bg-zinc-800 border-b border-zinc-700">
                      <span class="text-xs text-zinc-400 font-mono">json</span>
                    </div>
                    <pre class="p-4 text-sm text-zinc-100 overflow-x-auto font-mono leading-relaxed"><code>{{ getBusinessResponse }}</code></pre>
                  </div>
                  <div class="rounded-lg bg-zinc-900 dark:bg-zinc-950 border border-zinc-700 overflow-hidden max-w-full">
                    <div class="flex items-center justify-between px-4 py-2 bg-zinc-800 border-b border-zinc-700">
                      <span class="text-xs text-zinc-400 font-mono">bash</span>
                      <UButton
                        icon="i-lucide-copy"
                        color="neutral"
                        variant="ghost"
                        size="xs"
                        class="text-zinc-400 hover:text-zinc-100"
                        @click="copyCode(getBusinessCurl)"
                      />
                    </div>
                    <pre class="p-4 text-sm text-zinc-100 overflow-x-auto font-mono leading-relaxed"><code>{{ getBusinessCurl }}</code></pre>
                  </div>
                </div>

                <!-- PATCH /business/:nif -->
                <div>
                  <div class="flex flex-wrap items-center gap-2 mb-2 min-w-0">
                    <UBadge color="warning" variant="solid" size="sm">
                      PATCH
                    </UBadge>
                    <code class="font-mono text-sm break-all min-w-0">/business/:nif</code>
                  </div>
                  <p class="text-sm text-muted mb-3">
                    Atualiza os dados do negócio. Todos os campos são opcionais.
                  </p>
                  <p class="text-xs text-zinc-500 mb-1 font-semibold uppercase">
                    Cabeçalhos obrigatórios
                  </p>
                  <div class="p-2 bg-elevated rounded border border-default mb-3 text-xs font-mono overflow-x-auto break-all">
                    Authorization: Bearer &lt;token&gt;<br>Content-Type: application/json
                  </div>
                  <p class="text-xs text-muted font-semibold uppercase mb-1">
                    Corpo do pedido
                  </p>
                  <div class="rounded-lg bg-zinc-900 dark:bg-zinc-950 border border-zinc-700 overflow-hidden mb-3 max-w-full">
                    <div class="flex items-center justify-between px-4 py-2 bg-zinc-800 border-b border-zinc-700">
                      <span class="text-xs text-zinc-400 font-mono">json</span>
                    </div>
                    <pre class="p-4 text-sm text-zinc-100 overflow-x-auto font-mono leading-relaxed"><code>{{ patchBusinessBody }}</code></pre>
                  </div>
                  <p class="text-xs text-muted font-semibold uppercase mb-1">
                    Resposta (200)
                  </p>
                  <div class="rounded-lg bg-zinc-900 dark:bg-zinc-950 border border-zinc-700 overflow-hidden mb-3 max-w-full">
                    <div class="flex items-center justify-between px-4 py-2 bg-zinc-800 border-b border-zinc-700">
                      <span class="text-xs text-zinc-400 font-mono">json</span>
                    </div>
                    <pre class="p-4 text-sm text-zinc-100 overflow-x-auto font-mono leading-relaxed"><code>{{ patchBusinessResponse }}</code></pre>
                  </div>
                  <div class="rounded-lg bg-zinc-900 dark:bg-zinc-950 border border-zinc-700 overflow-hidden max-w-full">
                    <div class="flex items-center justify-between px-4 py-2 bg-zinc-800 border-b border-zinc-700">
                      <span class="text-xs text-zinc-400 font-mono">bash</span>
                      <UButton
                        icon="i-lucide-copy"
                        color="neutral"
                        variant="ghost"
                        size="xs"
                        class="text-zinc-400 hover:text-zinc-100"
                        @click="copyCode(patchBusinessCurl)"
                      />
                    </div>
                    <pre class="p-4 text-sm text-zinc-100 overflow-x-auto font-mono leading-relaxed"><code>{{ patchBusinessCurl }}</code></pre>
                  </div>
                </div>

                <!-- POST /business/:nif/offers -->
                <div>
                  <div class="flex flex-wrap items-center gap-2 mb-2 min-w-0">
                    <UBadge color="success" variant="solid" size="sm">
                      POST
                    </UBadge>
                    <code class="font-mono text-sm break-all min-w-0">/business/:nif/offers</code>
                  </div>
                  <p class="text-sm text-muted mb-3">
                    Cria uma nova oferta. O campo <code class="bg-elevated px-1 rounded text-xs font-mono">desconto</code> é uma percentagem entre 0 e 100.
                  </p>
                  <p class="text-xs text-zinc-500 mb-1 font-semibold uppercase">
                    Cabeçalhos obrigatórios
                  </p>
                  <div class="p-2 bg-elevated rounded border border-default mb-3 text-xs font-mono overflow-x-auto break-all">
                    Authorization: Bearer &lt;token&gt;<br>Content-Type: application/json
                  </div>
                  <p class="text-xs text-muted font-semibold uppercase mb-1">
                    Corpo do pedido
                  </p>
                  <div class="rounded-lg bg-zinc-900 dark:bg-zinc-950 border border-zinc-700 overflow-hidden mb-3 max-w-full">
                    <div class="flex items-center justify-between px-4 py-2 bg-zinc-800 border-b border-zinc-700">
                      <span class="text-xs text-zinc-400 font-mono">json</span>
                    </div>
                    <pre class="p-4 text-sm text-zinc-100 overflow-x-auto font-mono leading-relaxed"><code>{{ postOfferBody }}</code></pre>
                  </div>
                  <p class="text-xs text-muted font-semibold uppercase mb-1">
                    Resposta (201)
                  </p>
                  <div class="rounded-lg bg-zinc-900 dark:bg-zinc-950 border border-zinc-700 overflow-hidden mb-3 max-w-full">
                    <div class="flex items-center justify-between px-4 py-2 bg-zinc-800 border-b border-zinc-700">
                      <span class="text-xs text-zinc-400 font-mono">json</span>
                    </div>
                    <pre class="p-4 text-sm text-zinc-100 overflow-x-auto font-mono leading-relaxed"><code>{{ postOfferResponse }}</code></pre>
                  </div>
                  <div class="rounded-lg bg-zinc-900 dark:bg-zinc-950 border border-zinc-700 overflow-hidden max-w-full">
                    <div class="flex items-center justify-between px-4 py-2 bg-zinc-800 border-b border-zinc-700">
                      <span class="text-xs text-zinc-400 font-mono">bash</span>
                      <UButton
                        icon="i-lucide-copy"
                        color="neutral"
                        variant="ghost"
                        size="xs"
                        class="text-zinc-400 hover:text-zinc-100"
                        @click="copyCode(postOfferCurl)"
                      />
                    </div>
                    <pre class="p-4 text-sm text-zinc-100 overflow-x-auto font-mono leading-relaxed"><code>{{ postOfferCurl }}</code></pre>
                  </div>
                </div>

                <!-- PATCH /business/:nif/offers/:id -->
                <div>
                  <div class="flex flex-wrap items-center gap-2 mb-2 min-w-0">
                    <UBadge color="warning" variant="solid" size="sm">
                      PATCH
                    </UBadge>
                    <code class="font-mono text-sm break-all min-w-0">/business/:nif/offers/:id</code>
                  </div>
                  <p class="text-sm text-muted mb-3">
                    Atualiza uma oferta existente. Os mesmos campos do POST são aceites, todos opcionais.
                  </p>
                  <p class="text-xs text-zinc-500 mb-1 font-semibold uppercase">
                    Cabeçalhos obrigatórios
                  </p>
                  <div class="p-2 bg-elevated rounded border border-default mb-3 text-xs font-mono overflow-x-auto break-all">
                    Authorization: Bearer &lt;token&gt;<br>Content-Type: application/json
                  </div>
                  <p class="text-xs text-muted font-semibold uppercase mb-1">
                    Corpo do pedido
                  </p>
                  <div class="rounded-lg bg-zinc-900 dark:bg-zinc-950 border border-zinc-700 overflow-hidden mb-3 max-w-full">
                    <div class="flex items-center justify-between px-4 py-2 bg-zinc-800 border-b border-zinc-700">
                      <span class="text-xs text-zinc-400 font-mono">json</span>
                    </div>
                    <pre class="p-4 text-sm text-zinc-100 overflow-x-auto font-mono leading-relaxed"><code>{{ patchOfferBody }}</code></pre>
                  </div>
                  <p class="text-xs text-muted font-semibold uppercase mb-1">
                    Resposta (200)
                  </p>
                  <div class="rounded-lg bg-zinc-900 dark:bg-zinc-950 border border-zinc-700 overflow-hidden mb-3 max-w-full">
                    <div class="flex items-center justify-between px-4 py-2 bg-zinc-800 border-b border-zinc-700">
                      <span class="text-xs text-zinc-400 font-mono">json</span>
                    </div>
                    <pre class="p-4 text-sm text-zinc-100 overflow-x-auto font-mono leading-relaxed"><code>{{ patchOfferResponse }}</code></pre>
                  </div>
                  <div class="rounded-lg bg-zinc-900 dark:bg-zinc-950 border border-zinc-700 overflow-hidden max-w-full">
                    <div class="flex items-center justify-between px-4 py-2 bg-zinc-800 border-b border-zinc-700">
                      <span class="text-xs text-zinc-400 font-mono">bash</span>
                      <UButton
                        icon="i-lucide-copy"
                        color="neutral"
                        variant="ghost"
                        size="xs"
                        class="text-zinc-400 hover:text-zinc-100"
                        @click="copyCode(patchOfferCurl)"
                      />
                    </div>
                    <pre class="p-4 text-sm text-zinc-100 overflow-x-auto font-mono leading-relaxed"><code>{{ patchOfferCurl }}</code></pre>
                  </div>
                </div>

                <!-- DELETE /business/:nif/offers/:id -->
                <div>
                  <div class="flex flex-wrap items-center gap-2 mb-2 min-w-0">
                    <UBadge color="error" variant="solid" size="sm">
                      DELETE
                    </UBadge>
                    <code class="font-mono text-sm break-all min-w-0">/business/:nif/offers/:id</code>
                  </div>
                  <p class="text-sm text-muted mb-3">
                    Elimina uma oferta permanentemente. Devolve 204 sem corpo.
                  </p>
                  <p class="text-xs text-zinc-500 mb-1 font-semibold uppercase">
                    Cabeçalhos obrigatórios
                  </p>
                  <div class="p-2 bg-elevated rounded border border-default mb-3 text-xs font-mono overflow-x-auto break-all">
                    Authorization: Bearer &lt;token&gt;
                  </div>
                  <div class="rounded-lg bg-zinc-900 dark:bg-zinc-950 border border-zinc-700 overflow-hidden max-w-full">
                    <div class="flex items-center justify-between px-4 py-2 bg-zinc-800 border-b border-zinc-700">
                      <span class="text-xs text-zinc-400 font-mono">bash</span>
                      <UButton
                        icon="i-lucide-copy"
                        color="neutral"
                        variant="ghost"
                        size="xs"
                        class="text-zinc-400 hover:text-zinc-100"
                        @click="copyCode(deleteOfferCurl)"
                      />
                    </div>
                    <pre class="p-4 text-sm text-zinc-100 overflow-x-auto font-mono leading-relaxed"><code>{{ deleteOfferCurl }}</code></pre>
                  </div>
                </div>
              </div>
            </UPageCard>
          </section>

          <!-- ── 7. Notificações ── -->
          <section id="notificacoes">
            <UPageCard variant="subtle">
              <template #header>
                <h2 class="text-xl font-bold flex items-center gap-2">
                  <UIcon name="i-lucide-bell" class="text-primary" />
                  Notificações
                </h2>
              </template>
              <div class="flex flex-col gap-8 mt-2 min-w-0">
                <p class="text-sm text-muted">
                  Disponível para todas as entidades autenticadas. As notificações são enviadas automaticamente pelo sistema quando ocorrem eventos relevantes.
                </p>

                <!-- GET /notifications/inbox -->
                <div>
                  <div class="flex flex-wrap items-center gap-2 mb-2 min-w-0">
                    <UBadge color="info" variant="solid" size="sm">
                      GET
                    </UBadge>
                    <code class="font-mono text-sm break-all min-w-0">/notifications/inbox</code>
                  </div>
                  <p class="text-sm text-muted mb-3">
                    Lista todas as notificações do utilizador autenticado, por ordem decrescente de data.
                  </p>
                  <p class="text-xs text-zinc-500 mb-1 font-semibold uppercase">
                    Cabeçalhos obrigatórios
                  </p>
                  <div class="p-2 bg-elevated rounded border border-default mb-3 text-xs font-mono overflow-x-auto break-all">
                    Authorization: Bearer &lt;token&gt;
                  </div>
                  <p class="text-xs text-muted font-semibold uppercase mb-1">
                    Resposta (200)
                  </p>
                  <div class="rounded-lg bg-zinc-900 dark:bg-zinc-950 border border-zinc-700 overflow-hidden mb-3 max-w-full">
                    <div class="flex items-center justify-between px-4 py-2 bg-zinc-800 border-b border-zinc-700">
                      <span class="text-xs text-zinc-400 font-mono">json</span>
                    </div>
                    <pre class="p-4 text-sm text-zinc-100 overflow-x-auto font-mono leading-relaxed"><code>{{ getNotificationsResponse }}</code></pre>
                  </div>
                  <div class="rounded-lg bg-zinc-900 dark:bg-zinc-950 border border-zinc-700 overflow-hidden max-w-full">
                    <div class="flex items-center justify-between px-4 py-2 bg-zinc-800 border-b border-zinc-700">
                      <span class="text-xs text-zinc-400 font-mono">bash</span>
                      <UButton
                        icon="i-lucide-copy"
                        color="neutral"
                        variant="ghost"
                        size="xs"
                        class="text-zinc-400 hover:text-zinc-100"
                        @click="copyCode(getNotificationsCurl)"
                      />
                    </div>
                    <pre class="p-4 text-sm text-zinc-100 overflow-x-auto font-mono leading-relaxed"><code>{{ getNotificationsCurl }}</code></pre>
                  </div>
                </div>

                <!-- PATCH /notifications/:id -->
                <div>
                  <div class="flex flex-wrap items-center gap-2 mb-2 min-w-0">
                    <UBadge color="warning" variant="solid" size="sm">
                      PATCH
                    </UBadge>
                    <code class="font-mono text-sm break-all min-w-0">/notifications/:id</code>
                  </div>
                  <p class="text-sm text-muted mb-3">
                    Marca uma notificação como lida.
                  </p>
                  <p class="text-xs text-zinc-500 mb-1 font-semibold uppercase">
                    Cabeçalhos obrigatórios
                  </p>
                  <div class="p-2 bg-elevated rounded border border-default mb-3 text-xs font-mono overflow-x-auto break-all">
                    Authorization: Bearer &lt;token&gt;<br>Content-Type: application/json
                  </div>
                  <p class="text-xs text-muted font-semibold uppercase mb-1">
                    Corpo do pedido
                  </p>
                  <div class="rounded-lg bg-zinc-900 dark:bg-zinc-950 border border-zinc-700 overflow-hidden mb-3 max-w-full">
                    <div class="flex items-center justify-between px-4 py-2 bg-zinc-800 border-b border-zinc-700">
                      <span class="text-xs text-zinc-400 font-mono">json</span>
                    </div>
                    <pre class="p-4 text-sm text-zinc-100 overflow-x-auto font-mono leading-relaxed"><code>{{ patchNotificationBody }}</code></pre>
                  </div>
                  <p class="text-xs text-muted font-semibold uppercase mb-1">
                    Resposta (200)
                  </p>
                  <div class="rounded-lg bg-zinc-900 dark:bg-zinc-950 border border-zinc-700 overflow-hidden mb-3 max-w-full">
                    <div class="flex items-center justify-between px-4 py-2 bg-zinc-800 border-b border-zinc-700">
                      <span class="text-xs text-zinc-400 font-mono">json</span>
                    </div>
                    <pre class="p-4 text-sm text-zinc-100 overflow-x-auto font-mono leading-relaxed"><code>{{ patchNotificationResponse }}</code></pre>
                  </div>
                  <div class="rounded-lg bg-zinc-900 dark:bg-zinc-950 border border-zinc-700 overflow-hidden max-w-full">
                    <div class="flex items-center justify-between px-4 py-2 bg-zinc-800 border-b border-zinc-700">
                      <span class="text-xs text-zinc-400 font-mono">bash</span>
                      <UButton
                        icon="i-lucide-copy"
                        color="neutral"
                        variant="ghost"
                        size="xs"
                        class="text-zinc-400 hover:text-zinc-100"
                        @click="copyCode(patchNotificationCurl)"
                      />
                    </div>
                    <pre class="p-4 text-sm text-zinc-100 overflow-x-auto font-mono leading-relaxed"><code>{{ patchNotificationCurl }}</code></pre>
                  </div>
                </div>

                <!-- DELETE /notifications/:id -->
                <div>
                  <div class="flex flex-wrap items-center gap-2 mb-2 min-w-0">
                    <UBadge color="error" variant="solid" size="sm">
                      DELETE
                    </UBadge>
                    <code class="font-mono text-sm break-all min-w-0">/notifications/:id</code>
                  </div>
                  <p class="text-sm text-muted mb-3">
                    Elimina uma notificação específica. Devolve 204 sem corpo.
                  </p>
                  <p class="text-xs text-zinc-500 mb-1 font-semibold uppercase">
                    Cabeçalhos obrigatórios
                  </p>
                  <div class="p-2 bg-elevated rounded border border-default mb-3 text-xs font-mono overflow-x-auto break-all">
                    Authorization: Bearer &lt;token&gt;
                  </div>
                  <div class="rounded-lg bg-zinc-900 dark:bg-zinc-950 border border-zinc-700 overflow-hidden max-w-full">
                    <div class="flex items-center justify-between px-4 py-2 bg-zinc-800 border-b border-zinc-700">
                      <span class="text-xs text-zinc-400 font-mono">bash</span>
                      <UButton
                        icon="i-lucide-copy"
                        color="neutral"
                        variant="ghost"
                        size="xs"
                        class="text-zinc-400 hover:text-zinc-100"
                        @click="copyCode(deleteNotificationCurl)"
                      />
                    </div>
                    <pre class="p-4 text-sm text-zinc-100 overflow-x-auto font-mono leading-relaxed"><code>{{ deleteNotificationCurl }}</code></pre>
                  </div>
                </div>

                <!-- DELETE /notifications/read-all -->
                <div>
                  <div class="flex flex-wrap items-center gap-2 mb-2 min-w-0">
                    <UBadge color="error" variant="solid" size="sm">
                      DELETE
                    </UBadge>
                    <code class="font-mono text-sm break-all min-w-0">/notifications/read-all</code>
                  </div>
                  <p class="text-sm text-muted mb-3">
                    Elimina todas as notificações já lidas do utilizador autenticado. Devolve 204 sem corpo.
                  </p>
                  <p class="text-xs text-zinc-500 mb-1 font-semibold uppercase">
                    Cabeçalhos obrigatórios
                  </p>
                  <div class="p-2 bg-elevated rounded border border-default mb-3 text-xs font-mono overflow-x-auto break-all">
                    Authorization: Bearer &lt;token&gt;
                  </div>
                  <div class="rounded-lg bg-zinc-900 dark:bg-zinc-950 border border-zinc-700 overflow-hidden max-w-full">
                    <div class="flex items-center justify-between px-4 py-2 bg-zinc-800 border-b border-zinc-700">
                      <span class="text-xs text-zinc-400 font-mono">bash</span>
                      <UButton
                        icon="i-lucide-copy"
                        color="neutral"
                        variant="ghost"
                        size="xs"
                        class="text-zinc-400 hover:text-zinc-100"
                        @click="copyCode(deleteReadAllCurl)"
                      />
                    </div>
                    <pre class="p-4 text-sm text-zinc-100 overflow-x-auto font-mono leading-relaxed"><code>{{ deleteReadAllCurl }}</code></pre>
                  </div>
                </div>
              </div>
            </UPageCard>
          </section>

          <!-- ── 8. Perfil ── -->
          <section id="perfil">
            <UPageCard variant="subtle">
              <template #header>
                <h2 class="text-xl font-bold flex items-center gap-2">
                  <UIcon name="i-lucide-user-circle" class="text-primary" />
                  Perfil (Auth)
                </h2>
              </template>
              <div class="flex flex-col gap-8 mt-2 min-w-0">
                <!-- GET /users/profile -->
                <div>
                  <div class="flex flex-wrap items-center gap-2 mb-2 min-w-0">
                    <UBadge color="info" variant="solid" size="sm">
                      GET
                    </UBadge>
                    <code class="font-mono text-sm break-all min-w-0">/users/profile</code>
                  </div>
                  <p class="text-sm text-muted mb-3">
                    Devolve os dados do utilizador autenticado, incluindo o seu role.
                  </p>
                  <p class="text-xs text-zinc-500 mb-1 font-semibold uppercase">
                    Cabeçalhos obrigatórios
                  </p>
                  <div class="p-2 bg-elevated rounded border border-default mb-3 text-xs font-mono overflow-x-auto break-all">
                    Authorization: Bearer &lt;token&gt;
                  </div>
                  <p class="text-xs text-muted font-semibold uppercase mb-1">
                    Resposta (200)
                  </p>
                  <div class="rounded-lg bg-zinc-900 dark:bg-zinc-950 border border-zinc-700 overflow-hidden mb-3 max-w-full">
                    <div class="flex items-center justify-between px-4 py-2 bg-zinc-800 border-b border-zinc-700">
                      <span class="text-xs text-zinc-400 font-mono">json</span>
                    </div>
                    <pre class="p-4 text-sm text-zinc-100 overflow-x-auto font-mono leading-relaxed"><code>{{ getProfileResponse }}</code></pre>
                  </div>
                  <div class="rounded-lg bg-zinc-900 dark:bg-zinc-950 border border-zinc-700 overflow-hidden max-w-full">
                    <div class="flex items-center justify-between px-4 py-2 bg-zinc-800 border-b border-zinc-700">
                      <span class="text-xs text-zinc-400 font-mono">bash</span>
                      <UButton
                        icon="i-lucide-copy"
                        color="neutral"
                        variant="ghost"
                        size="xs"
                        class="text-zinc-400 hover:text-zinc-100"
                        @click="copyCode(getProfileCurl)"
                      />
                    </div>
                    <pre class="p-4 text-sm text-zinc-100 overflow-x-auto font-mono leading-relaxed"><code>{{ getProfileCurl }}</code></pre>
                  </div>
                </div>

                <!-- PATCH /users/profile -->
                <div>
                  <div class="flex flex-wrap items-center gap-2 mb-2 min-w-0">
                    <UBadge color="warning" variant="solid" size="sm">
                      PATCH
                    </UBadge>
                    <code class="font-mono text-sm break-all min-w-0">/users/profile</code>
                  </div>
                  <p class="text-sm text-muted mb-3">
                    Atualiza dados gerais do utilizador. Aceita <code class="bg-elevated px-1 rounded text-xs font-mono">nome_entidade</code> e <code class="bg-elevated px-1 rounded text-xs font-mono">iban</code> (ambos opcionais).
                  </p>
                  <p class="text-xs text-zinc-500 mb-1 font-semibold uppercase">
                    Cabeçalhos obrigatórios
                  </p>
                  <div class="p-2 bg-elevated rounded border border-default mb-3 text-xs font-mono overflow-x-auto break-all">
                    Authorization: Bearer &lt;token&gt;<br>Content-Type: application/json
                  </div>
                  <p class="text-xs text-muted font-semibold uppercase mb-1">
                    Corpo do pedido
                  </p>
                  <div class="rounded-lg bg-zinc-900 dark:bg-zinc-950 border border-zinc-700 overflow-hidden mb-3 max-w-full">
                    <div class="flex items-center justify-between px-4 py-2 bg-zinc-800 border-b border-zinc-700">
                      <span class="text-xs text-zinc-400 font-mono">json</span>
                    </div>
                    <pre class="p-4 text-sm text-zinc-100 overflow-x-auto font-mono leading-relaxed"><code>{{ patchProfileBody }}</code></pre>
                  </div>
                  <p class="text-xs text-muted font-semibold uppercase mb-1">
                    Resposta (200)
                  </p>
                  <div class="rounded-lg bg-zinc-900 dark:bg-zinc-950 border border-zinc-700 overflow-hidden mb-3 max-w-full">
                    <div class="flex items-center justify-between px-4 py-2 bg-zinc-800 border-b border-zinc-700">
                      <span class="text-xs text-zinc-400 font-mono">json</span>
                    </div>
                    <pre class="p-4 text-sm text-zinc-100 overflow-x-auto font-mono leading-relaxed"><code>{{ patchProfileResponse }}</code></pre>
                  </div>
                  <div class="rounded-lg bg-zinc-900 dark:bg-zinc-950 border border-zinc-700 overflow-hidden max-w-full">
                    <div class="flex items-center justify-between px-4 py-2 bg-zinc-800 border-b border-zinc-700">
                      <span class="text-xs text-zinc-400 font-mono">bash</span>
                      <UButton
                        icon="i-lucide-copy"
                        color="neutral"
                        variant="ghost"
                        size="xs"
                        class="text-zinc-400 hover:text-zinc-100"
                        @click="copyCode(patchProfileCurl)"
                      />
                    </div>
                    <pre class="p-4 text-sm text-zinc-100 overflow-x-auto font-mono leading-relaxed"><code>{{ patchProfileCurl }}</code></pre>
                  </div>
                </div>

                <!-- PATCH /users/change-password -->
                <div>
                  <div class="flex flex-wrap items-center gap-2 mb-2 min-w-0">
                    <UBadge color="warning" variant="solid" size="sm">
                      PATCH
                    </UBadge>
                    <code class="font-mono text-sm break-all min-w-0">/users/change-password</code>
                  </div>
                  <p class="text-sm text-muted mb-3">
                    Altera a password do utilizador autenticado. É necessário fornecer a password atual para confirmar a operação.
                  </p>
                  <p class="text-xs text-zinc-500 mb-1 font-semibold uppercase">
                    Cabeçalhos obrigatórios
                  </p>
                  <div class="p-2 bg-elevated rounded border border-default mb-3 text-xs font-mono overflow-x-auto break-all">
                    Authorization: Bearer &lt;token&gt;<br>Content-Type: application/json
                  </div>
                  <p class="text-xs text-muted font-semibold uppercase mb-1">
                    Corpo do pedido
                  </p>
                  <div class="rounded-lg bg-zinc-900 dark:bg-zinc-950 border border-zinc-700 overflow-hidden mb-3 max-w-full">
                    <div class="flex items-center justify-between px-4 py-2 bg-zinc-800 border-b border-zinc-700">
                      <span class="text-xs text-zinc-400 font-mono">json</span>
                    </div>
                    <pre class="p-4 text-sm text-zinc-100 overflow-x-auto font-mono leading-relaxed"><code>{{ changePasswordBody }}</code></pre>
                  </div>
                  <p class="text-xs text-muted font-semibold uppercase mb-1">
                    Resposta (200)
                  </p>
                  <div class="rounded-lg bg-zinc-900 dark:bg-zinc-950 border border-zinc-700 overflow-hidden mb-3 max-w-full">
                    <div class="flex items-center justify-between px-4 py-2 bg-zinc-800 border-b border-zinc-700">
                      <span class="text-xs text-zinc-400 font-mono">json</span>
                    </div>
                    <pre class="p-4 text-sm text-zinc-100 overflow-x-auto font-mono leading-relaxed"><code>{{ changePasswordResponse }}</code></pre>
                  </div>
                  <div class="rounded-lg bg-zinc-900 dark:bg-zinc-950 border border-zinc-700 overflow-hidden max-w-full">
                    <div class="flex items-center justify-between px-4 py-2 bg-zinc-800 border-b border-zinc-700">
                      <span class="text-xs text-zinc-400 font-mono">bash</span>
                      <UButton
                        icon="i-lucide-copy"
                        color="neutral"
                        variant="ghost"
                        size="xs"
                        class="text-zinc-400 hover:text-zinc-100"
                        @click="copyCode(changePasswordCurl)"
                      />
                    </div>
                    <pre class="p-4 text-sm text-zinc-100 overflow-x-auto font-mono leading-relaxed"><code>{{ changePasswordCurl }}</code></pre>
                  </div>
                </div>
              </div>
            </UPageCard>
          </section>
        </div>

        <!-- Table of Contents (sticky, desktop only) -->
        <aside class="hidden lg:block lg:col-span-1">
          <div class="sticky top-6">
            <UPageCard variant="subtle" :ui="{ body: 'p-4' }">
              <p class="text-xs font-semibold uppercase text-muted mb-3 tracking-wide">
                Nesta página
              </p>
              <nav class="flex flex-col gap-1">
                <button
                  v-for="section in sections"
                  :key="section.id"
                  class="text-left text-sm text-muted hover:text-default hover:bg-elevated px-2 py-1.5 rounded-md transition-colors w-full"
                  @click="scrollTo(section.id)"
                >
                  {{ section.label }}
                </button>
              </nav>
            </UPageCard>
          </div>
        </aside>
      </div>
    </template>
  </UDashboardPanel>
</template>
