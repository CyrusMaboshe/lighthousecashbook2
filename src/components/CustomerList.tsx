
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X, Users, Search, Phone } from 'lucide-react';
import { Transaction } from '@/hooks/useTransactions';

interface CustomerListProps {
  transactions: Transaction[];
  onClose: () => void;
}

interface CustomerInfo {
  name: string;
  whatsappNumber: string;
  totalTransactions: number;
  lastVisit: string;
}

export function CustomerList({ transactions, onClose }: CustomerListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search term to keep keyboard typing highly responsive
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 150);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Extract unique customers with memoization
  const uniqueCustomers = useMemo(() => {
    if (!transactions) return [];

    const acc: Record<string, CustomerInfo> = {};
    for (const transaction of transactions) {
      if (transaction.type !== 'cash-in' || !transaction.customer_name || !transaction.whatsapp_number) {
        continue;
      }

      const key = `${transaction.customer_name.trim()}-${transaction.whatsapp_number.trim()}`;
      if (!acc[key]) {
        acc[key] = {
          name: transaction.customer_name,
          whatsappNumber: transaction.whatsapp_number,
          totalTransactions: 0,
          lastVisit: transaction.date
        };
      }
      
      acc[key].totalTransactions += 1;
      
      // Compare ISO date strings directly (faster than creating Date objects)
      if (transaction.date > acc[key].lastVisit) {
        acc[key].lastVisit = transaction.date;
      }
    }
    
    // Return sorted by last visit descending
    return Object.values(acc).sort((a, b) => b.lastVisit.localeCompare(a.lastVisit));
  }, [transactions]);

  // Convert to array and filter by debounced search term
  const customerList = useMemo(() => {
    const query = debouncedSearch.toLowerCase().trim();
    if (!query) return uniqueCustomers;

    return uniqueCustomers.filter(customer => 
      customer.name.toLowerCase().includes(query) ||
      customer.whatsappNumber.includes(query)
    );
  }, [uniqueCustomers, debouncedSearch]);

  // Incremental rendering limits
  const [visibleLimit, setVisibleLimit] = useState(25);

  useEffect(() => {
    setVisibleLimit(25);
  }, [debouncedSearch]);

  const visibleCustomers = useMemo(() => {
    return customerList.slice(0, visibleLimit);
  }, [customerList, visibleLimit]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollHeight - target.scrollTop <= target.clientHeight + 100) {
      setVisibleLimit(prev => Math.min(prev + 25, customerList.length));
    }
  };

  const formatWhatsAppNumber = (number: string) => {
    if (number.startsWith('+')) return number;
    if (number.startsWith('260')) return `+${number}`;
    return `+260${number}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-white shadow-xl overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 flex-shrink-0">
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            Customer Directory
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col overflow-hidden pb-4">
          {/* Sticky Search Bar */}
          <div className="relative mb-6 flex-shrink-0">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input
              placeholder="Search by name or WhatsApp number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Smooth Scrollable Container */}
          <div 
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar touch-pan-y"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {visibleCustomers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-600 mb-2">
                  {searchTerm ? 'No customers found' : 'No customers yet'}
                </h3>
                <p className="text-slate-500">
                  {searchTerm 
                    ? 'Try adjusting your search terms.' 
                    : 'Customer information will appear here when you add transactions with customer names and WhatsApp numbers.'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-3 pb-4">
                {visibleCustomers.map((customer) => (
                  <Card key={`${customer.name}-${customer.whatsappNumber}`} className="border border-slate-200 hover:border-slate-300 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-bold">
                            {customer.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg text-slate-800">{customer.name}</h3>
                            <div className="flex items-center gap-2 text-sm text-slate-600 mt-1">
                              <Phone className="h-3 w-3" />
                              <span className="font-mono">{formatWhatsAppNumber(customer.whatsappNumber)}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <Badge variant="outline" className="text-xs mb-1">
                            {customer.totalTransactions} {customer.totalTransactions === 1 ? 'transaction' : 'transactions'}
                          </Badge>
                          <div className="text-sm text-slate-600">
                            Last visit: {new Date(customer.lastVisit).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
          
          <div className="mt-4 pt-4 border-t border-slate-200 flex-shrink-0">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-800">
                {customerList.length}
              </div>
              <div className="text-sm text-slate-600">Total Customers</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
