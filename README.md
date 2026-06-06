<div align="center">
  <img src="./public/logo_big.svg" alt="SAM – Sistema de Apoio Municipal" width="160" />

  <h1>SAM - Sistema de Apoio Municipal</h1>
  <p><em>Front-end da plataforma</em></p>

  <p>
    <img src="https://img.shields.io/badge/Nuxt-4-00DC82?style=for-the-badge&logo=nuxt.js&logoColor=white" alt="Nuxt 4" />
    <img src="https://img.shields.io/badge/Vue-3-4FC08D?style=for-the-badge&logo=vue.js&logoColor=white" alt="Vue 3" />
    <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS 4" />
    <img src="https://img.shields.io/badge/Zod-4-3E67B1?style=for-the-badge&logo=zod&logoColor=white" alt="Zod" />
    <img src="https://img.shields.io/badge/Socket.io-4-010101?style=for-the-badge&logo=socket.io&logoColor=white" alt="Socket.io" />
    <img src="https://img.shields.io/badge/Leaflet-1.9-199900?style=for-the-badge&logo=leaflet&logoColor=white" alt="Leaflet" />
    <img src="https://img.shields.io/badge/pnpm-10-F69220?style=for-the-badge&logo=pnpm&logoColor=white" alt="pnpm" />
  </p>

  <p>
    <a href="https://github.com/amorima/p2-sam-frontend">
      <img src="https://img.shields.io/badge/GitHub-Front--end-181717?style=flat-square&logo=github" alt="Repositório Front-end" />
    </a>
    <a href="https://github.com/amorima/p2-sam-backend">
      <img src="https://img.shields.io/badge/GitHub-Back--end-181717?style=flat-square&logo=github" alt="Repositório Back-end" />
    </a>
    <a href="https://github.com/amorima/p2-SAM-data-generator">
      <img src="https://img.shields.io/badge/GitHub-Gerador_de_Dados-181717?style=flat-square&logo=github" alt="Repositório Data Generator" />
    </a>
  </p>

  <p>
    <a href="https://github.com/amorima/p2-sam-frontend/actions/workflows/deploy.yml">
      <img src="https://github.com/amorima/p2-sam-frontend/actions/workflows/deploy.yml/badge.svg" alt="deploy frontend" />
    </a>
    <a href="https://github.com/amorima/p2-sam-frontend/actions/workflows/ci.yml">
      <img src="https://github.com/amorima/p2-sam-frontend/actions/workflows/ci.yml/badge.svg" alt="ci" />
    </a>
  </p>
</div>

---

## Contexto Académico

Projeto Interdisciplinar WebPII desenvolvido no âmbito da:

> **Licenciatura em Tecnologias e Sistemas de Informação para a Web**  
> Escola Superior de Media Artes e Design (ESMAD)  
> Politécnico do Porto

Unidades curriculares envolvidas:

| Unidade Curricular       | Âmbito no projeto                                         |
| ------------------------ | --------------------------------------------------------- |
| Engenharia de Software   | Arquitetura, modelação e boas práticas de desenvolvimento |
| Base de Dados            | Modelação de dados, esquema relacional e persistência     |
| Programação Web II       | Implementação do back-end e integração com API REST       |
| Projeto II               | Gestão de projeto, documentação e entrega                 |
| Testes e Performance Web | Testes funcionais, de performance e de usabilidade        |

### Docentes

- Prof. Doutor Lino Rui dos Santos Oliveira
- Prof. Manuel Jorge de Abreu Antunes Lima
- Prof. Diogo Filipe de Bastos Sousa Ribeiro
- Prof.ª Inês Sofia Antunes Moura Reis
- Prof.ª Viviana da Costa Neto Henriques
- Prof.ª Doutora Teresa Cristina de Sousa Azevedo Terroso
- Prof. António Francisco da Costa Machado

---

## Sobre o Projeto

O **SAM (Sistema de Apoio Municipal)** é uma plataforma web para apoio à gestão de serviços e recursos do Município de Vila do Conde. Centraliza operações municipais, coordena o programa de mecenato, gere pedidos de necessidade de instituições, integra negócios locais como parceiros e disponibiliza informação pública num painel de cidadão interativo.

A plataforma serve quatro perfis de utilizador: **Administrador Municipal**, **Mecenas** (entidade doadora), **Instituição** (IPSS/SCML) e **Negócio** (empresa parceira), cada um com a sua própria área e conjunto de funcionalidades.

---

## Funcionalidades

### Painel de Administração

- **Dashboard** com estatísticas de atividade municipal, gráficos por período e intervalo de datas personalizável
- **Gestão de Mecenas**: listagem, registo e edição de entidades mecenas, bloqueio/desbloqueio com motivo
- **Gestão de Doações**: listagem completa, alteração de estado (pendente / aceite / rejeitado), geração de comprovativos PDF e impressão térmica
- **Doação Manual**: registo de doações diretamente pelo administrador em nome de um mecenas
- **Gestão de Instituições**: registo, edição e bloqueio de instituições sociais (IPSS, SCML)
- **Pedidos de Necessidade**: listagem, aprovação e rejeição de pedidos de bens e serviços submetidos por instituições, com atribuição de método de satisfação (painel do cidadão, negócio parceiro, voucher)
- **Gestão de Negócios**: registo e edição de empresas parceiras, associação de ofertas de bens e serviços
- **Bens e Serviços**: catálogo partilhado de categorias de bens e serviços utilizadas nos pedidos e ofertas
- **Gestão de Utilizadores**: listagem e administração de todos os utilizadores da plataforma
- **Equipamentos**: monitorização de lockers inteligentes (estado, telemetria em tempo real via WebSocket)
- **Notificações / Caixa de Entrada**: sistema de notificações em tempo real via Socket.io, com detalhe por tipo de evento (doação, pedido, lead, telemetria)
- **Logs**: registo de eventos do sistema
- **Documentação da API**: página integrada com referência completa dos endpoints REST disponíveis

### Área do Mecenas

- **As Minhas Doações**: histórico com estado e download de comprovativo PDF para doações aceites
- **Nova Doação**: formulário com suporte a vários métodos de pagamento — Numerário, Transferência Bancária (IBAN), Referência Multibanco, Cheque
- Estatísticas pessoais de contribuição

### Área da Instituição

- **Os Meus Pedidos**: histórico de pedidos de necessidade com estado e itens
- **Novo Pedido**: submissão de pedidos de bens e serviços, com atribuição de urgência

### Área do Negócio

- **O Meu Negócio**: consulta e edição do perfil do negócio, gestão de ofertas (bens/serviços com desconto)
- Resposta a pedidos de parceria atribuídos pelo administrador

### Painel do Cidadão (`/painel`)

Interface pública pensada para ecrãs tácteis de tipo quiosque, com:

- Meteorologia em tempo real para Vila do Conde (OpenWeatherMap API)
- Relógio e data atualizados ao segundo
- Mapa interativo com localização do município (Leaflet)
- Formulário de doação de bens essenciais (alimentos, vestuário, higiene, material escolar, etc.) com geração de PIN único enviado por e-mail e impressão de talão térmico (ESC/POS via Web Serial API)
- Envio de telemetria de dispositivo (bateria, rede, temperatura) por WebSocket

---

## Stack Tecnológica

| Tecnologia                                                          | Versão | Para quê                                                              |
| ------------------------------------------------------------------- | ------ | --------------------------------------------------------------------- |
| [Nuxt](https://nuxt.com/)                                           | 4      | Framework principal, SSR, file-based routing e server routes (proxy)  |
| [Vue](https://vuejs.org/)                                           | 3      | UI reativa com Composition API                                        |
| [TypeScript](https://www.typescriptlang.org/)                       | 5      | Tipagem estática em todo o projeto                                    |
| [Nuxt UI](https://ui.nuxt.com/)                                     | 4      | Componentes de interface (Dashboard, Table, Modal, Form, Slideover…)  |
| [Tailwind CSS](https://tailwindcss.com/)                            | 4      | Estilos utilitários                                                   |
| [VueUse](https://vueuse.org/)                                       | 14     | Composables utilitários (createSharedComposable, useAsyncData, etc.)  |
| [Zod](https://zod.dev/)                                             | 4      | Validação de formulários e esquemas de dados                          |
| [TanStack Table](https://tanstack.com/table)                        | 8      | Tabelas com ordenação, filtros e paginação                            |
| [Unovis](https://unovis.dev/)                                       | 1.6    | Gráficos e visualizações de dados no dashboard                        |
| [Socket.io Client](https://socket.io/)                              | 4      | Notificações e telemetria em tempo real                               |
| [Leaflet](https://leafletjs.com/)                                   | 1.9    | Mapa interativo no painel do cidadão                                  |
| [jsPDF](https://github.com/parallax/jsPDF)                          | 4      | Geração de comprovativos e vouchers em PDF                            |
| [MinIO SDK](https://min.io/docs/minio/linux/developers/javascript/) | 8      | Armazenamento e acesso a ficheiros (comprovativos, avatares)          |
| [Resvg-js](https://github.com/yisibl/resvg-js)                     | 2      | Renderização de SVG para bitmap (impressão de logo no talão térmico)  |
| [date-fns](https://date-fns.org/)                                   | 4      | Formatação e manipulação de datas                                     |
| [Lucide Icons](https://lucide.dev/)                                 | —      | Ícones via Iconify                                                    |
| [pnpm](https://pnpm.io/)                                            | 10     | Gestor de pacotes                                                     |
| [ESLint](https://eslint.org/)                                       | 10     | Linting e formatação de código                                        |
| [Vitest](https://vitest.dev/) + [@vue/test-utils](https://test-utils.vuejs.org/) | 4 | Testes unitários e de componentes Vue                    |

### Comunicação com o Back-end

O front-end usa o mecanismo de **server routes do Nuxt** (`server/api/**`) como camada de proxy para a API REST do back-end. Esta abordagem:

- Evita problemas de CORS — o browser só comunica com o servidor Nuxt
- Permite ao servidor Nuxt reencaminhar automaticamente os cookies de sessão (JWT) para o back-end
- Isola o URL base do back-end do lado do cliente

O URL da API é configurado via variável de ambiente `NUXT_BACKEND_BASE`.

### Autenticação

A autenticação é baseada em JWT (JSON Web Tokens):

- **Login** via `POST /users/login` — devolve `accessToken` (curta duração) e `refreshToken` (longa duração)
- **Refresh automático** — o plugin `auth-guard.client.ts` interceta respostas `401` e renova o `accessToken` transparentemente via `refreshToken`
- **Token permanente de API** — gerado na área de Definições → API, permite acesso programático sem expiração

### Notificações em Tempo Real

O sistema de notificações usa **Socket.io** para comunicação bidirecional em tempo real:

- O composable `useNotifications` gere a ligação socket, o histórico (via REST) e o estado de leitura
- As notificações são persistidas em **MongoDB** no back-end e sincronizadas ao conectar
- A deduplicação é feita por `_id` comparando `ObjectId` e string (os dois formatos podem coexistir entre WS e REST)
- O painel do cidadão usa o mesmo socket para enviar telemetria de dispositivo (bateria, rede, temperatura)

---

## Estrutura do Projeto

```
p2-sam-frontend/
├── app/
│   ├── components/
│   │   ├── AppUserAvatar.vue         # Avatar adaptativo ao tema
│   │   ├── FileUploadField.vue       # Campo de upload de ficheiros para MinIO
│   │   ├── PainelMap.client.vue      # Mapa Leaflet (renderizado só no cliente)
│   │   ├── TablePagination.vue       # Controlo de paginação reutilizável
│   │   ├── UserMenu.vue              # Menu de utilizador com avatar e opções
│   │   ├── TeamsMenu.vue             # Seletor de equipa/contexto
│   │   ├── customers/                # Modais de gestão de utilizadores (bloquear, eliminar, adicionar)
│   │   ├── donations/                # Modais de IBAN e Referência Multibanco
│   │   ├── home/                     # Gráficos, estatísticas e seletores do dashboard
│   │   ├── inbox/                    # Caixa de entrada e detalhe por tipo de notificação
│   │   ├── instituicoes/             # Picker de negócios, editor de itens, picker de painel
│   │   ├── mecenas/                  # Modais de estado de doação, edição e registo de mecenas
│   │   ├── negocios/                 # Campo de categoria com autocomplete
│   │   └── settings/                 # Lista de membros da equipa
│   ├── composables/
│   │   ├── useAuth.ts                # Papel e identidade do utilizador autenticado
│   │   ├── useDashboard.ts           # Estado global do dashboard (período, datas)
│   │   ├── useDeviceTelemetry.ts     # Recolha de telemetria de dispositivo (bateria, rede)
│   │   ├── useLeads.ts               # Listagem e paginação de leads do painel do cidadão
│   │   ├── useNeeds.ts               # Pedidos de necessidade, negócios, bens e serviços
│   │   ├── useNotifications.ts       # Socket.io, histórico e estado de leitura de notificações
│   │   ├── usePagination.ts          # Paginação e ordenação genérica com estado partilhado
│   │   ├── usePrintAgent.ts          # Impressão via servidor de impressão local
│   │   ├── useSerialPrint.ts         # Impressão direta por Web Serial API (Chrome/Edge)
│   │   ├── useUserProfile.ts         # Perfil do utilizador autenticado
│   │   └── useVouchers.ts            # Geração e cache de vouchers PDF em MinIO
│   ├── layouts/
│   │   ├── auth.vue                  # Layout para páginas de autenticação
│   │   ├── default.vue               # Layout principal com sidebar de navegação
│   │   └── landing.vue               # Layout para páginas públicas
│   ├── middleware/
│   │   ├── admin-only.ts             # Guarda de rota para páginas exclusivas de admin
│   │   └── auth.global.ts            # Redirecionamento global para login se não autenticado
│   ├── pages/
│   │   ├── index.vue                 # Redireciona para /home
│   │   ├── home.vue                  # Dashboard com estatísticas (admin)
│   │   ├── login.vue                 # Página de login
│   │   ├── register.vue              # Registo de novo utilizador
│   │   ├── painel.vue                # Painel público do cidadão (quiosque)
│   │   ├── customers.vue             # Gestão de utilizadores (admin)
│   │   ├── inbox.vue                 # Caixa de entrada de notificações
│   │   ├── settings.vue              # Definições gerais
│   │   ├── bens-servicos/            # Catálogo de bens e serviços
│   │   ├── doacoes/                  # Listagem de doações (admin)
│   │   ├── docs/api.vue              # Documentação interativa da API REST
│   │   ├── donations/new.vue         # Formulário de nova doação (mecenas)
│   │   ├── equipamentos/             # Monitorização de lockers e telemetria
│   │   ├── instituicoes/             # Listagem, detalhe, aprovação e pedidos de instituições
│   │   ├── mecenas/                  # Listagem, detalhe e registo de mecenas
│   │   ├── negocios/                 # Listagem, detalhe e registo de negócios
│   │   ├── settings/                 # Subpáginas de definições (API tokens, membros, notificações, segurança)
│   │   └── utilizadores/[kind]/[id]  # Detalhe de utilizador por tipo
│   ├── plugins/
│   │   ├── auth-guard.client.ts      # Interceta 401 e renova JWT automaticamente
│   │   └── socket.client.ts          # Liga/desliga socket consoante o estado de sessão
│   ├── types/
│   │   └── index.d.ts                # Tipos TypeScript globais
│   └── utils/
│       ├── domain.ts                 # Tipos de domínio (entidades, pedidos, notificações, etc.)
│       ├── donationPDF.ts            # Geração de comprovativo de doação em PDF (jsPDF)
│       ├── index.ts                  # Utilitários gerais (formatação, datas, etc.)
│       ├── pickupReportPDF.ts        # Relatório de levantamento por locker em PDF
│       └── voucherPDF.ts             # Geração e upload de vouchers PDF para MinIO
│
└── server/
    ├── api/                          # Rotas proxy do Nuxt (reencaminham para o back-end com auth)
    │   ├── auth/                     # Login, refresh, perfil, avatar, password
    │   ├── api-tokens/               # CRUD de tokens permanentes de API
    │   ├── business/                 # Negócios e suas ofertas
    │   ├── customers/                # Gestão de utilizadores (bloquear, eliminar)
    │   ├── donations/                # Doações e estatísticas
    │   ├── download/                 # Proxy de ficheiros do MinIO (serve inline)
    │   ├── equipamentos/             # Lockers e eventos de telemetria
    │   ├── goods-services/           # Catálogo de bens e serviços
    │   ├── institutions/             # Instituições
    │   ├── leads/                    # Leads do painel do cidadão
    │   ├── needs/                    # Pedidos de necessidade e respostas de negócios
    │   ├── notifications/            # Notificações (inbox, marcar lido, eliminar)
    │   ├── painel/                   # Endpoints específicos do quiosque (bens, telemetria)
    │   ├── patrons/                  # Mecenas e suas doações
    │   ├── print/                    # Impressão de talões (ESC/POS bytes)
    │   ├── printers/                 # Listagem e seleção de impressora padrão
    │   └── upload/                   # Upload de ficheiros para MinIO
    └── utils/
        ├── backendFetch.ts           # Wrapper autenticado para fetch ao back-end
        ├── escpos.ts                 # Construção de sequências ESC/POS para impressão térmica
        └── rawPrint.ts               # Envio de bytes para impressora via PowerShell/lp
```

---

## Instalação

### Pré-requisitos

- [Node.js](https://nodejs.org/) >= 20
- [pnpm](https://pnpm.io/) >= 10 (`npm install -g pnpm`)

### Passos

```bash
git clone https://github.com/amorima/p2-sam-frontend.git
cd p2-sam-frontend
pnpm install
```

Criar um ficheiro `.env` na raiz:

```env
# URL base da API REST do back-end
NUXT_BACKEND_BASE=https://apisam.netdw.tech

# Chave interna partilhada com o back-end para pedidos sem autenticação de utilizador
# (ex: painel do cidadão, bens públicos). Deve coincidir com INTERNAL_API_KEY no back-end.
NUXT_INTERNAL_API_KEY=chave_interna_aqui

# Chave da OpenWeatherMap API (meteorologia no painel do cidadão)
NUXT_PUBLIC_OPEN_WEATHER_API_KEY=chave_aqui
```

```bash
pnpm dev
```

A aplicação fica disponível em `http://localhost:3000`.

### Outros comandos

```bash
pnpm typecheck        # verificação de tipos TypeScript
pnpm lint             # linting com ESLint
pnpm vitest run       # testes unitários (execução única)
pnpm vitest           # testes unitários em modo watch (interativo)
pnpm build            # build de produção (SSR)
pnpm preview          # pré-visualização do build
```

---

## Variáveis de Ambiente

| Variável                           | Descrição                                                                         |
| ---------------------------------- | --------------------------------------------------------------------------------- |
| `NUXT_BACKEND_BASE`                | URL base da API REST do back-end (servidor)                                       |
| `NUXT_INTERNAL_API_KEY`            | Chave partilhada com o back-end para pedidos internos sem sessão de utilizador    |
| `NUXT_PUBLIC_OPEN_WEATHER_API_KEY` | Chave da OpenWeatherMap API, exposta ao cliente (painel do cidadão)               |

> As variáveis prefixadas com `NUXT_PUBLIC_` são expostas ao browser; as restantes ficam apenas no servidor Nuxt.

---

## Perfis de Utilizador

| Funcionalidade                     | Admin | Mecenas | Instituição | Negócio |
| ---------------------------------- | :---: | :-----: | :---------: | :-----: |
| Dashboard com estatísticas         |  ✅   |   ❌    |     ❌      |   ❌    |
| Todas as doações                   |  ✅   |   ❌    |     ❌      |   ❌    |
| As minhas doações                  |  ❌   |   ✅    |     ❌      |   ❌    |
| Doação manual                      |  ✅   |   ❌    |     ❌      |   ❌    |
| Nova doação                        |  ❌   |   ✅    |     ❌      |   ❌    |
| Mudar estado de doação             |  ✅   |   ❌    |     ❌      |   ❌    |
| Download de comprovativo           |  ✅   |   ✅    |     ❌      |   ❌    |
| Gestão de utilizadores             |  ✅   |   ❌    |     ❌      |   ❌    |
| Pedidos de necessidade (aprovar)   |  ✅   |   ❌    |     ❌      |   ❌    |
| Pedidos de necessidade (submeter)  |  ❌   |   ❌    |     ✅      |   ❌    |
| Gestão de negócios                 |  ✅   |   ❌    |     ❌      |   ❌    |
| O meu negócio / ofertas            |  ❌   |   ❌    |     ❌      |   ✅    |
| Resposta a pedidos de parceria     |  ❌   |   ❌    |     ❌      |   ✅    |
| Equipamentos e telemetria          |  ✅   |   ❌    |     ❌      |   ❌    |
| Notificações em tempo real         |  ✅   |   ✅    |     ✅      |   ✅    |
| Token permanente de API            |  ✅   |   ✅    |     ✅      |   ✅    |
| Painel do cidadão (`/painel`)      |  ✅   |   ✅    |     ✅      |   ✅    |

---

## Decisões de Arquitetura

### Proxy via Server Routes

Todas as chamadas à API REST transitam pelo servidor Nuxt (`server/api/**`), nunca diretamente do browser para o back-end. Isto serve dois propósitos: evitar CORS e permitir que o servidor Nuxt anexe automaticamente o JWT da sessão a cada pedido via cookie.

### Estado Global com `createSharedComposable`

Os composables de estado (`useNeeds`, `useLeads`, `useNotifications`, `useAuth`) são envolvidos com `createSharedComposable` do VueUse, garantindo que partilham a mesma instância reativa em toda a aplicação sem Pinia ou Vuex.

### Painel do Cidadão como Aplicação Autónoma

O painel do cidadão (`/painel`) opera em modo não autenticado. Liga-se diretamente ao Socket.io do back-end para enviar telemetria de dispositivo e usa uma chave interna (`NUXT_INTERNAL_API_KEY`) para aceder aos endpoints públicos de bens e necessidades. O algoritmo de filtragem geográfica (Haversine) é executado no servidor Nuxt, não no browser.

### Impressão Térmica

Os talões do painel do cidadão são impressos em formato **ESC/POS** por dois caminhos alternativos:
- **Web Serial API** (`useSerialPrint`) — o browser comunica diretamente com a impressora USB (Chrome/Edge em HTTPS ou localhost)
- **Servidor de impressão local** (`usePrintAgent`) — um servidor auxiliar local recebe os bytes ESC/POS e os envia para a impressora via `lp` (Linux) ou PowerShell (Windows)

O logo SAM é renderizado de SVG para bitmap com `resvg-js` antes de ser incluído no talão, com inversão de cores para impressão em papel branco.

### Vouchers PDF em MinIO

Os vouchers são gerados uma única vez (na aprovação do pedido), carregados para o MinIO e reutilizados em acessos subsequentes. O acesso ao ficheiro é feito através de um proxy no servidor Nuxt (`/api/download/:bucket`) que serve o conteúdo inline, evitando expor o URL direto do MinIO ao browser.

---

## Outros Repositórios

| Repositório                                                               | Descrição                               |
| ------------------------------------------------------------------------- | --------------------------------------- |
| [p2-sam-frontend](https://github.com/amorima/p2-sam-frontend)             | Este repositório                        |
| [p2-sam-backend](https://github.com/amorima/p2-sam-backend)               | API REST (Express + MySQL + MongoDB)    |
| [p2-SAM-data-generator](https://github.com/amorima/p2-SAM-data-generator) | Scripts de geração de dados para testes |

---

<div align="center">
  <sub>Desenvolvido para fins académicos · ESMAD - Politécnico do Porto · 2025/2026</sub>
</div>
