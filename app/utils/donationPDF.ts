import { jsPDF } from 'jspdf'

export interface ReceiptDonation {
  id_doacao: number
  mecena_nif_nipc: string
  nome_entidade?: string
  data: string
  valor_transacao: number
  tipo_donativo: string
  estado: string
  url_comprovativo?: string
  iban?: string
  email?: string
  morada?: string
}

const C = {
  dark:     [15, 23, 42]   as [number, number, number],
  mid:      [71, 85, 105]  as [number, number, number],
  muted:    [100, 116, 139] as [number, number, number],
  light:    [148, 163, 184] as [number, number, number],
  bg:       [248, 250, 252] as [number, number, number],
  border:   [226, 232, 240] as [number, number, number],
  green:    [21, 128, 61]  as [number, number, number],
  greenBg:  [220, 252, 231] as [number, number, number],
  white:    [255, 255, 255] as [number, number, number],
}

export function donationDocNumber(donation: Pick<ReceiptDonation, 'id_doacao' | 'data'>) {
  return `DOA-${new Date(donation.data).getFullYear()}-${String(donation.id_doacao).padStart(4, '0')}`
}

export function generateDonationPDFBlob(donation: ReceiptDonation): Blob {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const L = 20
  const R = 190
  const W = 170

  const tc = (c: [number, number, number]) => doc.setTextColor(...c)
  const fc = (c: [number, number, number]) => doc.setFillColor(...c)
  const dc = (c: [number, number, number]) => doc.setDrawColor(...c)

  const formattedDate = new Date(donation.data).toLocaleDateString('pt-PT', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
  const formattedValue = new Intl.NumberFormat('pt-PT', {
    style: 'currency', currency: 'EUR',
  }).format(donation.valor_transacao)
  const printDate = new Date().toLocaleDateString('pt-PT', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
  const docNumber = donationDocNumber(donation)
  const tipoLabel = donation.tipo_donativo === 'NUMERARIO' ? 'Monetário' : 'Espécie'

  // ─── HEADER ───────────────────────────────────────────────────────────────
  let y = 25

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(30)
  tc(C.dark)
  doc.text('SAM', L, y)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  tc(C.muted)
  doc.text('SERVIÇO DE APOIO MUNICIPAL DE VILA DO CONDE', L, y + 6)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  tc(C.dark)
  doc.text('COMPROVATIVO DE DOAÇÃO', R, y - 3, { align: 'right' })

  doc.setFont('courier', 'normal')
  doc.setFontSize(9)
  tc(C.muted)
  doc.text(docNumber, R, y + 3.5, { align: 'right' })

  const badgeW = 20
  const badgeX = R - badgeW
  const badgeY = y + 8
  fc(C.greenBg)
  dc(C.greenBg)
  doc.roundedRect(badgeX, badgeY, badgeW, 6, 2, 2, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.5)
  tc(C.green)
  doc.text('ACEITE', R - badgeW / 2, badgeY + 4, { align: 'center' })

  // ─── DIVIDER ──────────────────────────────────────────────────────────────
  y = 42
  dc(C.dark)
  doc.setLineWidth(0.7)
  doc.line(L, y, R, y)

  // ─── PARTIES ──────────────────────────────────────────────────────────────
  y = 49
  const boxH = 34

  fc(C.bg)
  dc(C.border)
  doc.setLineWidth(0.25)
  doc.roundedRect(L, y, 82, boxH, 2, 2, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.5)
  tc(C.light)
  doc.text('MECENAS / DOADOR', L + 4, y + 7)

  const patronName = donation.nome_entidade ?? donation.mecena_nif_nipc
  const nameLines = doc.splitTextToSize(patronName, 74) as string[]
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  tc(C.dark)
  doc.text(nameLines[0]!, L + 4, y + 15)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  tc(C.muted)
  let detailY = y + 21
  doc.text(`NIF/NIPC: ${donation.mecena_nif_nipc}`, L + 4, detailY)
  if (donation.email) { detailY += 5; doc.text(`Email: ${donation.email}`, L + 4, detailY) }
  if (donation.iban)  { detailY += 5; doc.text(`IBAN: ${donation.iban}`, L + 4, detailY) }

  fc(C.bg)
  dc(C.border)
  doc.roundedRect(108, y, 82, boxH, 2, 2, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.5)
  tc(C.light)
  doc.text('BENEFICIÁRIO', 112, y + 7)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  tc(C.dark)
  doc.text('SAM', 112, y + 15)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  tc(C.muted)
  doc.text('Serviço de Apoio Municipal', 112, y + 21)
  doc.text('de Vila do Conde', 112, y + 26.5)
  doc.text('Praça Vasco da Gama, 4480-454', 112, y + 32)

  // ─── TABLE ────────────────────────────────────────────────────────────────
  y = 92

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.5)
  tc(C.light)
  doc.text('DETALHES DA DOAÇÃO', L, y)

  y += 5

  fc(C.dark)
  dc(C.dark)
  doc.rect(L, y, W, 8, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  tc(C.white)
  doc.text('DESCRIÇÃO', L + 4, y + 5.3)
  doc.text('DATA', L + 68, y + 5.3)
  doc.text('TIPO', L + 110, y + 5.3)
  doc.text('VALOR', R - 4, y + 5.3, { align: 'right' })

  y += 8

  fc(C.bg)
  dc(C.border)
  doc.setLineWidth(0.2)
  doc.rect(L, y, W, 12, 'FD')

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  tc(C.dark)
  doc.text('Donativo ao SAM', L + 4, y + 8)
  doc.text(formattedDate, L + 68, y + 8)
  doc.text(tipoLabel, L + 110, y + 8)
  doc.setFont('helvetica', 'bold')
  doc.text(formattedValue, R - 4, y + 8, { align: 'right' })

  y += 12

  // ─── TOTAL ────────────────────────────────────────────────────────────────
  y += 14

  fc(C.dark)
  dc(C.dark)
  doc.roundedRect(R - 62, y, 62, 22, 2, 2, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  tc(C.light)
  doc.text('TOTAL DOADO', R - 31, y + 7, { align: 'center' })

  doc.setFontSize(17)
  tc(C.white)
  doc.text(formattedValue, R - 31, y + 17, { align: 'center' })

  // ─── FOOTER ───────────────────────────────────────────────────────────────
  y = 270

  dc(C.border)
  doc.setLineWidth(0.25)
  doc.line(L, y, R, y)

  y += 6

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  tc(C.light)
  doc.text(`Documento emitido a ${printDate}`, L, y)
  doc.text('Este comprovativo tem validade legal como recibo de donativo.', L, y + 5)
  doc.text('Serviço de Apoio Municipal de Vila do Conde · Praça Vasco da Gama, 4480-454 Vila do Conde', L, y + 10)

  dc(C.dark)
  doc.setLineWidth(0.25)
  doc.line(R - 55, y + 10, R, y + 10)
  doc.setFontSize(7)
  tc(C.muted)
  doc.text('Assinatura autorizada / SAM', R - 27.5, y + 15, { align: 'center' })

  return doc.output('blob')
}
