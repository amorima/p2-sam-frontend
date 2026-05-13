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

export function printDonationReceipt(donation: ReceiptDonation) {
  const formattedDate = new Date(donation.data).toLocaleDateString('pt-PT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const formattedValue = new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR'
  }).format(donation.valor_transacao)

  const printDate = new Date().toLocaleDateString('pt-PT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const docNumber = `DOA-${new Date(donation.data).getFullYear()}-${String(donation.id_doacao).padStart(4, '0')}`

  const html = `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <title>Comprovativo de Doação ${docNumber}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      font-size: 13px;
      color: #1a1a2e;
      background: #fff;
      padding: 0;
    }
    .page {
      max-width: 794px;
      margin: 0 auto;
      padding: 48px 56px;
      min-height: 100vh;
      position: relative;
    }

    /* Header / Logo */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 48px;
      padding-bottom: 32px;
      border-bottom: 3px solid #0f172a;
    }
    .logo-block {}
    .logo-text {
      font-size: 72px;
      font-weight: 900;
      letter-spacing: -4px;
      color: #0f172a;
      line-height: 1;
    }
    .logo-sub {
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 4px;
      text-transform: uppercase;
      color: #475569;
      margin-top: 4px;
    }
    .doc-block {
      text-align: right;
    }
    .doc-title {
      font-size: 22px;
      font-weight: 700;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .doc-number {
      font-size: 14px;
      color: #64748b;
      margin-top: 4px;
      font-family: 'Courier New', monospace;
    }
    .doc-status {
      display: inline-block;
      margin-top: 10px;
      padding: 4px 14px;
      background: #dcfce7;
      color: #15803d;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
    }

    /* Two-column section */
    .parties {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 32px;
      margin-bottom: 40px;
    }
    .party-box {
      padding: 20px;
      background: #f8fafc;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }
    .party-label {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #94a3b8;
      margin-bottom: 12px;
    }
    .party-name {
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 4px;
    }
    .party-detail {
      font-size: 12px;
      color: #64748b;
      line-height: 1.6;
    }

    /* Donation details table */
    .section-title {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #94a3b8;
      margin-bottom: 12px;
    }
    .details-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 32px;
    }
    .details-table thead tr {
      background: #0f172a;
      color: #fff;
    }
    .details-table th {
      padding: 10px 16px;
      text-align: left;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .details-table td {
      padding: 14px 16px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 13px;
    }
    .details-table tbody tr:last-child td {
      border-bottom: none;
    }
    .details-table tbody tr:nth-child(even) td {
      background: #f8fafc;
    }

    /* Total */
    .total-block {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 40px;
    }
    .total-box {
      padding: 20px 32px;
      background: #0f172a;
      color: #fff;
      border-radius: 8px;
      text-align: right;
      min-width: 240px;
    }
    .total-label {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #94a3b8;
      margin-bottom: 6px;
    }
    .total-value {
      font-size: 28px;
      font-weight: 900;
      letter-spacing: -1px;
    }

    /* Footer */
    .footer {
      margin-top: auto;
      padding-top: 24px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .footer-left {
      font-size: 11px;
      color: #94a3b8;
      line-height: 1.6;
    }
    .footer-right {
      text-align: right;
    }
    .signature-line {
      width: 180px;
      border-bottom: 1px solid #0f172a;
      margin-bottom: 6px;
    }
    .signature-label {
      font-size: 10px;
      color: #64748b;
    }

    @media print {
      body { background: #fff; }
      .page { padding: 32px 40px; }
      @page { size: A4; margin: 0; }
    }
  </style>
</head>
<body>
  <div class="page">
    <!-- Header -->
    <div class="header">
      <div class="logo-block">
        <div class="logo-text">SAM</div>
        <div class="logo-sub">Sistema de Apoio Municipal</div>
      </div>
      <div class="doc-block">
        <div class="doc-title">Comprovativo de Doação</div>
        <div class="doc-number">${docNumber}</div>
        <div class="doc-status">Aceite</div>
      </div>
    </div>

    <!-- Parties -->
    <div class="parties">
      <div class="party-box">
        <div class="party-label">Mecenas / Doador</div>
        <div class="party-name">${donation.nome_entidade ?? donation.mecena_nif_nipc}</div>
        <div class="party-detail">
          NIF/NIPC: ${donation.mecena_nif_nipc}<br>
          ${donation.email ? `Email: ${donation.email}<br>` : ''}
          ${donation.iban ? `IBAN: ${donation.iban}<br>` : ''}
          ${donation.morada ? `Morada: ${donation.morada}` : ''}
        </div>
      </div>
      <div class="party-box">
        <div class="party-label">Beneficiário</div>
        <div class="party-name">SAM</div>
        <div class="party-detail">
          Sistema de Apoio Municipal<br>
          Rua Central, 1<br>
          4490-000 Porto, Portugal
        </div>
      </div>
    </div>

    <!-- Donation details -->
    <div class="section-title">Detalhes da Doação</div>
    <table class="details-table">
      <thead>
        <tr>
          <th>Descrição</th>
          <th>Data</th>
          <th>Tipo</th>
          <th style="text-align:right">Valor</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Donativo ao SAM</td>
          <td>${formattedDate}</td>
          <td>${donation.tipo_donativo === 'NUMERARIO' ? 'Monetário' : 'Espécie'}</td>
          <td style="text-align:right;font-weight:700">${formattedValue}</td>
        </tr>
      </tbody>
    </table>

    <!-- Total -->
    <div class="total-block">
      <div class="total-box">
        <div class="total-label">Total Doado</div>
        <div class="total-value">${formattedValue}</div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="footer-left">
        Documento emitido a ${printDate}<br>
        Este comprovativo tem validade legal como recibo de donativo.<br>
        SAM — Sistema de Apoio Municipal · Porto, Portugal
      </div>
      <div class="footer-right">
        <div class="signature-line"></div>
        <div class="signature-label">Assinatura autorizada / SAM</div>
      </div>
    </div>
  </div>

  <script>
    window.onload = function() { window.print(); };
  </script>
</body>
</html>`

  const win = window.open('', '_blank', 'width=900,height=700')
  if (!win) return
  win.document.write(html)
  win.document.close()
}
