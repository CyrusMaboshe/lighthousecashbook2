import jsPDF from 'jspdf';

export type ExportCustomer = {
  name: string;
  email: string;
  phone?: string | null;
  totalTransactions?: number | null;
  totalSpent?: number | null;
  lastActivityDate?: string | Date | null;
};

/**
 * Export a list of customers to a PDF with the specified columns.
 * Columns: Name, Email, Phone, Total Transactions, Total Spent, Last Activity Date
 *
 * Usage:
 *   import { exportCustomersToPdf } from '@/utils/exportCustomers';
 *   exportCustomersToPdf(customersArray, { title: 'All Customers' });
 */
export async function exportCustomersToPdf(
  customers: ExportCustomer[],
  options?: { title?: string }
) {
  const doc = new jsPDF({
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 40;
  const startY = 60;
  const lineHeight = 18;

  const title = options?.title ?? 'All Customers';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(title, marginX, 32);

  // Header row
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  let y = startY;

  const columns = [
    { key: 'name', label: 'Name', width: 140 },
    { key: 'email', label: 'Email', width: 170 },
    { key: 'phone', label: 'Phone', width: 100 },
    { key: 'totalTransactions', label: 'Total Transactions', width: 90 },
    { key: 'totalSpent', label: 'Total Spent', width: 80 },
    { key: 'lastActivityDate', label: 'Last Activity Date', width: 120 },
  ] as const;

  // Adjust widths if exceeding page width
  const totalWidth = columns.reduce((sum, c) => sum + c.width, 0);
  let scale = 1;
  const availableWidth = pageWidth - marginX * 2;
  if (totalWidth > availableWidth) {
    scale = availableWidth / totalWidth;
  }

  const scaledWidths = columns.map((c) => c.width * scale);

  // Draw header background
  doc.setFillColor(245, 245, 245);
  doc.rect(marginX, y - lineHeight + 6, scaledWidths.reduce((s, w) => s + w, 0), lineHeight + 4, 'F');

  // Header labels
  let x = marginX;
  columns.forEach((col, idx) => {
    const w = scaledWidths[idx];
    doc.text(col.label, x + 4, y);
    x += w;
  });

  // Divider line
  doc.setDrawColor(220, 220, 220);
  doc.line(marginX, y + 6, marginX + scaledWidths.reduce((s, w) => s + w, 0), y + 6);

  y += lineHeight;

  // Body rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  const formatMoney = (v: number | null | undefined) =>
    typeof v === 'number' && !Number.isNaN(v) ? `K${v.toLocaleString()}` : '-';

  const formatDate = (v: string | Date | null | undefined) => {
    if (!v) return '-';
    try {
      const d = v instanceof Date ? v : new Date(v);
      if (Number.isNaN(d.getTime())) return '-';
      return d.toLocaleDateString();
    } catch {
      return '-';
    }
  };

  const ensureText = (v: unknown) => {
    if (v === null || v === undefined) return '-';
    const s = String(v);
    return s.trim().length > 0 ? s : '-';
  };

  const addPageIfNeeded = () => {
    const pageHeight = doc.internal.pageSize.getHeight();
    // Keep a little bottom margin
    if (y > pageHeight - 40) {
      doc.addPage();
      // Redraw header row on each page for readability
      y = startY;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setFillColor(245, 245, 245);
      doc.rect(marginX, y - lineHeight + 6, scaledWidths.reduce((s, w) => s + w, 0), lineHeight + 4, 'F');

      let hx = marginX;
      columns.forEach((col, idx) => {
        const w = scaledWidths[idx];
        doc.text(col.label, hx + 4, y);
        hx += w;
      });

      doc.setDrawColor(220, 220, 220);
      doc.line(marginX, y + 6, marginX + scaledWidths.reduce((s, w) => s + w, 0), y + 6);

      y += lineHeight;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
    }
  };

  customers.forEach((c) => {
    addPageIfNeeded();

    x = marginX;
    const values: Array<string> = [
      ensureText(c.name),
      ensureText(c.email),
      ensureText(c.phone),
      ensureText(c.totalTransactions ?? '-'),
      formatMoney(c.totalSpent ?? null),
      formatDate(c.lastActivityDate ?? null),
    ];

    values.forEach((val, idx) => {
      const w = scaledWidths[idx];
      // Simple text clipping by splitting overly long strings
      const text = doc.splitTextToSize(val, w - 8);
      // Draw text; if it wraps, move y for the next row accordingly
      doc.text(text as any, x + 4, y);
      x += w;
    });

    y += lineHeight;
  });

  // Save
  const fileName = (options?.title ?? 'customers')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-]/g, '');
  doc.save(`${fileName}.pdf`);
}