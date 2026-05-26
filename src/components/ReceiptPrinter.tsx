
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Printer, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Transaction } from '@/hooks/useTransactions';

interface ReceiptPrinterProps {
  transaction: Transaction;
  onClose: () => void;
}

export function ReceiptPrinter({ transaction, onClose }: ReceiptPrinterProps) {
  const handlePrint = () => {
    const printContent = document.getElementById('receipt-content');
    if (printContent) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Transaction Receipt</title>
              <style>
                body { font-family: monospace; margin: 20px; }
                .receipt { max-width: 300px; margin: 0 auto; }
                .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 10px; }
                .row { display: flex; justify-content: space-between; margin: 5px 0; }
                .total { border-top: 2px solid #000; padding-top: 10px; font-weight: bold; }
              </style>
            </head>
            <body>
              ${printContent.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-md bg-white shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold">Print Receipt</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent>
          <div id="receipt-content" className="receipt font-mono text-sm">
            <div className="header">
              <h2 className="text-lg font-bold">LIGHTHOUSE STUDIO</h2>
              <p>Transaction Receipt</p>
            </div>
            
            <div className="row">
              <span>Date:</span>
              <span>{format(parseISO(transaction.date), 'dd/MM/yyyy')}</span>
            </div>
            
            {transaction.time && (
              <div className="row">
                <span>Time:</span>
                <span>{transaction.time}</span>
              </div>
            )}
            
            <div className="row">
              <span>Type:</span>
              <span className={transaction.type === 'cash-in' ? 'text-green-600' : 'text-red-600'}>
                {transaction.type === 'cash-in' ? 'CASH IN' : 'CASH OUT'}
              </span>
            </div>
            
            <div className="row">
              <span>Category:</span>
              <span>{transaction.category_name}</span>
            </div>
            
            <div className="row">
              <span>Customer:</span>
              <span>{transaction.customer_name}</span>
            </div>
            
            {transaction.number_of_pictures > 0 && (
              <div className="row">
                <span>Pictures:</span>
                <span>{transaction.number_of_pictures}</span>
              </div>
            )}
            
            {transaction.whatsapp_number && (
              <div className="row">
                <span>WhatsApp:</span>
                <span>{transaction.whatsapp_number}</span>
              </div>
            )}
            
            {transaction.details && (
              <div className="row">
                <span>Details:</span>
                <span>{transaction.details}</span>
              </div>
            )}
            
            <div className="total">
              <div className="row">
                <span>AMOUNT:</span>
                <span>ZMW {transaction.amount.toFixed(2)}</span>
              </div>
            </div>
            
            <div className="text-center mt-4 text-xs">
              <p>Thank you for your business!</p>
              <p>Processed by: {transaction.added_by}</p>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handlePrint} className="flex items-center gap-2">
              <Printer className="h-4 w-4" />
              Print Receipt
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
