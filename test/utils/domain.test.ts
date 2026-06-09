import { describe, it, expect } from 'vitest'
import { haversineKm, LEAD_PIN_VALIDITY_HOURS } from '~/utils/domain'
import type { Panel, SmartLocker } from '~/utils/domain'

describe('[RF06] Feed Geográfico — haversineKm: filtragem por raio', () => {
  it('retorna 0 km para o mesmo ponto geográfico', () => {
    expect(haversineKm(41.1579, -8.6291, 41.1579, -8.6291)).toBe(0)
  })

  it('a distância é simétrica — d(A,B) == d(B,A)', () => {
    const porto = [41.1579, -8.6291] as const
    const lisboa = [38.7169, -9.1399] as const
    const ab = haversineKm(...porto, ...lisboa)
    const ba = haversineKm(...lisboa, ...porto)
    expect(ab).toBeCloseTo(ba, 6)
  })

  it('distância é sempre não-negativa (polo norte → polo sul)', () => {
    expect(haversineKm(90, 0, -90, 0)).toBeGreaterThanOrEqual(0)
    expect(haversineKm(0, 0, 0, 180)).toBeGreaterThanOrEqual(0)
  })

  it('Porto → Lisboa ≈ 274 km (validação com coordenadas reais)', () => {
    const d = haversineKm(41.1579, -8.6291, 38.7169, -9.1399)
    expect(d).toBeGreaterThan(269)
    expect(d).toBeLessThan(280)
  })

  it('instituição fora do raio de 5 km NÃO deve aparecer no feed do painel', () => {
    const RAIO_KM = 5
    // Painel: Porto (~41.1579, -8.6291), Instituição: Vila do Conde (~24 km)
    const d = haversineKm(41.1579, -8.6291, 41.3537, -8.7427)
    expect(d).toBeGreaterThan(RAIO_KM)
  })

  it('instituição dentro do raio de 5 km DEVE aparecer no feed do painel', () => {
    const RAIO_KM = 5
    // Painel: Porto, Instituição: Paranhos/Porto (~1.5 km — dentro dos 5 km)
    const d = haversineKm(41.1579, -8.6291, 41.1700, -8.6200)
    expect(d).toBeLessThan(RAIO_KM)
  })

  it('pontos antípodas são aproximadamente metade da circunferência terrestre (~20 015 km)', () => {
    const d = haversineKm(0, 0, 0, 180)
    expect(d).toBeGreaterThan(20000)
    expect(d).toBeLessThan(20020)
  })

  it('Vila do Conde → Porto excede o raio de 20 km do painel real', () => {
    const RAIO_KM = 20
    const d = haversineKm(41.3537, -8.7427, 41.1579, -8.6291)
    expect(d).toBeGreaterThan(RAIO_KM)
  })

  it('Matosinhos → Porto está dentro do raio de 20 km do painel real', () => {
    const RAIO_KM = 20
    const d = haversineKm(41.1833, -8.6878, 41.1579, -8.6291)
    expect(d).toBeLessThan(RAIO_KM)
  })
})

describe('[RF05] Registo de Hardware — Painel: estrutura e campos obrigatórios', () => {
  it('Painel tem ID único e coordenadas GPS', () => {
    const panel: Panel = {
      id_dispositivo: 42,
      nome: 'Painel Central',
      geo_latitude: 41.1579,
      geo_longitude: -8.6291,
      raio_alcance: 5,
      localizacao: 'Porto Centro'
    }
    expect(panel.id_dispositivo).toBe(42)
    expect(panel.geo_latitude).toBeDefined()
    expect(panel.geo_longitude).toBeDefined()
  })

  it('Painel tem campo raio_alcance configurável para o feed geográfico', () => {
    const panel: Panel = {
      id_dispositivo: 1, nome: 'Painel Teste',
      geo_latitude: 41.3537, geo_longitude: -8.7427,
      raio_alcance: 5, localizacao: 'Vila do Conde'
    }
    expect(typeof panel.raio_alcance).toBe('number')
    expect(panel.raio_alcance).toBeGreaterThan(0)
  })

  it('dois Painéis com IDs diferentes representam dispositivos distintos', () => {
    const p1: Panel = { id_dispositivo: 1, nome: 'P1', geo_latitude: 41.1, geo_longitude: -8.6, raio_alcance: 5, localizacao: 'A' }
    const p2: Panel = { id_dispositivo: 2, nome: 'P2', geo_latitude: 38.7, geo_longitude: -9.1, raio_alcance: 5, localizacao: 'B' }
    expect(p1.id_dispositivo).not.toBe(p2.id_dispositivo)
  })
})

describe('[RF05] Registo de Hardware — SmartLocker: estrutura e estados', () => {
  it('SmartLocker tem ID único e coordenadas GPS', () => {
    const locker: SmartLocker = {
      id_locker: 7,
      nome: 'Locker A',
      estado: 'DISPONIVEL',
      geo_latitude: 41.1579,
      geo_longitude: -8.6291,
      localizacao: 'Rua do Porto, 10',
      total_portas: 12
    }
    expect(locker.id_locker).toBe(7)
    expect(locker.geo_latitude).toBeDefined()
    expect(locker.geo_longitude).toBeDefined()
  })

  it('SmartLocker aceita todos os estados operacionais: DISPONIVEL, INDISPONIVEL, OCUPADO, MANUTENCAO', () => {
    const estados = ['DISPONIVEL', 'INDISPONIVEL', 'OCUPADO', 'MANUTENCAO'] as const
    for (const estado of estados) {
      const locker: SmartLocker = {
        id_locker: 1, nome: 'L', estado,
        geo_latitude: 0, geo_longitude: 0, localizacao: '', total_portas: 5
      }
      expect(locker.estado).toBe(estado)
    }
  })

  it('SmartLocker tem total_portas para controlo de capacidade', () => {
    const locker: SmartLocker = {
      id_locker: 3, nome: 'Locker B', estado: 'DISPONIVEL',
      geo_latitude: 41.1, geo_longitude: -8.6, localizacao: 'Av. X', total_portas: 10
    }
    expect(locker.total_portas).toBe(10)
    expect(locker.total_portas).toBeGreaterThan(0)
  })
})

describe('[RF09][RNF05] Validade do PIN de Entrega — constante LEAD_PIN_VALIDITY_HOURS', () => {
  it('LEAD_PIN_VALIDITY_HOURS é exactamente 168 horas', () => {
    expect(LEAD_PIN_VALIDITY_HOURS).toBe(168)
  })

  it('168 horas corresponde exactamente a 7 dias', () => {
    expect(LEAD_PIN_VALIDITY_HOURS).toBe(7 * 24)
  })

  it('prazo de validade do PIN nunca é inferior a 7 dias', () => {
    expect(LEAD_PIN_VALIDITY_HOURS).toBeGreaterThanOrEqual(7 * 24)
  })
})
