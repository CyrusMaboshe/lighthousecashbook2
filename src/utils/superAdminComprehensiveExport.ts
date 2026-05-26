import jsPDF from 'jspdf';
import { supabase } from '@/integrations/supabase/client';

interface CompanyData {
  id: string;
  name: string;
  display_name: string;
  total_revenue: number;
  total_expenses: number;
  net_profit: number;
  transaction_count: number;
  user_count: number;
}

interface UserData {
  username: string;
  company: string;
  transaction_count: number;
  total_amount: number;
}

export const exportSuperAdminComprehensiveReport = async () => {
  try {
    // Fetch all companies
    const { data: companies, error: companiesError } = await supabase
      .from('mt_companies')
      .select('*');

    if (companiesError) throw companiesError;

    // Fetch all transactions
    const { data: transactions, error: transactionsError } = await supabase
      .from('mt_company_transactions')
      .select('*');

    if (transactionsError) throw transactionsError;

    // Fetch all users
    const { data: companyUsers, error: usersError } = await supabase
      .from('mt_company_users')
      .select('*');

    if (usersError) throw usersError;

    const { data: companyAdmins, error: adminsError } = await supabase
      .from('mt_company_admins')
      .select('*');

    if (adminsError) throw adminsError;

    // Process data
    const companyStats: CompanyData[] = (companies || []).map(company => {
      const companyTransactions = (transactions || []).filter(t => t.company_id === company.id);
      const companyUsersList = (companyUsers || []).filter(u => u.company_id === company.id);
      const companyAdminsList = (companyAdmins || []).filter(a => a.company_id === company.id);
      
      const totalRevenue = companyTransactions
        .filter(t => t.type === 'cash-in')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      const totalExpenses = companyTransactions
        .filter(t => t.type === 'cash-out')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const operationalExpenses = companyTransactions
        .filter(t => t.type === 'cash-out' && t.category_name !== 'Reserve Investment Withdrawal')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      return {
        id: company.id,
        name: company.name,
        display_name: company.display_name,
        total_revenue: totalRevenue,
        total_expenses: totalExpenses,
        net_profit: totalRevenue - operationalExpenses,
        transaction_count: companyTransactions.length,
        user_count: companyUsersList.length + companyAdminsList.length
      };
    });

    // Sort companies by net profit
    companyStats.sort((a, b) => b.net_profit - a.net_profit);

    // Calculate overall statistics
    const totalRevenue = companyStats.reduce((sum, c) => sum + c.total_revenue, 0);
    const totalExpenses = companyStats.reduce((sum, c) => sum + c.total_expenses, 0);
    const totalProfit = totalRevenue - totalExpenses;
    const totalTransactions = companyStats.reduce((sum, c) => sum + c.transaction_count, 0);
    const totalUsers = companyStats.reduce((sum, c) => sum + c.user_count, 0);

    // Create PDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = margin;

    // Helper function to check if we need a new page
    const checkNewPage = (requiredSpace: number = 20) => {
      if (yPosition + requiredSpace > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
        return true;
      }
      return false;
    };

    // Helper function to add a section header
    const addSectionHeader = (title: string) => {
      checkNewPage(30);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(37, 99, 235); // Blue color
      doc.text(title, margin, yPosition);
      yPosition += 10;
      doc.setDrawColor(37, 99, 235);
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 15;
      doc.setTextColor(0, 0, 0); // Reset to black
    };

    // Title Page
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(37, 99, 235);
    doc.text('Executive Business Report', pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 15;
    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Comprehensive System Analysis', pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 30;
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, yPosition, { align: 'center' });
    doc.text(`Total Companies: ${companies?.length || 0}`, pageWidth / 2, yPosition + 10, { align: 'center' });
    doc.text(`Report Period: All Time`, pageWidth / 2, yPosition + 20, { align: 'center' });

    // Executive Summary
    doc.addPage();
    yPosition = margin;
    addSectionHeader('Executive Summary');

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    const summaryData = [
      ['Total System Revenue', `ZMW ${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
      ['Total System Expenses', `ZMW ${totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
      ['Net System Profit', `ZMW ${totalProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
      ['Total Transactions', totalTransactions.toLocaleString()],
      ['Active Companies', (companies?.length || 0).toString()],
      ['Total Users', totalUsers.toString()],
      ['Average Revenue per Company', `ZMW ${(totalRevenue / (companies?.length || 1)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
      ['Profit Margin', `${((totalProfit / totalRevenue) * 100).toFixed(2)}%`]
    ];

    summaryData.forEach(([label, value]) => {
      checkNewPage();
      doc.setFont('helvetica', 'bold');
      doc.text(label + ':', margin, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(value, margin + 90, yPosition);
      yPosition += 10;
    });

    // Top Performing Companies
    yPosition += 10;
    addSectionHeader('Top Performing Companies (By Profit)');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Rank', margin, yPosition);
    doc.text('Company', margin + 20, yPosition);
    doc.text('Revenue', margin + 80, yPosition);
    doc.text('Profit', margin + 120, yPosition);
    doc.text('Transactions', margin + 155, yPosition);
    
    yPosition += 2;
    doc.setLineWidth(0.3);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 8;

    doc.setFont('helvetica', 'normal');
    companyStats.slice(0, 10).forEach((company, index) => {
      checkNewPage();
      doc.text(`${index + 1}`, margin, yPosition);
      
      // Truncate company name if too long
      const companyName = company.display_name.length > 20 
        ? company.display_name.substring(0, 17) + '...' 
        : company.display_name;
      doc.text(companyName, margin + 20, yPosition);
      
      doc.text(`${company.total_revenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}`, margin + 80, yPosition);
      doc.text(`${company.net_profit.toLocaleString('en-US', { maximumFractionDigits: 0 })}`, margin + 120, yPosition);
      doc.text(`${company.transaction_count}`, margin + 155, yPosition);
      yPosition += 8;
    });

    // Company Details
    yPosition += 10;
    addSectionHeader('Detailed Company Analysis');

    companyStats.forEach((company, index) => {
      checkNewPage(40);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`${index + 1}. ${company.display_name}`, margin, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      const companyDetails = [
        ['Total Revenue', `ZMW ${company.total_revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
        ['Total Expenses', `ZMW ${company.total_expenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
        ['Net Profit', `ZMW ${company.net_profit.toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
        ['Profit Margin', company.total_revenue > 0 ? `${((company.net_profit / company.total_revenue) * 100).toFixed(2)}%` : '0%'],
        ['Transactions', company.transaction_count.toString()],
        ['Users', company.user_count.toString()],
        ['Avg Transaction', company.transaction_count > 0 ? `ZMW ${(company.total_revenue / company.transaction_count).toLocaleString('en-US', { maximumFractionDigits: 2 })}` : 'N/A']
      ];

      companyDetails.forEach(([label, value]) => {
        doc.text(`  ${label}:`, margin + 5, yPosition);
        doc.text(value, margin + 70, yPosition);
        yPosition += 7;
      });

      yPosition += 5;
      
      // Add separator line
      if (index < companyStats.length - 1) {
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.1);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 10;
      }
    });

    // Strategic Insights
    doc.addPage();
    yPosition = margin;
    addSectionHeader('Strategic Insights & Recommendations');

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');

    const insights = [
      {
        title: 'Performance Overview',
        content: `The system is managing ${companies?.length || 0} active companies with a total of ${totalUsers} users. Overall profitability stands at ${((totalProfit / totalRevenue) * 100).toFixed(2)}%, indicating ${totalProfit > 0 ? 'positive' : 'challenging'} system-wide performance.`
      },
      {
        title: 'Top Performers',
        content: `The top 3 companies account for ${((companyStats.slice(0, 3).reduce((sum, c) => sum + c.total_revenue, 0) / totalRevenue) * 100).toFixed(1)}% of total revenue, suggesting ${companyStats.slice(0, 3).reduce((sum, c) => sum + c.total_revenue, 0) / totalRevenue > 0.5 ? 'concentration' : 'diversification'} in revenue sources.`
      },
      {
        title: 'Transaction Activity',
        content: `With ${totalTransactions.toLocaleString()} total transactions across all companies, the average company processes ${Math.round(totalTransactions / (companies?.length || 1))} transactions. ${companyStats.filter(c => c.transaction_count > totalTransactions / (companies?.length || 1)).length} companies exceed this average.`
      },
      {
        title: 'Recommendations',
        content: companyStats.filter(c => c.net_profit < 0).length > 0 
          ? `${companyStats.filter(c => c.net_profit < 0).length} companies show negative profitability. Focus on cost optimization and revenue enhancement strategies for these accounts.`
          : 'All companies are profitable. Continue current strategies while exploring growth opportunities.'
      }
    ];

    insights.forEach(insight => {
      checkNewPage(30);
      doc.setFont('helvetica', 'bold');
      doc.text(`• ${insight.title}`, margin, yPosition);
      yPosition += 8;
      
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(insight.content, pageWidth - 2 * margin - 10);
      lines.forEach((line: string) => {
        checkNewPage();
        doc.text(line, margin + 5, yPosition);
        yPosition += 6;
      });
      yPosition += 8;
    });

    // Footer on last page
    yPosition = pageHeight - margin;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 100);
    doc.text('© 2025 System Executive Report. Confidential.', pageWidth / 2, yPosition, { align: 'center' });

    // Save PDF
    const fileName = `Executive_Report_${new Date().toISOString().slice(0, 10)}_${new Date().getTime()}.pdf`;
    doc.save(fileName);

    return fileName;
  } catch (error) {
    console.error('Error generating comprehensive report:', error);
    throw error;
  }
};