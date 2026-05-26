// Campaign Exports - Export functionality for campaigns

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface CampaignExportsProps {
  campaignId: string;
}

export function CampaignExports({ campaignId }: CampaignExportsProps) {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const exportTransactionsToPDF = async (type: 'cash-in' | 'cash-out') => {
    setIsExporting(true);
    try {
      // Fetch all transactions of the specified type for this campaign
      const { data: transactions, error } = await supabase
        .from('campaign_transactions')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('type', type)
        .order('date', { ascending: true })
        .order('time', { ascending: true });

      if (error) throw error;

      if (!transactions || transactions.length === 0) {
        toast({
          title: 'No Data',
          description: `No ${type === 'cash-in' ? 'cash-in' : 'cash-out'} transactions found.`,
          variant: 'destructive',
        });
        return;
      }

      // Group transactions by category
      const categoryGroups = transactions.reduce((acc, transaction) => {
        const category = transaction.category_name;
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(transaction);
        return acc;
      }, {} as Record<string, typeof transactions>);

      // Calculate totals
      const totalAmount = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
      const totalPictures = transactions.reduce((sum, t) => sum + (t.number_of_pictures || 0), 0);

      // Generate HTML content
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${type === 'cash-in' ? 'Cash In' : 'Cash Out'} Transactions - All Time</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid ${type === 'cash-in' ? '#059669' : '#dc2626'}; padding-bottom: 20px; }
            .header h1 { color: ${type === 'cash-in' ? '#059669' : '#dc2626'}; margin: 0; }
            .category-section { margin-top: 30px; page-break-inside: avoid; }
            .category-header { background-color: #f5f5f5; padding: 10px; margin-bottom: 10px; font-weight: bold; font-size: 18px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
            th { background-color: ${type === 'cash-in' ? '#059669' : '#dc2626'}; color: white; }
            .summary { margin-top: 30px; padding: 20px; background-color: #f9f9f9; border: 2px solid ${type === 'cash-in' ? '#059669' : '#dc2626'}; }
            .summary h2 { color: ${type === 'cash-in' ? '#059669' : '#dc2626'}; margin-top: 0; }
            .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
            .summary-item { text-align: center; }
            .summary-item h3 { margin: 0; font-size: 14px; color: #666; }
            .summary-item p { margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: ${type === 'cash-in' ? '#059669' : '#dc2626'}; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${type === 'cash-in' ? 'Cash In' : 'Cash Out'} Transactions - All Time Report</h1>
            <p>Generated on ${format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
            <p>Campaign: ${campaignId}</p>
          </div>
          
          ${Object.entries(categoryGroups).map(([category, categoryTransactions]) => `
            <div class="category-section">
              <div class="category-header">${category} (${(categoryTransactions as any[]).length} transactions)</div>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Customer</th>
                    <th>Amount (ZMW)</th>
                    <th>Pictures</th>
                    <th>Details</th>
                    <th>Added By</th>
                  </tr>
                </thead>
                <tbody>
                  ${(categoryTransactions as any[]).map((transaction: any) => `
                    <tr>
                      <td>${format(new Date(transaction.date), 'dd/MM/yyyy')}</td>
                      <td>${transaction.time || '-'}</td>
                      <td>${transaction.customer_name || '-'}</td>
                      <td>${Number(transaction.amount).toFixed(2)}</td>
                      <td>${transaction.number_of_pictures || 0}</td>
                      <td>${transaction.details || '-'}</td>
                      <td>${transaction.added_by}</td>
                    </tr>
                  `).join('')}
                  <tr style="background-color: #f5f5f5; font-weight: bold;">
                    <td colspan="3">Category Subtotal</td>
                    <td>${(categoryTransactions as any[]).reduce((sum: number, t: any) => sum + Number(t.amount), 0).toFixed(2)}</td>
                    <td>${(categoryTransactions as any[]).reduce((sum: number, t: any) => sum + (t.number_of_pictures || 0), 0)}</td>
                    <td colspan="2"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          `).join('')}
          
          <div class="summary">
            <h2>Overall Summary</h2>
            <div class="summary-grid">
              <div class="summary-item">
                <h3>Total Transactions</h3>
                <p>${transactions.length}</p>
              </div>
              <div class="summary-item">
                <h3>Total Amount</h3>
                <p>ZMW ${totalAmount.toFixed(2)}</p>
              </div>
              <div class="summary-item">
                <h3>Total Pictures</h3>
                <p>${totalPictures}</p>
              </div>
            </div>
            <div style="margin-top: 20px; text-align: center;">
              <p style="font-size: 12px; color: #666;">Categories: ${Object.keys(categoryGroups).length}</p>
            </div>
          </div>
        </body>
        </html>
      `;

      // Open print window
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.print();
      }

      toast({
        title: 'Export Successful',
        description: `Exported ${transactions.length} ${type === 'cash-in' ? 'cash-in' : 'cash-out'} transactions.`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export transactions. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Export Center</h1>
        <p className="text-muted-foreground">Export your campaign data in various formats</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            All-Time Transaction Exports
          </CardTitle>
          <CardDescription>Export complete transaction history by type, categorized and detailed</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={() => exportTransactionsToPDF('cash-in')}
              disabled={isExporting}
              className="w-full"
              variant="default"
            >
              <FileDown className="mr-2 h-4 w-4" />
              Export All Cash-In Transactions
            </Button>
            
            <Button
              onClick={() => exportTransactionsToPDF('cash-out')}
              disabled={isExporting}
              className="w-full"
              variant="outline"
            >
              <FileDown className="mr-2 h-4 w-4" />
              Export All Cash-Out Transactions
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground mt-4">
            These exports include all transactions from all time periods, organized by category with full details.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
