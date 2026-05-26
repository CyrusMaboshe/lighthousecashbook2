
import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Trash2, TrendingUp, TrendingDown, Edit, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';
import { Transaction } from '@/hooks/useTransactions';
import { useUserPreferences } from '@/hooks/useUserPreferences';

interface TransactionTableProps {
  transactions: Transaction[];
  onDeleteTransaction: (id: string) => void;
  onUpdateTransaction?: (id: string, updatedTransaction: Partial<Transaction>) => void;
  isAdmin?: boolean;
}

export function TransactionTable({
  transactions,
  onDeleteTransaction,
  onUpdateTransaction,
  isAdmin = false
}: TransactionTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Transaction>>({});
  const { preferences } = useUserPreferences();



  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount).replace('$', 'ZMW ');
  };

  const handleEdit = (transaction: Transaction) => {
    console.log('Starting edit for transaction:', transaction.id);
    setEditingId(transaction.id);
    setEditData({
      ...transaction
    });
  };

  const handleSave = async () => {
    if (editingId && onUpdateTransaction) {
      if (!editData.amount || editData.amount <= 0) {
        alert('Amount must be greater than 0.');
        return;
      }
      if (!editData.customer_name?.trim()) {
        alert('Customer name is required.');
        return;
      }
      
      console.log('Saving transaction update:', editingId, editData);
      
      try {
        await onUpdateTransaction(editingId, editData);
        setEditingId(null);
        setEditData({});
        console.log('Transaction update completed successfully');
      } catch (error) {
        console.error('Failed to update transaction:', error);
      }
    }
  };

  const handleCancel = () => {
    console.log('Cancelling edit for transaction:', editingId);
    setEditingId(null);
    setEditData({});
  };

  const handleDelete = async (id: string) => {
    console.log('Deleting transaction:', id);
    try {
      await onDeleteTransaction(id);
      console.log('Transaction deletion completed successfully');
    } catch (error) {
      console.error('Failed to delete transaction:', error);
    }
  };

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <TrendingUp className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-medium text-slate-600 mb-2">No transactions found</h3>
        <p className="text-slate-500">
          Add your first transaction to get started.
        </p>
      </div>
    );
  }

  const categories = [
    'Soft Copy',
    'Processed Pictures',
    'Loss Experienced',
    'Studio Expense',
    'Personal Expense',
    'Airtime',
    'Airtime and Food',
    'Rent Reserved',
    'Rent Paid',
    'Studio Member Benefits',
    'Electricity Units',
    'Transport',
    'Studio Equipment Bought'
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="text-left py-3 px-4 font-medium text-slate-700">Date</th>
            <th className="text-left py-3 px-4 font-medium text-slate-700">Type</th>
            <th className="text-left py-3 px-4 font-medium text-slate-700">Category</th>
            <th className="text-right py-3 px-4 font-medium text-slate-700">Amount</th>
            <th className="text-left py-3 px-4 font-medium text-slate-700">
              {transactions.some(t => t.type === 'cash-out') ? 'Customer/Withdraw By' : 'Customer'}
            </th>
            <th className="text-left py-3 px-4 font-medium text-slate-700">Pictures</th>
            <th className="text-left py-3 px-4 font-medium text-slate-700">WhatsApp</th>
            <th className="text-left py-3 px-4 font-medium text-slate-700">Details</th>
            <th className="text-left py-3 px-4 font-medium text-slate-700">Entry By</th>
            {isAdmin && (
              <th className="text-center py-3 px-4 font-medium text-slate-700">Actions</th>
            )}
          </tr>
        </thead>
        <tbody>
          {transactions
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .map(transaction => (
            <tr 
              key={transaction.id} 
              className={`border-b border-slate-100 transition-colors ${
                transaction.type === 'cash-in' 
                  ? 'bg-green-50 hover:bg-green-100' 
                  : 'bg-red-50 hover:bg-red-100'
              }`}
            >
              <td className="py-3 px-4 text-slate-700">
                {editingId === transaction.id ? (
                  <Input
                    type="date"
                    value={editData.date || ''}
                    onChange={(e) => setEditData({...editData, date: e.target.value})}
                    className="w-full"
                  />
                ) : (
                  format(parseISO(transaction.date), 'MMM dd, yyyy')
                )}
              </td>
              <td className="py-3 px-4">
                {editingId === transaction.id ? (
                  <Select 
                    value={editData.type || transaction.type} 
                    onValueChange={(value: 'cash-in' | 'cash-out') => setEditData({...editData, type: value})}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash-in">Cash In</SelectItem>
                      <SelectItem value="cash-out">Cash Out</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge 
                    variant={transaction.type === 'cash-in' ? 'default' : 'destructive'}
                    className={`${
                      transaction.type === 'cash-in' 
                        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' 
                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                    } flex items-center gap-1 w-fit`}
                  >
                    {transaction.type === 'cash-in' ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {transaction.type === 'cash-in' ? 'Cash In' : 'Cash Out'}
                  </Badge>
                )}
              </td>
              <td className="py-3 px-4 text-slate-700 font-medium">
                {editingId === transaction.id ? (
                  <Select 
                    value={editData.category_name || transaction.category_name} 
                    onValueChange={(value) => setEditData({...editData, category_name: value})}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  transaction.category_name
                )}
              </td>
              <td className={`py-3 px-4 text-right font-semibold ${
                transaction.type === 'cash-in' ? 'text-emerald-600' : 'text-red-600'
              }`}>
                {editingId === transaction.id ? (
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={editData.amount || ''}
                    onChange={(e) => setEditData({...editData, amount: parseFloat(e.target.value)})}
                    className="w-full text-right"
                    required
                  />
                ) : (
                  preferences.showBalances ? formatCurrency(transaction.amount) : '****'
                )}
              </td>
              <td className="py-3 px-4 text-slate-600">
                {editingId === transaction.id ? (
                  <Input
                    value={editData.customer_name || ''}
                    onChange={(e) => setEditData({...editData, customer_name: e.target.value})}
                    className="w-full"
                    placeholder={transaction.type === 'cash-out' ? 'Withdraw by' : 'Customer name'}
                    required
                  />
                ) : (
                  preferences.showBalances ? (transaction.customer_name || '-') : '****'
                )}
              </td>
              <td className="py-3 px-4 text-slate-600">
                {editingId === transaction.id ? (
                  <Input
                    type="number"
                    min="0"
                    value={editData.number_of_pictures || ''}
                    onChange={(e) => setEditData({...editData, number_of_pictures: parseInt(e.target.value)})}
                    className="w-full"
                    placeholder="Pictures"
                  />
                ) : (
                  preferences.showBalances ? (transaction.number_of_pictures || '-') : '****'
                )}
              </td>
              <td className="py-3 px-4 text-slate-600">
                {editingId === transaction.id ? (
                  <Input
                    type="tel"
                    value={editData.whatsapp_number || ''}
                    onChange={(e) => setEditData({...editData, whatsapp_number: e.target.value})}
                    className="w-full"
                    placeholder="WhatsApp number"
                  />
                ) : (
                  transaction.whatsapp_number || '-'
                )}
              </td>
              <td className="py-3 px-4 text-slate-600 max-w-xs">
                {editingId === transaction.id ? (
                  <Input
                    value={editData.details || ''}
                    onChange={(e) => setEditData({...editData, details: e.target.value})}
                    className="w-full"
                  />
                ) : (
                  transaction.details || '-'
                )}
              </td>
              <td className="py-3 px-4 text-xs text-slate-600">
                {transaction.added_by}
              </td>
              {isAdmin && (
                <td className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    {editingId === transaction.id ? (
                      <>
                        <ConfirmationDialog
                          title="Save Changes"
                          description="Are you sure you want to save these changes to the transaction?"
                          onConfirm={handleSave}
                          confirmText="Save"
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50"
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                        </ConfirmationDialog>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCancel}
                          className="h-8 w-8 p-0 text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(transaction)}
                          className="h-8 w-8 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <ConfirmationDialog
                          title="Delete Transaction"
                          description="Are you sure you want to delete this transaction? This action cannot be undone."
                          onConfirm={() => handleDelete(transaction.id)}
                          confirmText="Delete"
                          variant="destructive"
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </ConfirmationDialog>
                      </>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
