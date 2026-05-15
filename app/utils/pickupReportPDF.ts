export interface PickupReportLead {
  id_lead: number
  data_entrega: string | null
  nome_cidadao: string
  item_pedido: string
  nome_entidade?: string
  locker_nome?: string
  porta?: number | null
  pin_entrega: string
}

export function printPickupReport(leads: PickupReportLead[]) {
  const printDate = new Date().toLocaleString('pt-PT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  // Group by locker for logistics
  const grouped = new Map<string, PickupReportLead[]>()
  leads.forEach((l) => {
    const key = l.locker_nome ?? '— Sem locker —'
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key)!.push(l)
  })

  const sections = Array.from(grouped.entries())
    .map(([locker, rows]) => {
      const tbody = rows
        .sort((a, b) => (a.porta ?? 0) - (b.porta ?? 0))
        .map(r => `
          <tr>
            <td class="porta">${r.porta != null ? `#${String(r.porta).padStart(2, '0')}` : '—'}</td>
            <td>
              <div class="primary">${r.item_pedido}</div>
              <div class="muted">para ${r.nome_entidade ?? '—'}</div>
            </td>
            <td>
              <div>${r.nome_cidadao}</div>
              <div class="muted">${r.data_entrega ? new Date(r.data_entrega).toLocaleString('pt-PT') : '—'}</div>
            </td>
            <td class="pin">${r.pin_entrega}</td>
            <td class="check"><div class="checkbox"></div></td>
          </tr>
        `).join('')

      return `
        <section class="locker">
          <div class="locker-header">
            <h2>${locker}</h2>
            <span class="locker-count">${rows.length} ${rows.length === 1 ? 'porta' : 'portas'}</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>Porta</th>
                <th>Bem · Instituição destino</th>
                <th>Cidadão · Depositado</th>
                <th>PIN</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${tbody}
            </tbody>
          </table>
        </section>
      `
    }).join('')

  const totalRows = leads.length
  const totalLockers = grouped.size

  const html = `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <title>Relatório de Levantamento — SAM</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      font-size: 12px;
      color: #1a1a2e;
      background: #fff;
    }
    .page {
      max-width: 794px;
      margin: 0 auto;
      padding: 32px 40px;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 3px solid #0f172a;
    }
    .logo-text { font-size: 48px; font-weight: 900; letter-spacing: -3px; color: #0f172a; line-height: 1; }
    .logo-sub { font-size: 10px; font-weight: 500; letter-spacing: 3px; text-transform: uppercase; color: #475569; margin-top: 4px; }
    .doc-block { text-align: right; }
    .doc-title { font-size: 18px; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 1px; }
    .doc-meta { font-size: 11px; color: #64748b; margin-top: 4px; }

    .summary {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-bottom: 28px;
    }
    .summary-box {
      padding: 12px 16px;
      background: #f8fafc;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
    }
    .summary-label { font-size: 9px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #94a3b8; }
    .summary-value { font-size: 22px; font-weight: 900; color: #0f172a; margin-top: 4px; }

    section.locker {
      margin-bottom: 24px;
      page-break-inside: avoid;
    }
    .locker-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      padding-bottom: 6px;
      border-bottom: 2px solid #0f172a;
      margin-bottom: 8px;
    }
    .locker-header h2 { font-size: 14px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 1px; }
    .locker-count { font-size: 10px; color: #64748b; font-weight: 600; }

    table { width: 100%; border-collapse: collapse; }
    thead tr { background: #0f172a; color: #fff; }
    th { padding: 6px 8px; text-align: left; font-size: 9px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }
    td { padding: 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px; vertical-align: top; }
    tbody tr:nth-child(even) td { background: #f8fafc; }
    .primary { font-weight: 600; color: #0f172a; }
    .muted { font-size: 10px; color: #64748b; margin-top: 2px; }
    .porta { font-family: 'Courier New', monospace; font-weight: 700; font-size: 13px; color: #0f172a; width: 50px; }
    .pin { font-family: 'Courier New', monospace; font-weight: 700; letter-spacing: 2px; color: #0f172a; width: 80px; }
    .check { width: 30px; }
    .checkbox { width: 16px; height: 16px; border: 1.5px solid #0f172a; border-radius: 3px; }

    .footer {
      margin-top: 32px;
      padding-top: 12px;
      border-top: 1px solid #e2e8f0;
      font-size: 10px;
      color: #94a3b8;
      line-height: 1.6;
    }

    @media print {
      .page { padding: 24px 32px; }
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
        <div class="doc-title">Relatório de Levantamento</div>
        <div class="doc-meta">Bens prontos para recolha</div>
        <div class="doc-meta">Emitido a ${printDate}</div>
      </div>
    </div>

    <div class="summary">
      <div class="summary-box">
        <div class="summary-label">Bens a levantar</div>
        <div class="summary-value">${totalRows}</div>
      </div>
      <div class="summary-box">
        <div class="summary-label">Lockers</div>
        <div class="summary-value">${totalLockers}</div>
      </div>
      <div class="summary-box">
        <div class="summary-label">Portas ocupadas</div>
        <div class="summary-value">${totalRows}</div>
      </div>
    </div>

    ${totalRows === 0
      ? '<p style="text-align:center;padding:48px;color:#94a3b8;">Não há bens prontos para levantamento.</p>'
      : sections}

    <div class="footer">
      Apresentar este relatório no momento da recolha. Cada porta deve ser confirmada (checkbox) após validação do PIN no locker correspondente.<br>
      Serviço de Apoio Municipal de Vila do Conde · Praça Vasco da Gama, 4480-454 Vila do Conde
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
