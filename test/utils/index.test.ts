import { describe, it, expect } from 'vitest'
import { randomInt, randomFrom } from '~/utils/index'

describe('[RF08] Geração de PIN de Entrega — randomInt: intervalo e integridade', () => {
  it('PIN de 6 dígitos (100 000–999 999) está sempre dentro do intervalo correcto', () => {
    for (let i = 0; i < 200; i++) {
      const pin = randomInt(100000, 999999)
      expect(pin).toBeGreaterThanOrEqual(100000)
      expect(pin).toBeLessThanOrEqual(999999)
    }
  })

  it('PIN é sempre um número inteiro (sem decimais)', () => {
    for (let i = 0; i < 50; i++) {
      expect(Number.isInteger(randomInt(100000, 999999))).toBe(true)
    }
  })

  it('PIN de 6 dígitos tem sempre exactamente 6 caracteres quando convertido para string', () => {
    for (let i = 0; i < 100; i++) {
      const pin = String(randomInt(100000, 999999))
      expect(pin).toHaveLength(6)
    }
  })

  it('geração de PINs produz valores distintos — sem colisões sistemáticas (500 amostras)', () => {
    const seen = new Set<number>()
    for (let i = 0; i < 500; i++) seen.add(randomInt(100000, 999999))
    // Com 500 amostras num espaço de 900 000 valores, devem existir muitos valores únicos
    expect(seen.size).toBeGreaterThan(400)
  })

  it('randomInt(1, 10) cobre o intervalo completo [1..10]', () => {
    const seen = new Set<number>()
    for (let i = 0; i < 500; i++) seen.add(randomInt(1, 10))
    expect(seen.size).toBe(10)
  })

  it('randomInt(min, max) quando min === max retorna sempre min (PIN determinístico para testes)', () => {
    expect(randomInt(5, 5)).toBe(5)
    expect(randomInt(999999, 999999)).toBe(999999)
  })

  it('randomInt sempre retorna valor dentro de [min, max] para qualquer intervalo válido', () => {
    for (let i = 0; i < 200; i++) {
      const v = randomInt(1, 10)
      expect(v).toBeGreaterThanOrEqual(1)
      expect(v).toBeLessThanOrEqual(10)
    }
  })
})

describe('[RF08] Seleção de Item no Painel — randomFrom: escolha de bem/serviço', () => {
  it('seleciona sempre um elemento que pertence ao array de bens/serviços', () => {
    const items = ['Leite', 'Sabonete', 'Apoio jurídico', 'Vestuário']
    for (let i = 0; i < 100; i++) {
      expect(items).toContain(randomFrom(items))
    }
  })

  it('funciona com array de um único elemento', () => {
    expect(randomFrom(['Leite'])).toBe('Leite')
    expect(randomFrom([42])).toBe(42)
  })

  it('nunca retorna undefined para array não vazio', () => {
    const items = [1, 2, 3, 4, 5]
    for (let i = 0; i < 50; i++) {
      expect(randomFrom(items)).not.toBeUndefined()
    }
  })

  it('cobre todos os elementos disponíveis ao longo de várias chamadas', () => {
    const items = ['A', 'B', 'C', 'D']
    const seen = new Set<string>()
    for (let i = 0; i < 200; i++) seen.add(randomFrom(items))
    expect(seen.size).toBe(items.length)
  })
})
