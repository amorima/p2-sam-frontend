export interface VoucherInfo {
  voucher_ref: string
  id_pedido: number
  nif_nipc: string
  nome_entidade: string
  tipo_bem_servico: string
  validade?: string
  data_emissao?: string
}

export function buildVoucherHtml(v: VoucherInfo): string {
  const issueDate = v.data_emissao
    ? new Date(v.data_emissao)
    : new Date()
  const validUntil = v.validade
    ? new Date(v.validade)
    : new Date(issueDate.getTime() + 90 * 24 * 60 * 60 * 1000)

  const fmt = (d: Date) => d.toLocaleDateString('pt-PT', { year: 'numeric', month: 'long', day: 'numeric' })

  const html = `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <title>Voucher SAM ${v.voucher_ref}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      font-size: 13px;
      color: #1a1a2e;
      background: #fff;
    }
    .page {
      max-width: 794px;
      margin: 0 auto;
      padding: 48px 56px;
      min-height: 100vh;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 48px;
      padding-bottom: 32px;
      border-bottom: 3px solid #0f172a;
    }
    .logo-text { font-size: 72px; font-weight: 900; letter-spacing: -4px; color: #0f172a; line-height: 1; }
    .logo-sub { font-size: 11px; font-weight: 500; letter-spacing: 4px; text-transform: uppercase; color: #475569; margin-top: 4px; }
    .doc-block { text-align: right; }
    .doc-title { font-size: 22px; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 1px; }
    .doc-number { font-size: 14px; color: #64748b; margin-top: 4px; font-family: 'Courier New', monospace; }
    .doc-status { display: inline-block; margin-top: 10px; padding: 4px 14px; background: #fef3c7; color: #b45309; border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }

    .voucher-card {
      border: 2px dashed #0f172a;
      border-radius: 12px;
      padding: 32px;
      margin-bottom: 32px;
      text-align: center;
      background: #f8fafc;
    }
    .voucher-label { font-size: 11px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: #94a3b8; }
    .voucher-ref { font-size: 36px; font-weight: 900; letter-spacing: 4px; color: #0f172a; font-family: 'Courier New', monospace; margin: 12px 0; }
    .voucher-item { font-size: 18px; color: #0f172a; font-weight: 600; }

    .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; }
    .party-box { padding: 20px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }
    .party-label { font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #94a3b8; margin-bottom: 12px; }
    .party-name { font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
    .party-detail { font-size: 12px; color: #64748b; line-height: 1.6; }

    .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 32px; }
    .meta-table td { padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
    .meta-table td:first-child { font-weight: 600; color: #475569; width: 35%; }

    .footer { margin-top: 24px; padding-top: 24px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; line-height: 1.6; }
    @media print {
      body { background: #fff; }
      .page { padding: 32px 40px; }
      @page { size: A4; margin: 0; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div>
        <div class="logo-text">SAM</div>
        <div class="logo-sub">Serviço de Apoio Municipal de Vila do Conde</div>
      </div>
      <div class="doc-block">
        <div class="doc-title">Voucher</div>
        <div class="doc-number">${v.voucher_ref}</div>
        <div class="doc-status">Pedido #${v.id_pedido}</div>
      </div>
    </div>

    <div class="voucher-card">
      <div class="voucher-label">Referência do Voucher</div>
      <div class="voucher-ref">${v.voucher_ref}</div>
      <div class="voucher-item">${v.tipo_bem_servico}</div>
    </div>

    <div class="parties">
      <div class="party-box">
        <div class="party-label">Beneficiário</div>
        <div class="party-name">${v.nome_entidade}</div>
        <div class="party-detail">NIF/NIPC: ${v.nif_nipc}</div>
      </div>
      <div class="party-box">
        <div class="party-label">Emitido por</div>
        <div class="party-name">SAM</div>
        <div class="party-detail">
          Serviço de Apoio Municipal de Vila do Conde<br>
          Praça Vasco da Gama · 4480-454 Vila do Conde
        </div>
      </div>
    </div>

    <table class="meta-table">
      <tbody>
        <tr><td>Data de Emissão</td><td>${fmt(issueDate)}</td></tr>
        <tr><td>Válido até</td><td>${fmt(validUntil)}</td></tr>
        <tr><td>Pedido associado</td><td>#${v.id_pedido}</td></tr>
      </tbody>
    </table>

    <div class="footer">
      Este voucher é nominativo e utilizável apenas nos termos definidos pelo SAM.
      Apresente este documento (impresso ou em formato digital) no momento da utilização.
    </div>
  </div>

  <script>
    window.onload = function() { window.print(); };
  </script>
</body>
</html>`

  return html
}

// Immediate client-side print window (fallback / direct use).
export function printVoucher(v: VoucherInfo) {
  const win = window.open('', '_blank', 'width=900,height=700')
  if (!win) return
  win.document.write(buildVoucherHtml(v))
  win.document.close()
}
