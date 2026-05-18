// Removes diacritics for maximum thermal printer compatibility
function ascii(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\x20-\x7E]/g, '?')
}

function textBytes(s: string): number[] {
  return [...Buffer.from(ascii(s).slice(0, 48), 'ascii'), 0x0A]
}

function centeredLine(s: string, width = 48): number[] {
  const norm = ascii(s).slice(0, width)
  const pad = Math.max(0, Math.floor((width - norm.length) / 2))
  return textBytes(' '.repeat(pad) + norm)
}

function separator(width = 48): number[] {
  return textBytes('-'.repeat(width))
}

function row(label: string, value: string, width = 48): number[] {
  const l = ascii(label).slice(0, 14)
  const v = ascii(value).slice(0, width - l.length - 1)
  const pad = width - l.length - v.length
  return textBytes(l + ' '.repeat(pad) + v)
}

function qrCodeBytes(data: string, size = 6): number[] {
  const bytes: number[] = []
  const raw = Buffer.from(data, 'ascii')
  const dataLen = raw.length + 3
  const pL = dataLen & 0xFF
  const pH = (dataLen >> 8) & 0xFF

  // Select model 2
  bytes.push(0x1D, 0x28, 0x6B, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00)
  // Set module size
  bytes.push(0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x43, size)
  // Error correction: H
  bytes.push(0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x45, 0x33)
  // Store data
  bytes.push(0x1D, 0x28, 0x6B, pL, pH, 0x31, 0x50, 0x30, ...raw)
  // Print
  bytes.push(0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x51, 0x30)

  return bytes
}

export interface ReceiptData {
  printerName?: string
  donorName: string
  donorEmail: string
  goodName: string
  date: string
  time: string
  pin: string
}

export function buildEscPos(d: ReceiptData): Buffer {
  const b: number[] = []
  const W = 48

  // Initialize + Latin-1 code page (PC858)
  b.push(0x1B, 0x40)
  b.push(0x1B, 0x74, 0x13)

  // Header – center
  b.push(0x1B, 0x61, 0x01)
  b.push(0x1B, 0x45, 0x01) // bold on
  b.push(...centeredLine('SAM - VILA DO CONDE', W))
  b.push(0x1B, 0x45, 0x00) // bold off
  b.push(...centeredLine('Municipio de Vila do Conde', W))
  b.push(...separator(W))

  // Date/time – left
  b.push(0x1B, 0x61, 0x00)
  b.push(...row('Data:', d.date, W))
  b.push(...row('Hora:', d.time, W))
  b.push(...separator(W))

  // Donor info
  b.push(...row('Nome:', d.donorName, W))
  b.push(...row('Email:', d.donorEmail, W))
  b.push(...row('Bem doado:', d.goodName, W))
  b.push(...separator(W))

  // PIN – center, double size
  b.push(0x1B, 0x61, 0x01)
  b.push(...centeredLine('CODIGO DE REFERENCIA', W))
  b.push(0x1D, 0x21, 0x11) // 2x width + 2x height
  b.push(...centeredLine(d.pin, W / 2))
  b.push(0x1D, 0x21, 0x00) // normal
  b.push(...separator(W))

  // QR code
  b.push(...qrCodeBytes(d.pin, 6))
  b.push(0x0A)

  // Footer
  b.push(...centeredLine('Obrigado pela sua doacao!', W))
  b.push(...centeredLine('Use o codigo para rastrear a doacao.', W))

  // Feed + partial cut
  b.push(0x1B, 0x64, 0x05)
  b.push(0x1D, 0x56, 0x42, 0x00)

  return Buffer.from(b)
}
