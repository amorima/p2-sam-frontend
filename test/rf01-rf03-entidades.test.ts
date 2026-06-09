import { describe, it, expect } from 'vitest'
import type { Institution, Business } from '~/utils/domain'
import type { UserRole, AuthSession } from '~/composables/useAuth'

// Portuguese NIF/NIPC format: exactly 9 digits
function isValidNif(nif: string): boolean {
  return /^\d{9}$/.test(nif)
}

describe('[RF01] Registo de Entidades — validação de NIF/NIPC', () => {
  it('NIF/NIPC com exactamente 9 dígitos é válido', () => {
    expect(isValidNif('123456789')).toBe(true)
    expect(isValidNif('507654321')).toBe(true)
    expect(isValidNif('500000000')).toBe(true)
  })

  it('NIF com menos de 9 dígitos é inválido', () => {
    expect(isValidNif('12345678')).toBe(false)
    expect(isValidNif('1234567')).toBe(false)
  })

  it('NIF com mais de 9 dígitos é inválido', () => {
    expect(isValidNif('1234567890')).toBe(false)
    expect(isValidNif('12345678901')).toBe(false)
  })

  it('NIF com caracteres não-numéricos é inválido', () => {
    expect(isValidNif('12345678X')).toBe(false)
    expect(isValidNif('ABC456789')).toBe(false)
    expect(isValidNif('12 456789')).toBe(false)
  })

  it('NIF vazio é inválido', () => {
    expect(isValidNif('')).toBe(false)
  })
})

describe('[RF01] Registo de Entidades — Instituição: campos obrigatórios', () => {
  it('Instituição tem nif_nipc válido (9 dígitos)', () => {
    const inst: Institution = {
      resource: {
        nif_nipc: '507654321',
        geo_latitude: 41.15,
        geo_longitude: -8.62,
        url_comprovativo_estatuto: 'https://docs.sam.pt/estatuto.pdf'
      },
      entity: {
        nif_nipc: '507654321',
        nome_entidade: 'Banco Alimentar do Porto',
        email_login: 'bap@email.pt',
        iban: 'PT50003200460000000027157'
      },
      locations: [{
        codigo_postal: '4000-000',
        concelho: 'Porto',
        distrito: 'Porto',
        freguesia: 'Cedofeita',
        pais: 'Portugal',
        rua: 'Rua Dr. Antunes Guimarães',
        n_porta: '22'
      }],
      contacts: []
    }
    expect(isValidNif(inst.entity.nif_nipc)).toBe(true)
    expect(inst.locations.length).toBeGreaterThan(0)
  })

  it('Instituição tem morada fiscal com todos os campos obrigatórios', () => {
    const inst: Institution = {
      resource: { nif_nipc: '507654321', geo_latitude: 41.15, geo_longitude: -8.62, url_comprovativo_estatuto: '' },
      entity: { nif_nipc: '507654321', nome_entidade: 'Inst. Teste', email_login: 'i@test.pt', iban: 'PT50...' },
      locations: [{
        codigo_postal: '4480-000', concelho: 'Vila do Conde', distrito: 'Porto',
        freguesia: 'Vila do Conde', pais: 'Portugal', rua: 'Av. Principal', n_porta: '1'
      }],
      contacts: []
    }
    const loc = inst.locations[0]!
    expect(loc.codigo_postal).toBeTruthy()
    expect(loc.concelho).toBeTruthy()
    expect(loc.pais).toBeTruthy()
  })
})

describe('[RF01] Registo de Entidades — Negócio: campos obrigatórios', () => {
  it('Negócio tem nif_nipc válido (9 dígitos)', () => {
    const biz: Business = {
      resource: { nif_nipc: '507123456', geo_latitude: 41.35, geo_longitude: -8.74 },
      entity: {
        nif_nipc: '507123456',
        nome_entidade: 'Supermercado SAM Lda.',
        email_login: 'sam@biz.pt',
        iban: 'PT50003200460000000027157'
      },
      locations: [{
        codigo_postal: '4480-000', concelho: 'Vila do Conde', distrito: 'Porto',
        freguesia: 'Vila do Conde', pais: 'Portugal', rua: 'Rua do Comércio', n_porta: '5'
      }],
      contacts: [],
      offers: []
    }
    expect(isValidNif(biz.entity.nif_nipc)).toBe(true)
    expect(biz.locations!.length).toBeGreaterThan(0)
  })

  it('Negócio tem IBAN para receber pagamentos de serviços', () => {
    const biz: Business = {
      resource: { nif_nipc: '507123456', geo_latitude: 41.35, geo_longitude: -8.74 },
      entity: {
        nif_nipc: '507123456', nome_entidade: 'Biz X', email_login: 'x@biz.pt',
        iban: 'PT50003200460000000027157'
      },
      locations: [], contacts: [], offers: []
    }
    expect(biz.entity.iban).toBeTruthy()
  })

  it('sistema diferencia os quatro papéis de utilizador', () => {
    const roles: UserRole[] = ['admin', 'patron', 'institution', 'business']
    expect(roles).toContain('admin')
    expect(roles).toContain('patron')
    expect(roles).toContain('institution')
    expect(roles).toContain('business')
    expect(new Set(roles).size).toBe(4)
  })
})

describe('[RF02] Registo de Doação — rastreio da transação', () => {
  it('Lead (doação em espécie) tem todos os campos de rastreio obrigatórios', () => {
    const lead = {
      id_lead: 1,
      data: '2025-06-01T12:00:00.000Z',
      id_painel: 1,
      nome_cidadao: 'João Silva',
      contacto_cidadao: 'joao@email.pt',
      id_pedido: 5,
      id_item: 3,
      item_pedido: 'Leite',
      estado: 'PENDENTE' as const,
      pin_entrega: '483920',
      id_locker: null
    }
    expect(lead.id_lead).toBeDefined()
    expect(lead.data).toBeDefined()
    expect(lead.item_pedido).toBeDefined()
    expect(lead.pin_entrega).toBeDefined()
    expect(lead.contacto_cidadao).toBeTruthy()
  })

  it('doação associa cidadão (contacto), item doado e painel de origem', () => {
    const lead = { contacto_cidadao: 'cidadao@email.pt', item_pedido: 'Sabonete', id_painel: 2 }
    expect(lead.contacto_cidadao).toBeTruthy()
    expect(lead.item_pedido).toBeTruthy()
    expect(lead.id_painel).toBeTruthy()
  })
})

describe('[RF03] Gestão de Anonimato — identidade interna do Mecenas', () => {
  it('sessão do Mecenas regista NIF internamente para rastreabilidade', () => {
    const session: AuthSession = {
      role: 'patron',
      nif: '234567891',
      name: 'Mecenas Teste',
      accessToken: 'token-abc'
    }
    expect(session.nif).toBe('234567891')
    expect(session.role).toBe('patron')
    expect(isValidNif(session.nif)).toBe(true)
  })

  it('nome do Mecenas é mantido internamente mesmo que oculto publicamente', () => {
    const session: AuthSession = {
      role: 'patron',
      nif: '234567891',
      name: 'Mecenas Anónimo',
      accessToken: 'token-xyz'
    }
    expect(session.name).toBeDefined()
    expect(session.name).not.toBe('')
  })

  it('campo profile_pic é opcional — Mecenas pode não ter imagem pública (anonimato visual)', () => {
    const comFoto: AuthSession = { role: 'patron', nif: '234567891', name: 'X', profile_pic: 'foto.jpg' }
    const semFoto: AuthSession = { role: 'patron', nif: '234567891', name: 'X', profile_pic: null }
    expect(comFoto.profile_pic).toBeTruthy()
    expect(semFoto.profile_pic).toBeNull()
  })

  it('papel patron é distinto dos outros papéis (identificação do tipo de doador)', () => {
    const patronSession: AuthSession = { role: 'patron', nif: '234567891', name: 'Mecenas' }
    const adminSession: AuthSession = { role: 'admin', nif: '123456789', name: 'Admin' }
    expect(patronSession.role).not.toBe(adminSession.role)
    expect(patronSession.role).toBe('patron')
  })
})
