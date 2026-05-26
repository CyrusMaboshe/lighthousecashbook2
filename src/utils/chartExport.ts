
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const exportChartsToPDF = async (
  cashFlowChartRef: HTMLElement | null,
  netBalanceChartRef: HTMLElement | null,
  reportTitle: string
) => {
  if (!cashFlowChartRef || !netBalanceChartRef) {
    throw new Error('Chart elements not found');
  }

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;

  // Add title
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text(reportTitle, pageWidth / 2, margin, { align: 'center' });

  // Add generation date
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  const date = new Date().toLocaleDateString();
  pdf.text(`Generated on: ${date}`, pageWidth / 2, margin + 10, { align: 'center' });

  let yPosition = margin + 25;

  try {
    // Capture Cash Flow Chart
    const cashFlowCanvas = await html2canvas(cashFlowChartRef, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      allowTaint: true
    });

    const cashFlowImgData = cashFlowCanvas.toDataURL('image/png');
    const cashFlowAspectRatio = cashFlowCanvas.height / cashFlowCanvas.width;
    const cashFlowHeight = contentWidth * cashFlowAspectRatio;

    // Add Cash Flow Chart title
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Cash Flow Trend', margin, yPosition);
    yPosition += 10;

    // Add Cash Flow Chart
    pdf.addImage(cashFlowImgData, 'PNG', margin, yPosition, contentWidth, cashFlowHeight);
    yPosition += cashFlowHeight + 20;

    // Check if we need a new page
    if (yPosition > pageHeight - 100) {
      pdf.addPage();
      yPosition = margin;
    }

    // Capture Net Balance Chart
    const netBalanceCanvas = await html2canvas(netBalanceChartRef, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      allowTaint: true
    });

    const netBalanceImgData = netBalanceCanvas.toDataURL('image/png');
    const netBalanceAspectRatio = netBalanceCanvas.height / netBalanceCanvas.width;
    const netBalanceHeight = contentWidth * netBalanceAspectRatio;

    // Add Net Balance Chart title
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Net Balance Progress', margin, yPosition);
    yPosition += 10;

    // Add Net Balance Chart
    pdf.addImage(netBalanceImgData, 'PNG', margin, yPosition, contentWidth, netBalanceHeight);

    // Save the PDF
    const fileName = `${reportTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);

    return true;
  } catch (error) {
    console.error('Error exporting charts to PDF:', error);
    throw new Error('Failed to export charts to PDF');
  }
};
