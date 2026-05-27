import jsPDF from 'jspdf';
import { supabase } from '@/integrations/supabase/client';

interface CustomerData {
  name: string;
  phone: string;
  visitCount: number;
  lastVisit: string;
}

/**
 * Export customers list to PDF (name + phone number)
 */
export const exportCustomersListToPDF = async (companyId?: string): Promise<void> => {
  try {
    // Fetch all transactions to extract customer data
    const tableName = companyId ? 'mt_company_transactions' : 'transactions';
    let query = supabase
      .from(tableName)
      .select('customer_name, whatsapp_number, date')
      .eq('type', 'cash-in')
      .not('customer_name', 'is', null)
      .not('whatsapp_number', 'is', null);

    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    const { data: transactions, error } = await query.order('date', { ascending: false });

    if (error) throw error;

    // Process customers data to get unique customers with visit counts
    const customersMap = new Map<string, CustomerData>();
    
    transactions?.forEach(transaction => {
      if (transaction.customer_name && transaction.whatsapp_number) {
        const key = `${transaction.customer_name}-${transaction.whatsapp_number}`;
        
        if (customersMap.has(key)) {
          const existing = customersMap.get(key)!;
          existing.visitCount += 1;
          if (new Date(transaction.date) > new Date(existing.lastVisit)) {
            existing.lastVisit = transaction.date;
          }
        } else {
          customersMap.set(key, {
            name: transaction.customer_name,
            phone: transaction.whatsapp_number,
            visitCount: 1,
            lastVisit: transaction.date
          });
        }
      }
    });

    const customers = Array.from(customersMap.values())
      .sort((a, b) => a.name.localeCompare(b.name));

    // Create PDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = 30;

    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Lighthouse Media - Customers List', margin, yPosition);
    
    yPosition += 15;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${new Date().toLocaleString()}`, margin, yPosition);
    doc.text(`Total Customers: ${customers.length}`, margin, yPosition + 10);
    
    yPosition += 30;

    // Table headers
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Customer Name', margin, yPosition);
    doc.text('Phone Number', margin + 80, yPosition);
    doc.text('Visits', margin + 160, yPosition);
    
    yPosition += 5;
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    // Table content
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    customers.forEach((customer) => {
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = 30;
        
        // Repeat headers on new page
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('Customer Name', margin, yPosition);
        doc.text('Phone Number', margin + 80, yPosition);
        doc.text('Visits', margin + 160, yPosition);
        yPosition += 5;
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 10;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
      }

      doc.text(customer.name, margin, yPosition);
      doc.text(customer.phone, margin + 80, yPosition);
      doc.text(customer.visitCount.toString(), margin + 160, yPosition);
      yPosition += 12;
    });

    // Save the PDF
    const fileName = `Lighthouse_Media_Customers_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);

  } catch (error) {
    console.error('Error exporting customers list to PDF:', error);
    throw new Error('Failed to export customers list to PDF');
  }
};

/**
 * Export transaction history to PDF
 */
export const exportTransactionHistoryToPDF = async (companyId?: string): Promise<void> => {
  try {
    const tableName = companyId ? 'mt_company_transactions' : 'transactions';
    // Fetch ALL transactions with pagination to bypass the 1000-row limit
    const pageSize = 1000; let from = 0; let transactions: any[] = [];
    for (let page = 0; page < 200; page++) {
      let query = supabase
        .from(tableName)
        .select('*')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
        .range(from, from + pageSize - 1);

      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data, error } = await query;
      if (error) throw error;
      const batch = data || []; transactions = transactions.concat(batch);
      if (batch.length < pageSize) break;
      from += pageSize;
    }

    // Create PDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = 30;

    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Lighthouse Media - Transaction History', margin, yPosition);
    
    yPosition += 15;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${new Date().toLocaleString()}`, margin, yPosition);
    doc.text(`Total Transactions: ${transactions?.length || 0}`, margin, yPosition + 10);
    
    yPosition += 30;

    // Calculate totals
    const totalCashIn = transactions?.filter(t => t.type === 'cash-in').reduce((sum, t) => sum + Number(t.amount), 0) || 0;
    const totalCashOut = transactions?.filter(t => t.type === 'cash-out').reduce((sum, t) => sum + Number(t.amount), 0) || 0;
    const operationalCashOut = transactions?.filter(t => t.type === 'cash-out' && t.category_name !== 'Reserve Investment Withdrawal').reduce((sum, t) => sum + Number(t.amount), 0) || 0;
    const netBalance = totalCashIn - operationalCashOut;

    // Summary section
    doc.setFont('helvetica', 'bold');
    doc.text('Summary:', margin, yPosition);
    yPosition += 15;
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Cash In: ZMW ${totalCashIn.toFixed(2)}`, margin, yPosition);
    doc.text(`Total Cash Out: ZMW ${totalCashOut.toFixed(2)}`, margin, yPosition + 10);
    doc.text(`Net Balance: ZMW ${netBalance.toFixed(2)}`, margin, yPosition + 20);
    
    yPosition += 40;

    // Table headers
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Date', margin, yPosition);
    doc.text('Type', margin + 25, yPosition);
    doc.text('Amount', margin + 45, yPosition);
    doc.text('Customer', margin + 75, yPosition);
    doc.text('Category', margin + 120, yPosition);
    doc.text('Added By', margin + 150, yPosition);
    
    yPosition += 5;
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    // Table content
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    transactions?.forEach((transaction) => {
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = 30;
        
        // Repeat headers on new page
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('Date', margin, yPosition);
        doc.text('Type', margin + 25, yPosition);
        doc.text('Amount', margin + 45, yPosition);
        doc.text('Customer', margin + 75, yPosition);
        doc.text('Category', margin + 120, yPosition);
        doc.text('Added By', margin + 150, yPosition);
        yPosition += 5;
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 10;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
      }

      const date = new Date(transaction.date).toLocaleDateString();
      const type = transaction.type === 'cash-in' ? 'IN' : 'OUT';
      const amount = `${Number(transaction.amount).toFixed(2)}`;
      const customer = transaction.customer_name || 'N/A';
      const category = transaction.category_name || (transaction.categories as any)?.name || 'N/A';
      const addedBy = transaction.added_by || (transaction.users as any)?.username || 'N/A';

      doc.text(date, margin, yPosition);
      doc.text(type, margin + 25, yPosition);
      doc.text(amount, margin + 45, yPosition);
      doc.text(customer.substring(0, 20), margin + 75, yPosition);
      doc.text(category.substring(0, 15), margin + 120, yPosition);
      doc.text(addedBy.substring(0, 15), margin + 150, yPosition);
      yPosition += 10;
    });

    // Save the PDF
    const fileName = `Lighthouse_Media_Transactions_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);

  } catch (error) {
    console.error('Error exporting transaction history to PDF:', error);
    throw new Error('Failed to export transaction history to PDF');
  }
};

/**
 * Export user logs to PDF
 */
export const exportUserLogsToPDF = async (): Promise<void> => {
  try {
    // Fetch all user logs
    const { data: userLogs, error } = await supabase
      .from('user_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(1000);

    if (error) throw error;

    // Create PDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = 30;

    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Lighthouse Media - User Logs', margin, yPosition);

    yPosition += 15;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${new Date().toLocaleString()}`, margin, yPosition);
    doc.text(`Total Log Entries: ${userLogs?.length || 0}`, margin, yPosition + 10);

    yPosition += 30;

    // Table headers
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Date/Time', margin, yPosition);
    doc.text('Username', margin + 40, yPosition);
    doc.text('Action Type', margin + 80, yPosition);
    doc.text('Description', margin + 120, yPosition);

    yPosition += 5;
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    // Table content
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    userLogs?.forEach((log) => {
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = 30;

        // Repeat headers on new page
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('Date/Time', margin, yPosition);
        doc.text('Username', margin + 40, yPosition);
        doc.text('Action Type', margin + 80, yPosition);
        doc.text('Description', margin + 120, yPosition);
        yPosition += 5;
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 10;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
      }

      const timestamp = new Date(log.timestamp).toLocaleString();
      const username = log.username || 'N/A';
      const actionType = log.action_type || 'N/A';
      const description = log.action_description || 'N/A';

      doc.text(timestamp.substring(0, 16), margin, yPosition);
      doc.text(username.substring(0, 15), margin + 40, yPosition);
      doc.text(actionType.substring(0, 15), margin + 80, yPosition);
      doc.text(description.substring(0, 35), margin + 120, yPosition);
      yPosition += 10;
    });

    // Save the PDF
    const fileName = `Lighthouse_Media_User_Logs_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);

  } catch (error) {
    console.error('Error exporting user logs to PDF:', error);
    throw new Error('Failed to export user logs to PDF');
  }
};

/**
 * Export admin logs to PDF
 */
export const exportAdminLogsToPDF = async (): Promise<void> => {
  try {
    // Fetch all admin logs
    const { data: adminLogs, error } = await supabase
      .from('admin_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(1000);

    if (error) throw error;

    // Create PDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = 30;

    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Lighthouse Media - Admin Logs', margin, yPosition);

    yPosition += 15;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${new Date().toLocaleString()}`, margin, yPosition);
    doc.text(`Total Log Entries: ${adminLogs?.length || 0}`, margin, yPosition + 10);

    yPosition += 30;

    // Table headers
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Date/Time', margin, yPosition);
    doc.text('Performed By', margin + 50, yPosition);
    doc.text('Action', margin + 100, yPosition);

    yPosition += 5;
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    // Table content
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    adminLogs?.forEach((log) => {
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = 30;

        // Repeat headers on new page
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('Date/Time', margin, yPosition);
        doc.text('Performed By', margin + 50, yPosition);
        doc.text('Action', margin + 100, yPosition);
        yPosition += 5;
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 10;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
      }

      const timestamp = new Date(log.timestamp).toLocaleString();
      const performedBy = log.performed_by || 'N/A';
      const action = log.action || 'N/A';

      doc.text(timestamp.substring(0, 16), margin, yPosition);
      doc.text(performedBy.substring(0, 20), margin + 50, yPosition);
      doc.text(action.substring(0, 40), margin + 100, yPosition);
      yPosition += 10;
    });

    // Save the PDF
    const fileName = `Lighthouse_Media_Admin_Logs_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);

  } catch (error) {
    console.error('Error exporting admin logs to PDF:', error);
    throw new Error('Failed to export admin logs to PDF');
  }
};
