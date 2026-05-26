import { format } from 'date-fns';

const fmtZmw = (n: number) => `ZMW ${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const esc = (s: any) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as any)[c]);

const buildDetailedPDFHTML = (opts: {
  title: string;
  subtitle: string;
  rangeLabel: string;
  color: string;
  username: string;
  transactions: any[];
  showType: 'in' | 'out' | 'both';
}) => {
  const { title, subtitle, rangeLabel, color, username, transactions, showType } = opts;
  const generatedAt = format(new Date(), 'PPpp');

  const cashIn = transactions.filter(t => t.type === 'cash-in');
  const cashOut = transactions.filter(t => t.type === 'cash-out');

  const totalIn = cashIn.reduce((s, t) => s + Number(t.amount || 0), 0);
  const totalOut = cashOut.reduce((s, t) => s + Number(t.amount || 0), 0);
  const totalOperationalOut = cashOut
    .filter(t => t.category_name !== 'Reserve Investment Withdrawal')
    .reduce((s, t) => s + Number(t.amount || 0), 0);
  const netBalance = totalIn - totalOperationalOut;

  const renderTable = (trades: any[], label: string) => {
    if (trades.length === 0) return '';
    const rows = trades.map(t => `
      <tr>
        <td>${esc(t.date)}</td>
        <td>${esc(t.category_name || '-')}</td>
        <td class="num">${fmtZmw(Number(t.amount || 0))}</td>
        <td>${esc(t.customer_name || '-')}</td>
        <td>${esc((t.details || '').toString().slice(0, 100))}</td>
      </tr>
    `).join('');

    return `
      <div class="section">
        <h3>${esc(label)} <span class="count">(${trades.length} entries)</span></h3>
        <table>
          <thead><tr>
            <th>Date</th>
            <th>Category</th>
            <th class="num">Amount</th>
            <th>Customer</th>
            <th>Details</th>
          </tr></thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;
  };

  let sectionsHtml = '';
  if (showType === 'in' || showType === 'both') {
    sectionsHtml += renderTable(cashIn, 'Deposits (Cash In)');
  }
  if (showType === 'out' || showType === 'both') {
    sectionsHtml += renderTable(cashOut, 'Withdrawals (Cash Out)');
  }

  let summaryHtml = '';
  if (showType === 'in') {
    summaryHtml = `
      <div><div class="lbl">Total Deposits</div><div class="val text-green">${fmtZmw(totalIn)}</div></div>
      <div><div class="lbl">Transactions</div><div class="val">${cashIn.length}</div></div>
    `;
  } else if (showType === 'out') {
    summaryHtml = `
      <div><div class="lbl">Total Withdrawals</div><div class="val text-red">${fmtZmw(totalOut)}</div></div>
      <div><div class="lbl">Transactions</div><div class="val">${cashOut.length}</div></div>
    `;
  } else {
    summaryHtml = `
      <div><div class="lbl">Total Deposits</div><div class="val text-green">${fmtZmw(totalIn)}</div></div>
      <div><div class="lbl">Total Withdrawals</div><div class="val text-red">${fmtZmw(totalOut)}</div></div>
      <div><div class="lbl">Net Balance</div><div class="val ${netBalance >= 0 ? 'text-green' : 'text-red'}">${fmtZmw(netBalance)}</div></div>
    `;
  }

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(title)}</title>
    <style>
      @page { margin: 16mm; }
      body { font-family: -apple-system, Arial, sans-serif; color: #111; padding: 8px; }
      .header { border-bottom: 4px solid ${color}; padding-bottom: 14px; margin-bottom: 18px; }
      .header h1 { color: ${color}; margin: 0 0 4px; font-size: 22px; }
      .header .meta { font-size: 11px; color: #555; }
      .section { margin-top: 18px; page-break-inside: auto; }
      .section h3 { background: #f3f4f6; padding: 8px 10px; margin: 0 0 6px; font-size: 13px; border-left: 4px solid ${color}; }
      .section h3 .count { color: #6b7280; font-weight: normal; font-size: 11px; }
      table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 16px; }
      th, td { border: 1px solid #e5e7eb; padding: 6px 8px; text-align: left; vertical-align: top; }
      th { background: ${color}; color: #fff; font-weight: 600; }
      td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
      .footer { margin-top: 24px; border: 2px solid ${color}; padding: 14px; background: #fafafa; page-break-inside: avoid; }
      .footer h2 { color: ${color}; margin: 0 0 8px; font-size: 16px; }
      .grand { display: flex; gap: 24px; justify-content: space-around; flex-wrap: wrap; }
      .grand div { text-align: center; }
      .grand .lbl { font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }
      .grand .val { font-size: 18px; font-weight: 800; margin-top: 4px; }
      .text-green { color: #059669; }
      .text-red { color: #dc2626; }
    </style></head><body>
    <div class="header">
      <h1>${esc(title)} - ${esc(username)}</h1>
      <div class="meta">${esc(subtitle)} &middot; Range: <b>${esc(rangeLabel)}</b> &middot; Generated: ${esc(generatedAt)}</div>
    </div>
    ${sectionsHtml || '<p>No transactions found for this period.</p>'}
    <div class="footer">
      <h2>Financial Summary</h2>
      <div class="grand">
        ${summaryHtml}
      </div>
    </div>
    </body></html>`;
};

const openPrint = (html: string) => {
  const w = window.open('', '_blank');
  if (w) {
    w.document.open();
    w.document.write(html);
    w.document.close();
    setTimeout(() => { try { w.focus(); w.print(); } catch {} }, 400);
  }
};

export const exportUserDepositsOnlyPDF = (username: string, transactions: any[], period: string) => {
  const html = buildDetailedPDFHTML({
    title: 'Deposits Report',
    subtitle: 'User Detailed Activity',
    rangeLabel: period,
    color: '#059669', // Green
    username,
    transactions,
    showType: 'in'
  });
  openPrint(html);
};

export const exportUserWithdrawalsOnlyPDF = (username: string, transactions: any[], period: string) => {
  const html = buildDetailedPDFHTML({
    title: 'Withdrawals Report',
    subtitle: 'User Detailed Activity',
    rangeLabel: period,
    color: '#dc2626', // Red
    username,
    transactions,
    showType: 'out'
  });
  openPrint(html);
};

export const exportUserFullActivityPDF = (username: string, transactions: any[], period: string) => {
  const html = buildDetailedPDFHTML({
    title: 'Full Financial Activity Report',
    subtitle: 'User Detailed Activity',
    rangeLabel: period,
    color: '#4f46e5', // Indigo
    username,
    transactions,
    showType: 'both'
  });
  openPrint(html);
};
