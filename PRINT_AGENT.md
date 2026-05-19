# SAM Print Agent — Guia de Impressão Térmica

## Visão geral da arquitetura

A aplicação SAM corre num servidor cloud. A impressora térmica está fisicamente ligada ao kiosk local. Como o servidor cloud não tem acesso à impressora local, o sistema de impressão funciona assim:

```
[Servidor Cloud]          [Kiosk Local]
  Nuxt (app)   ──────►  Browser (Chrome)
  /api/print/bytes         │
  (gera bytes ESC/POS)     │  POST localhost:9191/print
                           ▼
                    Print Agent (Node.js)
                           │
                           ▼
                    Windows Print Spooler
                           │
                           ▼
                    Impressora Térmica 80mm
```

1. O cidadão confirma a doação no kiosk.
2. O browser pede ao servidor cloud os bytes ESC/POS do talão.
3. O browser envia esses bytes para o **Print Agent** a correr localmente (`localhost:9191`).
4. O Print Agent usa a API do Windows (`winspool.drv`) para enviar os bytes em modo RAW à impressora.

O Print Agent é um servidor HTTP simples (`print-agent.cjs`) sem dependências externas — só precisa de **Node.js** instalado.

---

## Pré-requisitos

- **Node.js** instalado na máquina do kiosk (v18 ou superior)
  - Download: https://nodejs.org
- Impressora térmica de **80mm** instalada no Windows (aparece em "Dispositivos e Impressoras")
- Browser **Chrome** ou **Edge** (necessário para a app SAM)

---

## Como correr o agente

Abre um terminal (PowerShell ou CMD) na máquina do kiosk e executa:

```powershell
node "C:\SAM\p2-sam-frontend\print-agent.cjs"
```

Se tudo estiver bem, vês:

```
SAM Print Agent a correr em http://127.0.0.1:9191
Ctrl+C para parar.
```

O agente fica à escuta em `http://127.0.0.1:9191`. Para parar, prime **Ctrl+C**.

---

## Configurar nas Definições da app

1. Abre a app SAM e vai a **Definições** (só visível para administradores).
2. Na secção **Impressora de Talões**:
   - O badge **"Agente ativo"** (verde) confirma que o agente está a correr.
   - Se aparecer **"Agente offline"** (vermelho), verifica se o `print-agent.cjs` está em execução.
3. No campo **Impressora**, seleciona a impressora térmica da lista.
4. Ativa o toggle **"Imprimir talão após confirmação de doação"**.

A partir deste momento, sempre que um cidadão confirmar uma doação no Painel, o talão imprime automaticamente.

---

## Arranque automático com o Windows

Para o agente iniciar sozinho quando o kiosk liga, cria um ficheiro `.bat` na pasta de arranque do Windows.

### Passo 1 — Criar o ficheiro de arranque

Cria um ficheiro chamado `sam-print-agent.bat` com o seguinte conteúdo:

```bat
@echo off
node "C:\SAM\p2-sam-frontend\print-agent.cjs"
```

### Passo 2 — Colocar na pasta de arranque

1. Prime **Win + R**, escreve `shell:startup` e prime Enter.
2. Copia o ficheiro `sam-print-agent.bat` para essa pasta.

O agente irá iniciar automaticamente em cada arranque do Windows (na conta do utilizador atual).

### Alternativa — Agendador de Tarefas (sem janela visível)

Para correr o agente em segundo plano sem abrir uma janela de terminal:

1. Abre o **Agendador de Tarefas** (`taskschd.msc`).
2. Clica em **Criar Tarefa Básica**.
3. Nome: `SAM Print Agent`
4. Acionador: **Ao iniciar sessão**
5. Ação: **Iniciar um programa**
   - Programa: `node`
   - Argumentos: `"C:\SAM\p2-sam-frontend\print-agent.cjs"`
6. Em **Propriedades da tarefa** → separador **Geral**:
   - Ativa **"Executar independentemente de o utilizador ter sessão iniciada ou não"** (requer palavra-passe).
   - Ou usa **"Executar apenas quando o utilizador tiver sessão iniciada"** e ativa **"Ocultar"**.

---

## Endpoints do agente

| Método | URL | Descrição |
|--------|-----|-----------|
| `GET` | `/health` | Verifica se o agente está ativo. Devolve `{ ok: true }` |
| `GET` | `/printers` | Lista as impressoras instaladas no Windows. Devolve `{ printers: string[] }` |
| `POST` | `/print` | Imprime bytes ESC/POS. Corpo: `{ bytes: number[], printerName?: string }` |

O agente só aceita ligações de `127.0.0.1` — não é acessível pela rede externa.

---

## Resolução de problemas

### Badge "Agente offline" nas Definições

- Verifica se o terminal com `node print-agent.cjs` está aberto e sem erros.
- Testa manualmente no browser: abre `http://127.0.0.1:9191/health` — deve aparecer `{"ok":true}`.
- Verifica se outra aplicação está a usar a porta 9191:
  ```powershell
  netstat -ano | findstr 9191
  ```

### "ReferenceError: require is not defined"

O ficheiro foi renomeado para `.cjs` para resolver este erro. Confirma que estás a correr `print-agent.cjs` e não `print-agent.js`.

### A lista de impressoras está vazia

- Confirma que a impressora está instalada em **Dispositivos e Impressoras** do Windows.
- Verifica se o PowerShell consegue listar impressoras:
  ```powershell
  Get-WmiObject Win32_Printer | Select-Object -ExpandProperty Name
  ```

### O talão não imprime mas o agente está ativo

- Verifica se a impressora correta está selecionada nas Definições.
- Confirma que a impressora está ligada e com papel.
- Verifica se a impressora aceita modo RAW (necessário para ESC/POS). A maioria das impressoras térmicas de 80mm suporta.
- Testa a impressora com um documento normal para confirmar que está funcional no Windows.

### "PowerShell exited 1" no terminal do agente

O script PowerShell não conseguiu comunicar com a impressora. Causas comuns:
- Nome da impressora errado (sensível a maiúsculas/minúsculas — usa exatamente o nome que aparece nas Definições).
- Impressora offline ou sem papel.
- Driver da impressora corrompido — reinstala o driver.

---

## Estrutura dos ficheiros

```
p2-sam-frontend/
├── print-agent.cjs          # Agente de impressão (corre no kiosk)
├── app/
│   ├── composables/
│   │   └── usePrintAgent.ts # Composable Vue que comunica com o agente
│   └── pages/
│       ├── painel.vue       # Chama printReceipt() após confirmação
│       └── settings/
│           └── index.vue    # UI de configuração da impressora
└── server/
    ├── utils/
    │   └── escpos.ts        # Gerador de bytes ESC/POS (logo, texto, QR)
    └── api/
        └── print/
            └── bytes.post.ts # Endpoint que devolve os bytes do talão
```
