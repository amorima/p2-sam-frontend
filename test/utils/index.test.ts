import { describe, it, expect } from 'vitest'
import { randomInt, randomFrom } from '~/utils/index'

describe('randomInt', () => {
  it('returns a value within [min, max]', () => {
    for (let i = 0; i < 200; i++) {
      const v = randomInt(1, 10)
      expect(v).toBeGreaterThanOrEqual(1)
      expect(v).toBeLessThanOrEqual(10)
    }
  })

  it('returns an integer', () => {
    for (let i = 0; i < 50; i++) {
      expect(Number.isInteger(randomInt(0, 100))).toBe(true)
    }
  })

  it('returns min when min equals max', () => {
    expect(randomInt(5, 5)).toBe(5)
  })

  it('covers the full range over many calls', () => {
    const seen = new Set<number>()
    for (let i = 0; i < 500; i++) seen.add(randomInt(1, 5))
    expect(seen.size).toBe(5)
  })
})

describe('randomFrom', () => {
  it('always returns an element that belongs to the array', () => {
    const arr = ['a', 'b', 'c', 'd']
    for (let i = 0; i < 100; i++) {
      expect(arr).toContain(randomFrom(arr))
    }
  })

  it('works with a single-element array', () => {
    expect(randomFrom([42])).toBe(42)
  })

  it('never returns undefined for a non-empty array', () => {
    const arr = [1, 2, 3]
    for (let i = 0; i < 50; i++) {
      expect(randomFrom(arr)).not.toBeUndefined()
    }
  })
})
