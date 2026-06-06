import { describe, it, expect } from 'vitest'
import { haversineKm, LEAD_PIN_VALIDITY_HOURS } from '~/utils/domain'

describe('haversineKm', () => {
  it('returns 0 for the same point', () => {
    expect(haversineKm(41.1579, -8.6291, 41.1579, -8.6291)).toBe(0)
  })

  it('is symmetric — d(A,B) equals d(B,A)', () => {
    const porto = [41.1579, -8.6291] as const
    const lisboa = [38.7169, -9.1399] as const
    const ab = haversineKm(...porto, ...lisboa)
    const ba = haversineKm(...lisboa, ...porto)
    expect(ab).toBeCloseTo(ba, 6)
  })

  it('always returns a non-negative distance', () => {
    expect(haversineKm(0, 0, 0, 180)).toBeGreaterThanOrEqual(0)
    expect(haversineKm(90, 0, -90, 0)).toBeGreaterThanOrEqual(0)
  })

  it('Porto → Lisboa is approximately 274 km', () => {
    // Straight-line (great-circle) distance between the two cities
    const d = haversineKm(41.1579, -8.6291, 38.7169, -9.1399)
    expect(d).toBeGreaterThan(269)
    expect(d).toBeLessThan(280)
  })

  it('Vila do Conde → Porto is outside the 20 km painel radius', () => {
    // The citizen panel uses a 20 km catchment radius; Vila do Conde is ~24 km from Porto
    const RADIUS_KM = 20
    const d = haversineKm(41.3537, -8.7427, 41.1579, -8.6291)
    expect(d).toBeGreaterThan(RADIUS_KM)
  })

  it('Matosinhos → Porto is inside the 20 km painel radius', () => {
    const RADIUS_KM = 20
    const d = haversineKm(41.1833, -8.6878, 41.1579, -8.6291)
    expect(d).toBeLessThan(RADIUS_KM)
  })

  it('antipodal points are approximately half the Earth circumference (≈ 20 015 km)', () => {
    const d = haversineKm(0, 0, 0, 180)
    expect(d).toBeGreaterThan(20000)
    expect(d).toBeLessThan(20020)
  })
})

describe('LEAD_PIN_VALIDITY_HOURS', () => {
  it('equals 7 days in hours', () => {
    expect(LEAD_PIN_VALIDITY_HOURS).toBe(7 * 24)
  })
})
