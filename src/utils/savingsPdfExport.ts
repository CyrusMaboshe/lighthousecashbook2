
import jsPDF from 'jspdf';
import { format } from 'date-fns';

interface SavingsTransaction {
    id: string;
    action_type: 'deposit' | 'withdrawal';
    amount: number;
    description: string | null;
    initiating_user: string;
    date: string;
    time: string;
    created_at: string;
}

export const exportSavingsTransactionsToPDF = async (
    transactions: SavingsTransaction[],
    balance: number,
    username: string
) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    let yPosition = margin;

    // Header
    doc.setFillColor(79, 70, 229); // Indigo-600 (Savings primary color)
    doc.rect(0, 0, pageWidth, 50, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Lighthouse Cashbook', margin, 25);

    doc.setFontSize(16);
    doc.text('Savings Transaction History', margin, 40);

    yPosition = 70;

    // Current Balance
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Savings Account: ${username}`, margin, yPosition);
    yPosition += 10;
    doc.text(`Current Balance: ZMW ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, margin, yPosition);
    yPosition += 20;

    // Summary Stats
    const totalDeposits = transactions
        .filter(t => t.action_type === 'deposit')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalWithdrawals = transactions
        .filter(t => t.action_type === 'withdrawal')
        .reduce((sum, t) => sum + t.amount, 0);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(`Total Saved: ZMW ${totalDeposits.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, margin, yPosition);
    yPosition += 8;
    doc.text(`Total Withdrawn: ZMW ${totalWithdrawals.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, margin, yPosition);
    yPosition += 8;
    doc.text(`Total Transactions: ${transactions.length}`, margin, yPosition);
    yPosition += 20;

    // Table Headers
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);

    const headers = ['Date', 'Type', 'Amount (ZMW)', 'User', 'Description'];
    const colWidths = [35, 30, 35, 30, 60];
    let xPosition = margin;

    // Draw header background
    doc.setFillColor(240, 240, 255); // Light indigo
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

            // Re-draw headers on new page
            doc.setFont('helvetica', 'bold');
            doc.setFillColor(240, 240, 255);
            doc.rect(margin, yPosition - 5, pageWidth - (2 * margin), 15, 'F');
            let headerX = margin;
            headers.forEach((header, i) => {
                doc.text(header, headerX, yPosition + 5);
                headerX += colWidths[i];
            });
            yPosition += 20;
            doc.setFont('helvetica', 'normal');
        }

        // Alternating row colors
        if (index % 2 === 0) {
            doc.setFillColor(252, 252, 255);
            doc.rect(margin, yPosition - 3, pageWidth - (2 * margin), 12, 'F');
        }

        xPosition = margin;

        // Date
        try {
            const dateStr = transaction.date ? format(new Date(transaction.date), 'dd/MM/yyyy') : 'N/A';
            doc.text(dateStr, xPosition, yPosition + 5);
        } catch (e) {
            doc.text(String(transaction.date), xPosition, yPosition + 5);
        }
        xPosition += colWidths[0];

        // Type
        const type = transaction.action_type === 'deposit' ? 'Save' : 'Withdraw';
        doc.text(type, xPosition, yPosition + 5);
        xPosition += colWidths[1];

        // Amount with color coding
        const amountStr = transaction.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        if (transaction.action_type === 'deposit') {
            doc.setTextColor(0, 150, 0); // Green
            doc.text(`+${amountStr}`, xPosition, yPosition + 5);
        } else {
            doc.setTextColor(200, 0, 0); // Red
            doc.text(`-${amountStr}`, xPosition, yPosition + 5);
        }
        doc.setTextColor(0, 0, 0); // Reset to black
        xPosition += colWidths[2];

        // User
        const user = transaction.initiating_user || 'System';
        doc.text(user.substring(0, 15), xPosition, yPosition + 5);
        xPosition += colWidths[3];

        // Description
        const desc = transaction.description || '-';
        doc.text(desc.substring(0, 35), xPosition, yPosition + 5);

        yPosition += 12;
    });

    // Footer
    yPosition = pageHeight - 20;
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(`Report generated by ${username} on ${format(new Date(), 'PPpp')}`, margin, yPosition);
    doc.text(`Page ${doc.getNumberOfPages()}`, pageWidth - margin - 20, yPosition);

    // Generate filename
    const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm');
    const filename = `Savings_Report_${username}_${timestamp}.pdf`;

    // Save the PDF
    doc.save(filename);
};
