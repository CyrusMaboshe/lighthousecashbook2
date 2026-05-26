
import jsPDF from 'jspdf';
import { CashvaultTransaction } from '@/hooks/useCashvault';
import { format } from 'date-fns';

export const exportCashvaultTransactionsToPDF = async (
  transactions: CashvaultTransaction[],
  balance: number
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  let yPosition = margin;

  // Header
  doc.setFillColor(59, 130, 246); // Blue
  doc.rect(0, 0, pageWidth, 50, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Lighthouse Cashbook', margin, 25);
  
  doc.setFontSize(16);
  doc.text('Cashvault Transaction History', margin, 40);

  yPosition = 70;

  // Current Balance
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`Current Cashvault Balance: ZMW ${balance.toFixed(2)}`, margin, yPosition);
  yPosition += 20;

  // Summary Stats
  const totalDeposits = transactions
    .filter(t => t.action_type === 'deposit_from_main')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalWithdrawals = transactions
    .filter(t => t.action_type === 'withdraw_from_vault')
    .reduce((sum, t) => sum + t.amount, 0);

  doc.setFont('helvetica', 'normal');
  doc.text(`Total Deposits: ZMW ${totalDeposits.toFixed(2)}`, margin, yPosition);
  yPosition += 10;
  doc.text(`Total Withdrawals: ZMW ${totalWithdrawals.toFixed(2)}`, margin, yPosition);
  yPosition += 10;
  doc.text(`Total Transactions: ${transactions.length}`, margin, yPosition);
  yPosition += 20;

  // Table Headers
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  
  const headers = ['Date', 'Type', 'Amount (ZMW)', 'User', 'Note'];
  const colWidths = [35, 40, 30, 35, 50];
  let xPosition = margin;

  // Draw header background
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPosition - 5, pageWidth - (2 * margin), 15, 'F');

  headers.forEach((header, index) => {
    doc.text(header, xPosition, yPosition + 5);
    xPosition += colWidths[index];
  });

  yPosition += 20;

  // Transaction Rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  transactions.forEach((transaction, index) => {
    // Check if we need a new page
    if (yPosition > pageHeight - 30) {
      doc.addPage();
      yPosition = margin;
    }

    // Alternating row colors
    if (index % 2 === 0) {
      doc.setFillColor(250, 250, 250);
      doc.rect(margin, yPosition - 3, pageWidth - (2 * margin), 12, 'F');
    }

    xPosition = margin;

    // Date
    const date = format(new Date(transaction.created_at), 'dd/MM/yyyy HH:mm');
    doc.text(date, xPosition, yPosition + 5);
    xPosition += colWidths[0];

    // Type
    const type = transaction.action_type === 'deposit_from_main' ? 'Deposit' : 'Cash Withdrawal';
    doc.text(type, xPosition, yPosition + 5);
    xPosition += colWidths[1];

    // Amount with color coding
    const amount = transaction.amount.toFixed(2);
    if (transaction.action_type === 'deposit_from_main') {
      doc.setTextColor(0, 128, 0); // Green for deposits
      doc.text(`+${amount}`, xPosition, yPosition + 5);
    } else {
      doc.setTextColor(255, 0, 0); // Red for withdrawals
      doc.text(`-${amount}`, xPosition, yPosition + 5);
    }
    doc.setTextColor(0, 0, 0); // Reset to black
    xPosition += colWidths[2];

    // User
    const user = transaction.initiating_user || 'System';
    doc.text(user.substring(0, 12), xPosition, yPosition + 5);
    xPosition += colWidths[3];

    // Note
    const note = transaction.note || '-';
    doc.text(note.substring(0, 20), xPosition, yPosition + 5);

    yPosition += 15;
  });

  // Footer
  yPosition = pageHeight - 30;
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text(`Generated on ${format(new Date(), 'PPpp')}`, margin, yPosition);
  doc.text('Lighthouse Cashbook - Cashvault Report', pageWidth - margin - 80, yPosition);

  // Generate filename
  const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm');
  const filename = `Cashvault_Transactions_${timestamp}.pdf`;

  // Save the PDF
  doc.save(filename);
};
