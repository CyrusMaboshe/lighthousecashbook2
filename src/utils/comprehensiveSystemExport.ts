import jsPDF from 'jspdf';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SystemData {
  [key: string]: any[];
}

export const exportComprehensiveSystemReport = async () => {
  try {
    toast.info('Generating comprehensive system report...');

    // Query only business-relevant fields (no IDs, passwords, timestamps, or system metadata)
    const [
      { data: users },
      { data: mtCompanies },
      { data: mtCompanyAdmins },
      { data: mtCompanyUsers },
      { data: mtCompanyTransactions },
      { data: mtSuperAdmins },
      { data: transactions },
      { data: categories },
      { data: mtCompanyCategories },
      { data: cashvaultBalance },
      { data: cashvaultTransactions },
      { data: cashReserveBalance },
      { data: cashReserveTransactions },
      { data: invoices },
      { data: userLogs },
      { data: adminLogs },
      { data: systemSettings },
      { data: campaigns },
      { data: campaignUsers },
      { data: campaignTransactions },
      { data: campaignCategories },
      { data: userTargets },
      { data: mtCompanyTargets },
      { data: userTodos },
      { data: mtCompanyTodos },
      { data: messages },
      { data: galleryImages },
      { data: galleryCategories },
      { data: galleryBookings },
      { data: monthlyReports },
      { data: automaticReports },
      { data: userBalanceOverrides }
    ] = await Promise.all([
      supabase.from('users').select('username, email, role, is_admin'),
      supabase.from('mt_companies').select('name, display_name, description, is_active'),
      supabase.from('mt_company_admins').select('username, email, role, is_active'),
      supabase.from('mt_company_users').select('username, email, role, is_active'),
      supabase.from('mt_company_transactions').select('date, time, type, amount, category_name, customer_name, details, added_by, number_of_pictures'),
      supabase.from('mt_super_admins').select('email'),
      supabase.from('transactions').select('date, time, type, amount, category_name, customer_name, whatsapp_number, details, added_by, number_of_pictures'),
      supabase.from('categories').select('name'),
      supabase.from('mt_company_categories').select('name, type, created_by_username'),
      supabase.from('cashvault_balance').select('current_balance, updated_by'),
      supabase.from('cashvault_transactions').select('date, time, action_type, amount, note, initiating_user'),
      supabase.from('cash_reserve_balance').select('current_balance, updated_by'),
      supabase.from('cash_reserve_transactions').select('date, time, action_type, amount, note, initiating_user'),
      supabase.from('invoices').select('invoice_id, date, customer_name, customer_phone, customer_email, booking_type, subtotal, discount, total, created_by'),
      supabase.from('user_logs').select('username, action_type, action_description').order('created_at', { ascending: false }).limit(100),
      supabase.from('admin_logs').select('performed_by, action').order('timestamp', { ascending: false }).limit(100),
      supabase.from('system_settings').select('key, value, description'),
      supabase.from('campaigns').select('name, display_name, description, is_active, created_by_username'),
      supabase.from('campaign_users').select('username, email, role, is_admin, is_active, created_by_username'),
      supabase.from('campaign_transactions').select('date, time, type, amount, category_name, customer_name, details, added_by, number_of_pictures'),
      supabase.from('campaign_categories').select('name'),
      supabase.from('user_targets').select('title, description, category, target_amount, current_amount, status, target_date'),
      supabase.from('mt_company_targets').select('title, description, category, target_amount, current_amount, status, target_date, created_by_username'),
      supabase.from('user_todos').select('title, description, priority, status, due_date'),
      supabase.from('mt_company_todos').select('title, description, priority, status, due_date, assigned_to, created_by_username'),
      supabase.from('messages').select('sender, sender_role, title, message, priority, is_read').order('created_at', { ascending: false }).limit(50),
      supabase.from('gallery_images').select('title, description, price, is_featured, is_active'),
      supabase.from('gallery_categories').select('name, description, is_active, display_order'),
      supabase.from('gallery_bookings').select('booking_date, booking_time, event_type, event_location, customer_name, customer_email, customer_phone, total_amount, status'),
      supabase.from('monthly_reports').select('year, month, total_cash_in, total_cash_out, net_balance, transaction_count'),
      supabase.from('automatic_reports').select('year, month, total_cash_in, total_cash_out, net_balance, transaction_count'),
      supabase.from('user_balance_overrides').select('username, original_balance, effective_balance, override_reason, is_active')
    ]);

    const systemData: SystemData = {
      'Super Admins': mtSuperAdmins || [],
      'System Administrators': users?.filter(u => u.role === 'admin' || u.is_admin) || [],
      'System Users': users?.filter(u => u.role === 'user' && !u.is_admin) || [],
      'Multi-Tenant Companies': mtCompanies || [],
      'Company Administrators': mtCompanyAdmins || [],
      'Company Users': mtCompanyUsers || [],
      'Company Transactions': mtCompanyTransactions || [],
      'Company Categories': mtCompanyCategories || [],
      'Company Targets': mtCompanyTargets || [],
      'Company Todos': mtCompanyTodos || [],
      'Campaigns': campaigns || [],
      'Campaign Users': campaignUsers || [],
      'Campaign Transactions': campaignTransactions || [],
      'Campaign Categories': campaignCategories || [],
      'System Transactions': transactions || [],
      'Transaction Categories': categories || [],
      'Cashvault Balance': cashvaultBalance || [],
      'Cashvault Transactions': cashvaultTransactions || [],
      'Cash Reserve Balance': cashReserveBalance || [],
      'Cash Reserve Transactions': cashReserveTransactions || [],
      'Invoices': invoices || [],
      'User Targets': userTargets || [],
      'User Todos': userTodos || [],
      'User Balance Overrides': userBalanceOverrides || [],
      'User Activity Logs': userLogs || [],
      'Admin Activity Logs': adminLogs || [],
      'Messages': messages || [],
      'Gallery Categories': galleryCategories || [],
      'Gallery Images': galleryImages || [],
      'Gallery Bookings': galleryBookings || [],
      'Monthly Reports': monthlyReports || [],
      'Automatic Reports': automaticReports || [],
      'System Settings': systemSettings || []
    };

    // Generate PDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = margin;

    const checkNewPage = (requiredSpace: number = 20) => {
      if (yPosition + requiredSpace > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
        return true;
      }
      return false;
    };

    const addSectionHeader = (title: string) => {
      checkNewPage(30);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(37, 99, 235);
      doc.text(title, margin, yPosition);
      yPosition += 8;
      doc.setDrawColor(37, 99, 235);
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;
      doc.setTextColor(0, 0, 0);
    };

    // Title Page
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(37, 99, 235);
    doc.text('Comprehensive System Data Report', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Complete Database Export', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 20;
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;
    doc.text(`Total Sections: ${Object.keys(systemData).length}`, pageWidth / 2, yPosition, { align: 'center' });

    // Executive Summary
    doc.addPage();
    yPosition = margin;
    addSectionHeader('Executive Summary');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const summaryStats = [
      ['Total Super Admins', (mtSuperAdmins?.length || 0).toString()],
      ['Total System Administrators', (users?.filter(u => u.role === 'admin' || u.is_admin)?.length || 0).toString()],
      ['Total System Users', (users?.filter(u => u.role === 'user')?.length || 0).toString()],
      ['Total Companies', (mtCompanies?.length || 0).toString()],
      ['Total Company Admins', (mtCompanyAdmins?.length || 0).toString()],
      ['Total Company Users', (mtCompanyUsers?.length || 0).toString()],
      ['Total System Transactions', (transactions?.length || 0).toString()],
      ['Total Company Transactions', (mtCompanyTransactions?.length || 0).toString()],
      ['Total Campaign Transactions', (campaignTransactions?.length || 0).toString()],
      ['Total Invoices', (invoices?.length || 0).toString()],
      ['Total Categories', (categories?.length || 0).toString()],
      ['Total Campaigns', (campaigns?.length || 0).toString()],
      ['Total Messages', (messages?.length || 0).toString()],
      ['Gallery Images', (galleryImages?.length || 0).toString()],
      ['Gallery Bookings', (galleryBookings?.length || 0).toString()],
      ['User Logs (Recent 100)', (userLogs?.length || 0).toString()],
      ['Admin Logs (Recent 100)', (adminLogs?.length || 0).toString()]
    ];

    summaryStats.forEach(([label, value]) => {
      checkNewPage();
      doc.setFont('helvetica', 'bold');
      doc.text(label + ':', margin, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(value, margin + 100, yPosition);
      yPosition += 7;
    });

    // Financial Summary
    yPosition += 10;
    addSectionHeader('Financial Summary');

    const totalSystemCashIn = (transactions || [])
      .filter(t => t.type === 'cash-in')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const totalSystemCashOut = (transactions || [])
      .filter(t => t.type === 'cash-out')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const operationalSystemCashOut = (transactions || [])
      .filter(t => t.type === 'cash-out' && t.category_name !== 'Reserve Investment Withdrawal')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalCompanyCashIn = (mtCompanyTransactions || [])
      .filter(t => t.type === 'cash-in')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const totalCompanyCashOut = (mtCompanyTransactions || [])
      .filter(t => t.type === 'cash-out')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const operationalCompanyCashOut = (mtCompanyTransactions || [])
      .filter(t => t.type === 'cash-out' && t.category_name !== 'Reserve Investment Withdrawal')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const cashvaultTotal = (cashvaultBalance || [])
      .reduce((sum, b) => sum + Number(b.current_balance), 0);

    const cashReserveTotal = (cashReserveBalance || [])
      .reduce((sum, b) => sum + Number(b.current_balance), 0);

    const financialStats = [
      ['System Total Cash In', `ZMW ${totalSystemCashIn.toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
      ['System Total Cash Out', `ZMW ${totalSystemCashOut.toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
      ['System Net Balance', `ZMW ${(totalSystemCashIn - operationalSystemCashOut).toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
      ['Company Total Cash In', `ZMW ${totalCompanyCashIn.toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
      ['Company Total Cash Out', `ZMW ${totalCompanyCashOut.toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
      ['Company Net Balance', `ZMW ${(totalCompanyCashIn - operationalCompanyCashOut).toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
      ['Cashvault Balance', `ZMW ${cashvaultTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
      ['Cash Reserve Balance', `ZMW ${cashReserveTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
      ['Total Invoice Value', `ZMW ${(invoices || []).reduce((sum, inv) => sum + Number(inv.total), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`]
    ];

    financialStats.forEach(([label, value]) => {
      checkNewPage();
      doc.setFont('helvetica', 'bold');
      doc.text(label + ':', margin, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(value, margin + 100, yPosition);
      yPosition += 7;
    });

    // Detailed Sections
    Object.entries(systemData).forEach(([sectionName, data]) => {
      doc.addPage();
      yPosition = margin;
      addSectionHeader(`${sectionName} (${data.length} records)`);

      if (data.length === 0) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100, 100, 100);
        doc.text('No records found', margin, yPosition);
        yPosition += 10;
        return;
      }

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);

      // Display first 50 records per section
      data.slice(0, 50).forEach((record, index) => {
        checkNewPage(15);
        
        doc.setFont('helvetica', 'bold');
        doc.text(`Record ${index + 1}:`, margin, yPosition);
        yPosition += 6;

        // Display business-relevant fields only (exclude internal fields)
        const keys = Object.keys(record).filter(key => {
          // Exclude all internal/system fields
          const excludedFields = ['id', 'auth_user_id', 'user_id', 'company_id', 'campaign_id', 
                                  'password_hash', 'created_at', 'updated_at', 'timestamp',
                                  'created_by_user_id', 'added_by_user_id', 'sender_user_id',
                                  'initiating_user_id', 'performed_by_user_id', 'last_updated',
                                  'last_login', 'generated_at', 'joined_at', 'completed_at',
                                  'access_revoked_at', 'access_restored_at', 'access_expires_at',
                                  'category_id', 'image_id', 'conversation_id', 'created_by',
                                  'updated_by_user_id', 'withdrawn_by_user_id'];
          return !excludedFields.includes(key);
        }).slice(0, 8); // First 8 relevant fields
        
        keys.forEach(key => {
          checkNewPage();
          const value = record[key];
          let displayValue = '';
          
          if (value === null || value === undefined) {
            displayValue = 'N/A';
          } else if (typeof value === 'object') {
            displayValue = JSON.stringify(value).substring(0, 50) + '...';
          } else {
            displayValue = String(value).substring(0, 50);
          }

          doc.setFont('helvetica', 'normal');
          doc.text(`  ${key}: ${displayValue}`, margin + 5, yPosition);
          yPosition += 5;
        });

        yPosition += 3;
        if (index < data.length - 1 && index < 49) {
          doc.setDrawColor(200, 200, 200);
          doc.setLineWidth(0.1);
          doc.line(margin, yPosition, pageWidth - margin, yPosition);
          yPosition += 5;
        }
      });

      if (data.length > 50) {
        yPosition += 5;
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100, 100, 100);
        doc.text(`... and ${data.length - 50} more records`, margin, yPosition);
      }
    });

    // Footer on last page
    yPosition = pageHeight - margin;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 100);
    doc.text(`© ${new Date().getFullYear()} Comprehensive System Report. Confidential.`, pageWidth / 2, yPosition, { align: 'center' });

    // Save PDF
    const fileName = `System_Comprehensive_Report_${new Date().toISOString().slice(0, 10)}_${Date.now()}.pdf`;
    doc.save(fileName);

    toast.success('Comprehensive system report generated successfully!');
    return fileName;
  } catch (error) {
    console.error('Error generating comprehensive system report:', error);
    toast.error('Failed to generate comprehensive system report');
    throw error;
  }
};
