
import jsPDF from 'jspdf';

interface ReportData {
  totalCashIn: number;
  totalCashOut: number;
  netBalance: number;
  transactionCount: number;
  topCategories: Array<{
    name: string;
    amount: number;
    count: number;
  }>;
}

export const exportAutomatedReportToPDF = (
  reportData: ReportData,
  period: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      let yPosition = 30;

      // Title
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Lighthouse Media - Automated Report', margin, yPosition);
      
      yPosition += 15;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.text(`Report Period: ${period}`, margin, yPosition);
      
      yPosition += 10;
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, margin, yPosition);
      
      yPosition += 25;

      // Summary Statistics Section
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Summary Statistics', margin, yPosition);
      
      yPosition += 15;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');

      // Create summary table
      const summaryData = [
        ['Total Cash In', `ZMW ${reportData.totalCashIn.toLocaleString()}`],
        ['Total Cash Out', `ZMW ${reportData.totalCashOut.toLocaleString()}`],
        ['Net Balance', `ZMW ${reportData.netBalance.toLocaleString()}`],
        ['Total Transactions', reportData.transactionCount.toString()]
      ];

      summaryData.forEach(([label, value]) => {
        doc.text(label + ':', margin, yPosition);
        doc.text(value, margin + 80, yPosition);
        yPosition += 8;
      });

      yPosition += 20;

      // Top Categories Section
      if (reportData.topCategories.length > 0) {
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Top Categories', margin, yPosition);
        
        yPosition += 15;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');

        // Table headers
        doc.text('Category', margin, yPosition);
        doc.text('Amount (ZMW)', margin + 80, yPosition);
        doc.text('Transactions', margin + 140, yPosition);
        
        yPosition += 5;
        // Draw line under headers
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 10;

        // Table data
        doc.setFont('helvetica', 'normal');
        reportData.topCategories.forEach((category) => {
          if (yPosition > 250) { // Check if we need a new page
            doc.addPage();
            yPosition = 30;
          }
          
          doc.text(category.name, margin, yPosition);
          doc.text(category.amount.toLocaleString(), margin + 80, yPosition);
          doc.text(category.count.toString(), margin + 140, yPosition);
          yPosition += 8;
        });
      }

      // Footer
      yPosition = doc.internal.pageSize.getHeight() - 20;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text('© 2025 Lighthouse Media. All rights reserved.', margin, yPosition);

      // Save the PDF
      doc.save(`Automated_Report_${period.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
      
      resolve();
    } catch (error) {
      reject(error);
    }
  });
};
