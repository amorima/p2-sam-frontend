import { buildVoucherHtml, printVoucher, type VoucherInfo } from '~/utils/voucherPDF'

// A voucher is generated ONCE per reference, uploaded to MinIO, and then simply
// re-opened from its stored URL on every subsequent click — never regenerated.
// The map persists for the app session (module scope).
const voucherUrlCache = new Map<string, string>()

function sanitizeRef(ref: string) {
  return ref.replace(/[^a-zA-Z0-9_-]/g, '_')
}

export function useVouchers() {
  const toast = useToast()

  async function ensureVoucherUrl(v: VoucherInfo): Promise<string> {
    const cached = voucherUrlCache.get(v.voucher_ref)
    if (cached) return cached

    const html = buildVoucherHtml(v)
    const fileName = `voucher_${sanitizeRef(v.voucher_ref)}.html`
    const form = new FormData()
    form.append('file', new Blob([html], { type: 'text/html' }), fileName)

    const res = await $fetch<{ url: string }>(
      `/api/upload/files?nome=${encodeURIComponent(fileName)}`,
      { method: 'POST', body: form }
    )
    voucherUrlCache.set(v.voucher_ref, res.url)
    return res.url
  }

  // Open the voucher: from MinIO (uploading on first use), falling back to a
  // direct client-side print window if the upload is unavailable.
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
