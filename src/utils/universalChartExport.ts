import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Universal Chart Export Settings - Based on Progress Visualization Export
 * 
 * These are the EXACT settings used in Progress Visualization that export
 * the visualization tables exactly as they appear and replicate them in PDF
 */

export interface ExportSettings {
  // PDF Configuration
  pdf: {
    orientation: 'p' | 'l'; // 'p' for portrait, 'l' for landscape
    unit: 'mm' | 'pt' | 'in' | 'cm';
    format: 'a4' | 'a3' | 'letter';
    margin: number;
  };
  
  // HTML2Canvas Configuration (captures visual elements exactly)
  canvas: {
    backgroundColor: string;
    scale: number; // Higher scale = better quality (2 is optimal)
    useCORS: boolean; // Allow cross-origin images
    allowTaint: boolean; // Allow tainted canvas
    width?: number;
    height?: number;
    scrollX: number;
    scrollY: number;
  };
  
  // Typography Settings
  typography: {
    titleFontSize: number;
    titleFont: string;
    titleStyle: 'normal' | 'bold';
    subtitleFontSize: number;
    subtitleFont: string;
    subtitleStyle: 'normal' | 'bold';
    bodyFontSize: number;
    bodyFont: string;
    bodyStyle: 'normal' | 'bold';
  };
  
  // Layout Settings
  layout: {
    titleAlignment: 'left' | 'center' | 'right';
    spacing: {
      afterTitle: number;
      afterSubtitle: number;
      betweenElements: number;
      beforeNewPage: number;
    };
  };
}

// EXACT SETTINGS from Progress Visualization Export
export const PROGRESS_VISUALIZATION_SETTINGS: ExportSettings = {
  pdf: {
    orientation: 'p',
    unit: 'mm',
    format: 'a4',
    margin: 20
  },
  canvas: {
    backgroundColor: '#ffffff',
    scale: 2,
    useCORS: true,
    allowTaint: true,
    scrollX: 0,
    scrollY: 0
  },
  typography: {
    titleFontSize: 16,
    titleFont: 'helvetica',
    titleStyle: 'bold',
    subtitleFontSize: 10,
    subtitleFont: 'helvetica',
    subtitleStyle: 'normal',
    bodyFontSize: 12,
    bodyFont: 'helvetica',
    bodyStyle: 'bold'
  },
  layout: {
    titleAlignment: 'center',
    spacing: {
      afterTitle: 10,
      afterSubtitle: 15,
      betweenElements: 20,
      beforeNewPage: 100
    }
  }
};

/**
 * Universal Export Function - Uses the same settings as Progress Visualization
 * 
 * @param elements - Array of HTML elements to capture (charts, tables, etc.)
 * @param reportTitle - Title for the PDF report
 * @param settings - Export settings (defaults to Progress Visualization settings)
 * @param elementTitles - Optional titles for each element
 */
export const exportElementsToPDF = async (
  elements: (HTMLElement | null)[],
  reportTitle: string,
  settings: ExportSettings = PROGRESS_VISUALIZATION_SETTINGS,
  elementTitles: string[] = []
) => {
  // Filter out null elements
  const validElements = elements.filter((el): el is HTMLElement => el !== null);
  
  if (validElements.length === 0) {
    throw new Error('No valid elements found for export');
  }

  const pdf = new jsPDF(settings.pdf.orientation, settings.pdf.unit, settings.pdf.format);
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = settings.pdf.margin;
  const contentWidth = pageWidth - 2 * margin;

  // Add title using exact Progress Visualization settings
  pdf.setFontSize(settings.typography.titleFontSize);
  pdf.setFont(settings.typography.titleFont, settings.typography.titleStyle);
  pdf.text(reportTitle, pageWidth / 2, margin, { align: settings.layout.titleAlignment });

  // Add generation date using exact Progress Visualization settings
  pdf.setFontSize(settings.typography.subtitleFontSize);
  pdf.setFont(settings.typography.subtitleFont, settings.typography.subtitleStyle);
  const date = new Date().toLocaleDateString();
  pdf.text(`Generated on: ${date}`, pageWidth / 2, margin + settings.layout.spacing.afterTitle, { align: settings.layout.titleAlignment });

  let yPosition = margin + settings.layout.spacing.afterTitle + settings.layout.spacing.afterSubtitle;

  try {
    for (let i = 0; i < validElements.length; i++) {
      const element = validElements[i];
      const elementTitle = elementTitles[i];

      // Capture element using EXACT Progress Visualization settings
      const canvas = await html2canvas(element, {
        backgroundColor: settings.canvas.backgroundColor,
        scale: settings.canvas.scale,
        useCORS: settings.canvas.useCORS,
        allowTaint: settings.canvas.allowTaint,
        scrollX: settings.canvas.scrollX,
        scrollY: settings.canvas.scrollY,
        ...(settings.canvas.width && { width: settings.canvas.width }),
        ...(settings.canvas.height && { height: settings.canvas.height })
      });

      const imgData = canvas.toDataURL('image/png');
      const aspectRatio = canvas.height / canvas.width;
      const imgHeight = contentWidth * aspectRatio;

      // Add element title if provided
      if (elementTitle) {
        pdf.setFontSize(settings.typography.bodyFontSize);
        pdf.setFont(settings.typography.bodyFont, settings.typography.bodyStyle);
        pdf.text(elementTitle, margin, yPosition);
        yPosition += 10;
      }

      // Check if we need a new page (using exact Progress Visualization logic)
      if (yPosition + imgHeight > pageHeight - settings.layout.spacing.beforeNewPage) {
        pdf.addPage();
        yPosition = margin;
        
        // Re-add element title on new page if provided
        if (elementTitle) {
          pdf.setFontSize(settings.typography.bodyFontSize);
          pdf.setFont(settings.typography.bodyFont, settings.typography.bodyStyle);
          pdf.text(elementTitle, margin, yPosition);
          yPosition += 10;
        }
      }

      // Add image using exact Progress Visualization settings
      pdf.addImage(imgData, 'PNG', margin, yPosition, contentWidth, imgHeight);
      yPosition += imgHeight + settings.layout.spacing.betweenElements;
    }

    // Save the PDF using exact Progress Visualization naming convention
    const fileName = `${reportTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);

    return true;
  } catch (error) {
    console.error('Error exporting elements to PDF:', error);
    throw new Error('Failed to export elements to PDF');
  }
};

/**
 * Quick Export Function - For single elements
 */
export const exportSingleElementToPDF = async (
  element: HTMLElement | null,
  reportTitle: string,
  elementTitle?: string,
  settings: ExportSettings = PROGRESS_VISUALIZATION_SETTINGS
) => {
  return exportElementsToPDF(
    [element],
    reportTitle,
    settings,
    elementTitle ? [elementTitle] : []
  );
};
