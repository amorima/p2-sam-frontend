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
    <img src="https://img.shields.io/badge/Leaflet-1.9-199900?style=for-the-badge&logo=leaflet&logoColor=white" alt="Leaflet" />
    <img src="https://img.shields.io/badge/pnpm-10-F69220?style=for-the-badge&logo=pnpm&logoColor=white" alt="pnpm" />
    <img src="https://img.shields.io/badge/ESLint-9-4B32C3?style=for-the-badge&logo=eslint&logoColor=white" alt="ESLint" />
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
</div>

---

## Contexto Académico

Projeto Interdisciplinar WebPII desenvolvido no âmbito da:

> **Licenciatura em Tecnologias e Sistemas de Informação para a Web**  
> Escola Superior de Media Artes e Design (ESMAD)  
> Politécnico do Porto

Unidades curriculares envolvidas:

| Unidade Curricular | Âmbito no projeto |
|---|---|
| Engenharia de Software | Arquitetura, modelação e boas práticas de desenvolvimento |
| Base de Dados | Modelação de dados, esquema relacional e persistência |
| Programação Web II | Implementação do back-end e integração com API REST |
| Projeto II | Gestão de projeto, documentação e entrega |
| Testes e Performance Web | Testes funcionais, de performance e de usabilidade |

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

O **SAM (Sistema de Apoio Municipal)** é uma plataforma web para apoio à gestão de serviços e recursos do Município de Vila do Conde. Centraliza operações municipais, gere o programa de mecenato, regista pedidos de cidadãos e disponibiliza informação pública num painel de cidadão interativo.

Existem dois perfis de utilizador: **Administrador Municipal** e **Mecenas**, cada um com a sua própria navegação e conjunto de funcionalidades.

---

## Funcionalidades

### Painel de Administração

- **Dashboard** com estatísticas e gráficos de atividade municipal, seleção de período e intervalo de datas
- **Gestão de Mecenas**: listagem, registo e edição de entidades mecenas
- **Gestão de Doações**: todas as doações com filtros, alteração de estado (pendente / aceite / rejeitado) e download de comprovativos em PDF
- **Doação Manual**: registo de doações diretamente pelo administrador
- **Gestão de Utilizadores**: listagem e administração de utilizadores da plataforma
- **Notificações / Caixa de Entrada**: sistema de mensagens internas
- **Definições**: gestão de membros, notificações e segurança da conta

### Área do Mecenas

- **As Minhas Doações**: histórico com estado e download de comprovativo para doações aceites
- **Nova Doação**: formulário com suporte a vários métodos de pagamento:
  - Numerário
  - Transferência Bancária (IBAN)
  - Referência Multibanco
  - Cheque
- Estatísticas pessoais de contribuição

### Painel do Cidadão (`/painel`)

Interface pública pensada para ecrãs tácteis de tipo quiosque, com:

- Meteorologia em tempo real para Vila do Conde (OpenWeatherMap API)
- Relógio e data atualizados ao segundo
- Agenda municipal com próximos eventos
- Horários de transportes públicos
- Contactos de emergência e serviços municipais
- Mapa interativo com localização do município (Leaflet)
- Formulário de doação de bens essenciais (alimentos, vestuário, higiene, material escolar, etc.) com geração de código de referência único enviado por e-mail

---

## Stack Tecnológica

| Tecnologia | Versão | Para quê |
|---|---|---|
| [Nuxt](https://nuxt.com/) | 4 | Framework principal, SSR e file-based routing |
| [Vue](https://vuejs.org/) | 3 | UI reativa com Composition API |
| [TypeScript](https://www.typescriptlang.org/) | 5 | Tipagem estática em todo o projeto |
| [Nuxt UI](https://ui.nuxt.com/) | 4 | Componentes de interface (Dashboard, Table, Modal, Form...) |
| [Tailwind CSS](https://tailwindcss.com/) | 4 | Estilos utilitários |
| [VueUse](https://vueuse.org/) | 14 | Composables utilitários para Vue |
| [Zod](https://zod.dev/) | 4 | Validação de formulários e esquemas de dados |
| [TanStack Table](https://tanstack.com/table) | 8 | Tabelas com ordenação, filtros e paginação |
| [Unovis](https://unovis.dev/) | 1.6 | Gráficos e visualizações de dados |
| [Leaflet](https://leafletjs.com/) | 1.9 | Mapa interativo no painel do cidadão |
| [date-fns](https://date-fns.org/) | 4 | Formatação e manipulação de datas |
| [Lucide Icons](https://lucide.dev/) | - | Ícones via Iconify |
| [MinIO SDK](https://min.io/docs/minio/linux/developers/javascript/) | 8 | Armazenamento de comprovativos |
| [pnpm](https://pnpm.io/) | 10 | Gestor de pacotes |
| [ESLint](https://eslint.org/) | 10 | Linting e formatação de código |

### Comunicação com o Back-end

O front-end usa o `useFetch` do Nuxt para comunicar com a API REST. As rotas `/api/**` são proxiadas pelo servidor Nuxt para evitar problemas de CORS. O URL base da API é configurado via variável de ambiente:

```
NUXT_BACKEND_BASE=https://apisam.netdw.tech
```

### Outros Repositórios

| Repositório | Descrição |
|---|---|
| [p2-sam-frontend](https://github.com/amorima/p2-sam-frontend) | Este repositório |
| [p2-sam-backend](https://github.com/amorima/p2-sam-backend) | API REST e base de dados |
| [p2-SAM-data-generator](https://github.com/amorima/p2-SAM-data-generator) | Scripts de geração de dados para testes |

---

## Estrutura do Projeto

```
p2-sam-frontend/
├── app/
│   ├── components/
│   │   ├── donations/            # Modais de IBAN e Referência Multibanco
│   │   ├── home/                 # Gráficos, estatísticas e seletores do dashboard
│   │   ├── inbox/                # Componentes da caixa de entrada
│   │   ├── mecenas/              # Modais de estado, edição e registo de mecenas
│   │   ├── PainelMap.client.vue  # Mapa Leaflet (só cliente)
│   │   ├── NotificationsSlideover.vue
│   │   ├── TeamsMenu.vue
│   │   └── UserMenu.vue
│   ├── composables/
│   │   ├── useAuth.ts            # Papel do utilizador (admin / mecenas)
│   │   ├── useDashboard.ts       # Estado global do dashboard
│   │   └── useUserProfile.ts     # Perfil do utilizador autenticado
│   ├── layouts/
│   │   └── default.vue           # Layout com sidebar de navegação
│   ├── pages/
│   │   ├── index.vue             # Dashboard (admin)
│   │   ├── painel.vue            # Painel público do cidadão
│   │   ├── mecenas/
│   │   │   ├── index.vue         # Listagem de doações
│   │   │   ├── doacao.vue        # Nova doação (mecenas)
│   │   │   ├── doacao_manual.vue # Nova doação (admin)
│   │   │   └── nova.vue          # Registo de novo mecenas
│   │   ├── customers.vue         # Gestão de utilizadores
│   │   ├── inbox.vue             # Caixa de entrada
│   │   └── settings/             # Definições (geral, membros, notificações, segurança)
│   ├── utils/
│   │   ├── donationPDF.ts        # Geração de comprovativos em PDF
│   │   └── mockData.ts           # Dados de demonstração
│   └── types/
│       └── index.d.ts            # Tipos TypeScript globais
├── public/
│   ├── logo_big.svg
│   ├── logo_small.svg
│   └── VCD1.png                  # Brasão de Vila do Conde
├── nuxt.config.ts
└── package.json
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
NUXT_BACKEND_BASE=https://apisam.netdw.tech
NUXT_PUBLIC_OPEN_WEATHER_API_KEY=chave_aqui
```

```bash
pnpm dev
```

A aplicação fica disponível em `http://localhost:3000`.

### Outros comandos

```bash
pnpm typecheck   # verificação de tipos
pnpm lint        # linting
pnpm build       # build de produção
pnpm preview     # pré-visualização do build
```

---

## Variáveis de Ambiente

| Variável | Descrição |
|---|---|
| `NUXT_BACKEND_BASE` | URL base da API REST |
| `NUXT_PUBLIC_OPEN_WEATHER_API_KEY` | Chave da OpenWeatherMap API (painel do cidadão) |

---

## Perfis de Utilizador

| Funcionalidade | Administrador | Mecenas |
|---|---|---|
| Dashboard com estatísticas | ✅ | ❌ |
| Todas as doações | ✅ | ❌ |
| As minhas doações | ❌ | ✅ |
| Doação manual | ✅ | ❌ |
| Nova doação | ❌ | ✅ |
| Mudar estado de doação | ✅ | ❌ |
| Download de comprovativo | ✅ | ✅ (só aceites) |
| Gestão de utilizadores | ✅ | ❌ |
| Painel do cidadão | ✅ | ✅ (público) |

---

## Estado do Projeto

Projeto em desenvolvimento. Algumas funcionalidades do front-end aguardam integração completa com o back-end.

- [x] Dashboard com gráficos e estatísticas
- [x] Painel do cidadão com meteorologia, mapa e formulário de doação
- [x] Gestão de mecenas e doações (admin e mecenas)
- [x] Formulário de nova doação com IBAN e Referência Multibanco
- [x] Geração de comprovativos em PDF
- [x] Sistema de notificações
- [x] Navegação por papel de utilizador
- [ ] Autenticação real (JWT / sessão)
- [ ] Integração com MinIO para comprovativos
- [ ] Registo de pedidos de cidadãos
- [ ] Registo de negócios locais
- [ ] Estado de equipamentos municipais

---

<div align="center">
  <sub>Desenvolvido para fins académicos · ESMAD - Politécnico do Porto · 2024/2025</sub>
</div>
