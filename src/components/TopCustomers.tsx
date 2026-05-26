
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Crown, Users } from 'lucide-react';
import { Transaction } from '@/hooks/useTransactions';

interface TopCustomersProps {
  transactions: Transaction[];
  onClose: () => void;
}

interface CustomerStats {
  name: string;
  visits: number;
}

export function TopCustomers({ transactions, onClose }: TopCustomersProps) {
  // Calculate customer visit statistics
  const customerStats = transactions
    .filter(t => t.type === 'cash-in' && t.customer_name)
    .reduce((acc, transaction) => {
      const name = transaction.customer_name;

      if (!acc[name]) {
        acc[name] = {
          visitDates: new Set<string>()
        };
      }

      acc[name].visitDates.add(transaction.date);

      return acc;
    }, {} as Record<string, { visitDates: Set<string> }>);

  // Convert to array, filter customers with 2+ visits, and sort by visit count
  const topCustomers: CustomerStats[] = Object.entries(customerStats)
    .map(([name, data]) => ({
      name,
      visits: data.visitDates.size
    }))
    .filter(customer => customer.visits >= 2) // Only show customers with 2+ visits
    .sort((a, b) => b.visits - a.visits); // Sort by visit count (highest first)



  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            Repeat Customers
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent>
          {topCustomers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-600 mb-2">No repeat customers found</h3>
              <p className="text-slate-500">Customers who have visited the studio 2 or more times will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {topCustomers.map((customer, index) => (
                <Card key={customer.name} className="border border-slate-200 hover:border-slate-300 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg text-slate-800">{customer.name}</h3>
                        </div>
                      </div>

                      <div className="text-right">
                        <Badge variant="outline" className="text-sm font-medium">
                          {customer.visits} {customer.visits === 1 ? 'visit' : 'visits'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {topCustomers.length > 0 && (
            <div className="mt-6 pt-4 border-t border-slate-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-800">
                  {topCustomers.length}
                </div>
                <div className="text-sm text-slate-600">Repeat Customers</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
