
import { format, parseISO } from 'date-fns';
import { Transaction } from '@/hooks/useTransactions';
import { FilterOptions } from '@/pages/Index';
import { isRefundCategory } from '@/utils/refundUtils';

export const exportToPDF = (transactions: Transaction[], filters: FilterOptions) => {
  // Create a simple HTML content for PDF export
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Transaction Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .filters { margin-bottom: 20px; padding: 10px; background-color: #f5f5f5; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .cash-in { color: #059669; }
        .cash-out { color: #dc2626; }
        .summary { margin-top: 30px; display: flex; justify-content: space-around; }
        .summary-item { text-align: center; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Lighthouse Studio - Transaction Report</h1>
        <p>Generated on ${format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
      </div>
      
      <div class="filters">
        <strong>Filters Applied:</strong>
        Duration: ${filters.duration} | 
        Type: ${filters.type} | 
        ${filters.categories && filters.categories.length > 0 ? `Categories: ${filters.categories.join(', ')}` : 'All Categories'}
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Category</th>
            <th>Amount (ZMW)</th>
            <th>Customer</th>
            <th>Pictures</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          ${transactions.map(transaction => `
            <tr>
              <td>${format(parseISO(transaction.date), 'dd/MM/yyyy')}</td>
              <td class="${transaction.type === 'cash-in' ? 'cash-in' : 'cash-out'}">
                ${transaction.type === 'cash-in' ? 'Cash In' : 'Cash Out'}
              </td>
              <td>${transaction.category_name}</td>
              <td>${transaction.amount.toFixed(2)}</td>
              <td>${transaction.customer_name}</td>
              <td>${transaction.number_of_pictures || 0}</td>
              <td>${transaction.details || '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="summary">
        <div class="summary-item">
          <h3>Total Cash In</h3>
          <p class="cash-in">ZMW ${transactions
            .filter(t => t.type === 'cash-in')
            .reduce((sum, t) => {
              // Refund-category cash-ins reduce inflow
              return isRefundCategory(t.category_name) ? sum - t.amount : sum + t.amount;
            }, 0)
            .toFixed(2)}</p>
        </div>
        <div class="summary-item">
          <h3>Total Cash Out</h3>
          <p class="cash-out">ZMW ${transactions
            .filter(t => t.type === 'cash-out')
            .reduce((sum, t) => sum + Math.abs(t.amount), 0)
            .toFixed(2)}</p>
        </div>
        <div class="summary-item">
          <h3>Net Balance</h3>
          <p>ZMW ${(
            transactions.filter(t => t.type === 'cash-in').reduce((sum, t) => {
              return isRefundCategory(t.category_name) ? sum - t.amount : sum + t.amount;
            }, 0) -
            transactions.filter(t => t.type === 'cash-out' && t.category_name !== 'Reserve Investment Withdrawal').reduce((sum, t) => sum + Math.abs(t.amount), 0)
          ).toFixed(2)}</p>
        </div>
        <div class="summary-item">
          <h3>Total Transactions</h3>
          <p>${transactions.length}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Create a new window and print
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
  }
};
