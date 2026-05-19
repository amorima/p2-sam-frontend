import { Resvg } from '@resvg/resvg-js'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

function ascii(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\x20-\x7E]/g, '?')
}

// Emit text + LF. ESC a alignment commands control centering/left externally.
function line(s: string): number[] {
  return [...Buffer.from(ascii(s).slice(0, 48), 'ascii'), 0x0a]
}

function separator(width = 48): number[] {
  return line('-'.repeat(width))
}

function row(label: string, value: string, width = 48): number[] {
  const l = ascii(label).slice(0, 14)
  const v = ascii(value).slice(0, width - l.length - 1)
  const pad = width - l.length - v.length
  return line(l + ' '.repeat(pad) + v)
}

function qrCodeBytes(data: string, size = 6): number[] {
  const bytes: number[] = []
  const raw = Buffer.from(data, 'ascii')
  const dataLen = raw.length + 3
  const pL = dataLen & 0xff
  const pH = (dataLen >> 8) & 0xff

  bytes.push(0x1d, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00)
  bytes.push(0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, size)
  bytes.push(0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, 0x33)
  bytes.push(0x1d, 0x28, 0x6b, pL, pH, 0x31, 0x50, 0x30, ...raw)
  bytes.push(0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30)

  return bytes
}

let _logoBytes: number[] | null = null

function buildLogoBytes(): number[] {
  try {
    const svgPath = join(process.cwd(), 'public', 'logo_big.svg')
    const svg = readFileSync(svgPath, 'utf-8')

    // The SVG uses fill="white" for the letter shapes (designed for dark backgrounds).
    // Invert to black so they print on white thermal paper.
    const printSvg = svg
      .replace(/fill="white"/g, 'fill="black"')
      .replace(/fill="#F28D38"/g, 'fill="black"')

    const resvg = new Resvg(printSvg, {
      fitTo: { mode: 'width', value: 384 },
      background: 'white'
    })
    const img = resvg.render()
    const pixels = img.pixels as Buffer
    const { width, height } = img

    const bpl = Math.ceil(width / 8)
    const cmd: number[] = [
      0x1d,
      0x76,
      0x30,
      0x00,
      bpl & 0xff,
      (bpl >> 8) & 0xff,
      height & 0xff,
      (height >> 8) & 0xff
    ]

    for (let y = 0; y < height; y++) {
      for (let xb = 0; xb < bpl; xb++) {
        let byte = 0
        for (let bit = 0; bit < 8; bit++) {
          const x = xb * 8 + bit
          if (x < width) {
            const pi = (y * width + x) * 4
            const lum
              = 0.299 * pixels[pi]!
                + 0.587 * pixels[pi + 1]!
                + 0.114 * pixels[pi + 2]!
            if (pixels[pi + 3]! > 128 && lum < 128) byte |= 0x80 >> bit
          }
        }
        cmd.push(byte)
      }
    }

    return cmd
  } catch {
    return []
  }
}

function getLogoBytes(): number[] {
  if (_logoBytes === null) _logoBytes = buildLogoBytes()
  return _logoBytes
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
  b.push(0x1b, 0x40)
  b.push(0x1b, 0x74, 0x13)

  // ── Center-aligned header ──
  b.push(0x1b, 0x61, 0x01)

  const logo = getLogoBytes()
  if (logo.length > 0) {
    b.push(...logo)
    b.push(0x0a)
  }

  b.push(0x1b, 0x45, 0x01) // bold on
  b.push(...line('SAM - VILA DO CONDE'))
  b.push(0x1b, 0x45, 0x00) // bold off
  b.push(...line('Municipio de Vila do Conde'))
  b.push(...separator(W))

  // ── Left-aligned data rows ──
  b.push(0x1b, 0x61, 0x00)
  b.push(...row('Data:', d.date, W))
  b.push(...row('Hora:', d.time, W))
  b.push(...separator(W))

  b.push(...row('Nome:', d.donorName, W))
  b.push(...row('Email:', d.donorEmail, W))
  b.push(...row('Bem doado:', d.goodName, W))
  b.push(...separator(W))

  // ── Center-aligned PIN ──
  b.push(0x1b, 0x61, 0x01)
  b.push(...line('PIN DE DEPOSITO:'))
  b.push(0x1d, 0x21, 0x11) // 2x width + 2x height
  b.push(...line(d.pin))
  b.push(0x1d, 0x21, 0x00) // normal
  b.push(...separator(W))

  // QR code
  b.push(...qrCodeBytes(d.pin, 6))
  b.push(0x0a)

  // Footer
  b.push(...line('Obrigado pela sua doacao!'))
  b.push(...line('Use o codigo ou QR-Code para '))
  b.push(...line('depositar num cacifo da rede SAM.'))

  // Feed + partial cut
  b.push(0x1b, 0x64, 0x05)
  b.push(0x1d, 0x56, 0x42, 0x00)

  return Buffer.from(b)
}
