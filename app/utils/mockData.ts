export const mockPatron = {
  resource: { nif_nipc: '123456789' },
  entity: {
    nif_nipc: '123456789',
    nome_entidade: 'Patron Organization, Lda.',
    email_login: 'patron@example.com',
    iban: 'PT50000201234567890123456789'
  },
  locations: [
    {
      rua: 'Rua de Exemplo',
      n_porta: '10',
      codigo_postal: '1000-100',
      concelho: 'Lisboa',
      distrito: 'Lisboa',
      freguesia: 'Santa Maria Maior',
      pais: 'Portugal'
    }
  ],
  contacts: [
    {
      contacto: '912345678',
      nome_contacto: 'João Silva',
      descricao: 'Responsável'
    }
  ]
}

export const mockApprovedDonation = {
  id_doacao: 1001,
  mecena_nif_nipc: '123456789',
  nome_entidade: 'Patron Organization, Lda.',
  data: '2026-03-20T00:00:00.000Z',
  valor_transacao: 500,
  tipo_donativo: 'NUMERARIO' as const,
  anonimo: false,
  url_comprovativo: '',
  estado: 'ACEITE' as const
}
