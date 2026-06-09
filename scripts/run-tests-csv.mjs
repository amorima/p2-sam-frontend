/**
 * Executa os testes Vitest com reporter JSON e converte os resultados para CSV.
 * Uso: node scripts/run-tests-csv.mjs
 * Output: resultados/resultados-YYYY-MM-DD.csv
 */

import { execSync } from 'child_process'
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const outputDir = join(root, 'resultados')
const jsonPath = join(outputDir, 'vitest-raw.json')
const today = new Date().toISOString().slice(0, 10)
const csvPath = join(outputDir, `resultados-${today}.csv`)

mkdirSync(outputDir, { recursive: true })

// ── Metadados dos requisitos ──────────────────────────────────────────────────
const REQUIREMENTS = {
  RF01: { prioridade: 1, categoria: 'Funcional', descricao: 'Registar Mecenas/Negócios/Instituições com NIF/NIPC e morada fiscal obrigatórios' },
  RF02: { prioridade: 1, categoria: 'Funcional', descricao: 'Processar doações financeiras (transferência, cheque, numerário) ou em espécie' },
  RF03: { prioridade: 2, categoria: 'Funcional', descricao: 'Ocultar identidade pública do Mecenas se solicitado, mantendo registo interno' },
  RF04: { prioridade: 1, categoria: 'Funcional', descricao: 'Instituições registam carências com opção de Visibilidade Pública' },
  RF05: { prioridade: 2, categoria: 'Funcional', descricao: 'Admin regista Painéis e Lockers com coordenadas GPS fixas e ID único' },
  RF06: { prioridade: 2, categoria: 'Funcional', descricao: 'Filtrar necessidades e enviar ao Painel apenas as dentro do raio geográfico de 5 km' },
  RF07: { prioridade: 2, categoria: 'Funcional', descricao: 'Painel apresenta formulário para Cidadão inserir contacto/email e selecionar bem a doar' },
  RF08: { prioridade: 1, categoria: 'Funcional', descricao: 'Gerar PIN aleatório após submissão no Painel, associar à transação e enviar por email' },
  RF09: { prioridade: 1, categoria: 'Funcional', descricao: 'Locker valida PIN. Se válido e dentro do prazo (168 h), destranca a porta para depósito' },
  RF10: { prioridade: 2, categoria: 'Funcional', descricao: 'Locker confirma depósito e atualiza o estado da doação para "Entregue/Recolher"' },
  RF11: { prioridade: 1, categoria: 'Funcional', descricao: 'Admin aloca fundos de Mecenas para pagar a Negócios que prestam serviços' },
  RF12: { prioridade: 3, categoria: 'Funcional', descricao: 'Geração automática da declaração fiscal de donativo para Mecenas' },
  RNF01: { prioridade: 1, categoria: 'Não Funcional', descricao: 'A plataforma Web deve estar acessível 24/7' },
  RNF02: { prioridade: 1, categoria: 'Não Funcional', descricao: 'Painel não guarda dados locais. Limpa memória após envio ou timeout de 30 s (sessão volátil)' },
  RNF03: { prioridade: 1, categoria: 'Não Funcional', descricao: 'Comunicação entre Painéis/Lockers e Servidor exclusivamente via HTTPS com Token de autenticação' },
  RNF04: { prioridade: 2, categoria: 'Não Funcional', descricao: 'Utilizador não familiarizado completa uma doação no painel digital em menos de 60 segundos' },
  RNF05: { prioridade: 2, categoria: 'Não Funcional', descricao: 'O PIN de entrega deve expirar automaticamente e ser de uso único' },
  RNF06: { prioridade: 2, categoria: 'Não Funcional', descricao: 'Arquitetura suporta aumento de dispositivos IoT e utilizadores simultâneos sem degradação' },
  RNF07: { prioridade: 2, categoria: 'Não Funcional', descricao: 'Manter registo imutável de todas as transações críticas para auditoria' }
}

// ── Extrai IDs de requisito dos títulos dos testes ────────────────────────────
function extractReqIds(text) {
  const matches = text.match(/\[R(?:NF|F)\d+\]/g) ?? []
  return [...new Set(matches.map(m => m.slice(1, -1)))]
}

// ── Escapa célula CSV ─────────────────────────────────────────────────────────
function cell(value) {
  const s = String(value ?? '')
  return (s.includes(',') || s.includes('"') || s.includes('\n'))
    ? '"' + s.replace(/"/g, '""') + '"'
    : s
}

// ── Executa Vitest ────────────────────────────────────────────────────────────
console.log('A executar testes Vitest...\n')
let vitestExitCode = 0
try {
  execSync(
    `pnpm vitest run --reporter=json --outputFile="${jsonPath}"`,
    { cwd: root, stdio: 'inherit' }
  )
} catch (e) {
  vitestExitCode = e.status ?? 1
  // Continua para gerar CSV mesmo que existam testes falhados
}

// ── Lê resultados JSON ────────────────────────────────────────────────────────
let raw
try {
  raw = JSON.parse(readFileSync(jsonPath, 'utf-8'))
} catch (e) {
  console.error('\nErro a ler ficheiro JSON de resultados:', e.message)
  process.exit(1)
}

// ── Gera linhas do CSV ────────────────────────────────────────────────────────
const execTimestamp = new Date().toISOString().replace('T', ' ').slice(0, 19)

const headers = [
  'ID Requisito',
  'Prioridade',
  'Categoria',
  'Descrição do Requisito',
  'Suite de Teste (describe)',
  'Caso de Teste (it)',
  'Estado',
  'Duração (ms)',
  'Mensagem de Erro',
  'Ficheiro de Teste',
  'Data de Execução'
]

const rows = []

for (const fileResult of raw.testResults ?? []) {
  // Relative path from project root for readability
  const filePath = fileResult.testFilePath
    ? fileResult.testFilePath.replace(root, '').replace(/\\/g, '/').replace(/^\//, '')
    : ''

  for (const assertion of fileResult.assertionResults ?? []) {
    const suiteParts = assertion.ancestorTitles ?? []
    const suiteName = suiteParts.join(' > ')
    const testName = assertion.title ?? ''
    const fullText = `${suiteName} ${testName}`
    const reqIds = extractReqIds(fullText)

    const status = assertion.status === 'passed'
      ? 'PASSOU'
      : assertion.status === 'failed'
        ? 'FALHOU'
        : assertion.status === 'skipped'
          ? 'IGNORADO'
          : 'PENDENTE'

    const duration = typeof assertion.duration === 'number'
      ? assertion.duration.toFixed(2)
      : '0.00'

    const errorMsg = (assertion.failureMessages ?? [])
      .join(' | ')
      .replace(/\n/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 300)

    if (reqIds.length === 0) {
      rows.push(['', '', '', '', suiteName, testName, status, duration, errorMsg, filePath, execTimestamp])
    } else {
      for (const reqId of reqIds) {
        const meta = REQUIREMENTS[reqId] ?? { prioridade: '', categoria: 'Desconhecido', descricao: '' }
        rows.push([
          reqId,
          meta.prioridade,
          meta.categoria,
          meta.descricao,
          suiteName,
          testName,
          status,
          duration,
          errorMsg,
          filePath,
          execTimestamp
        ])
      }
    }
  }
}

// ── Escreve CSV ───────────────────────────────────────────────────────────────
const csvLines = [
  headers.map(cell).join(','),
  ...rows.map(r => r.map(cell).join(','))
]

// BOM UTF-8 para compatibilidade com Excel
writeFileSync(csvPath, '﻿' + csvLines.join('\n'), 'utf-8')

// ── Sumário ───────────────────────────────────────────────────────────────────
const total = raw.numTotalTests ?? 0
const passed = raw.numPassedTests ?? 0
const failed = raw.numFailedTests ?? 0
const pending = (raw.numPendingTests ?? 0) + (raw.numTodoTests ?? 0)

console.log('\n─────────────────────────────────────────')
console.log(`Resultados guardados em: ${csvPath}`)
console.log('─────────────────────────────────────────')
console.log(`Total de testes : ${total}`)
console.log(`Passaram        : ${passed}`)
console.log(`Falharam        : ${failed}`)
console.log(`Pendentes       : ${pending}`)
console.log('─────────────────────────────────────────\n')

process.exit(vitestExitCode)
