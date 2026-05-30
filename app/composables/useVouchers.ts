import { generateVoucherPDFBlob, printVoucher, type VoucherInfo } from '~/utils/voucherPDF'

// A voucher is generated ONCE per reference as a PDF, uploaded to MinIO, and then
// simply re-opened from its stored file on every subsequent click — never
// regenerated. The map persists for the app session (module scope).
const voucherFileCache = new Map<string, string>()

function sanitizeRef(ref: string) {
  return ref.replace(/[^a-zA-Z0-9_-]/g, '_')
}

export function useVouchers() {
  const toast = useToast()

  // Returns a same-origin URL that streams the stored PDF inline (so it opens the
  // file directly, not the MinIO console). Uploads the PDF on first use.
  async function ensureVoucherUrl(v: VoucherInfo): Promise<string> {
    const cached = voucherFileCache.get(v.voucher_ref)
    if (cached) return cached

    const fileName = `voucher_${sanitizeRef(v.voucher_ref)}.pdf`
    const pdf = generateVoucherPDFBlob(v)
    const form = new FormData()
    form.append('file', new File([pdf], fileName, { type: 'application/pdf' }))

    await $fetch<{ url: string }>(
      `/api/upload/files?nome=${encodeURIComponent(fileName)}`,
      { method: 'POST', body: form }
    )

    // Serve via the backend stream proxy so the browser opens the PDF directly.
    const viewUrl = `/api/download/files?nome=${encodeURIComponent(fileName)}`
    voucherFileCache.set(v.voucher_ref, viewUrl)
    return viewUrl
  }

  async function openVoucher(v: VoucherInfo): Promise<void> {
    try {
      const url = await ensureVoucherUrl(v)
      window.open(url, '_blank')
    } catch {
      toast.add({
        title: 'Voucher gerado localmente',
        description: 'Não foi possível guardar no armazenamento; a abrir cópia local.',
        icon: 'i-lucide-info',
        color: 'warning'
      })
      printVoucher(v)
    }
  }

  return { openVoucher, ensureVoucherUrl }
}
