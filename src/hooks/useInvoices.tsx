import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface InvoiceItem {
  id: string;
  package: string;
  qty: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoice_id: string;
  date: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  booking_type: 'booking' | 'payment';
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  discount_amount: number;
  total: number;
  notes: string;
  created_by: string;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateInvoiceData {
  invoice_id: string;
  date: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  booking_type: 'booking' | 'payment';
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  discount_amount: number;
  total: number;
  notes: string;
}

export function useInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { currentUser } = useAuth();

  // Fetch all invoices
  const fetchInvoices = async () => {
    setLoading(true);
    try {
      console.log('🔄 Fetching invoices from Supabase...');
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('📊 Supabase response:', { data: data?.length, error });

      if (error) {
        console.error('❌ Supabase error:', error);
        throw error;
      }

      const formattedInvoices: Invoice[] = (data || []).map(invoice => ({
        ...invoice,
        items: invoice.items as InvoiceItem[]
      }));

      console.log('✅ Formatted invoices:', formattedInvoices.length);
      setInvoices(formattedInvoices);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast({
        title: "Error",
        description: `Failed to fetch invoices: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Create new invoice
  const createInvoice = async (invoiceData: CreateInvoiceData): Promise<Invoice | null> => {
    if (!currentUser) {
      console.error('❌ User not authenticated');
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive"
      });
      return null;
    }

    try {
      console.log('🔄 Creating invoice...', invoiceData);
      console.log('👤 Current user:', currentUser);

      const insertData = {
        ...invoiceData,
        created_by: currentUser.username,
        created_by_user_id: currentUser.id
      };

      console.log('📝 Insert data:', insertData);

      const { data, error } = await supabase
        .from('invoices')
        .insert(insertData)
        .select()
        .single();

      console.log('📊 Supabase insert response:', { data, error });

      if (error) {
        console.error('❌ Supabase insert error:', error);
        throw error;
      }

      const newInvoice: Invoice = {
        ...data,
        items: data.items as InvoiceItem[]
      };

      setInvoices(prev => [newInvoice, ...prev]);

      toast({
        title: "Success",
        description: "Invoice created successfully"
      });

      console.log('✅ Invoice created successfully:', newInvoice);
      return newInvoice;
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast({
        title: "Error",
        description: `Failed to create invoice: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
      return null;
    }
  };

  // Update invoice
  const updateInvoice = async (id: string, updates: Partial<CreateInvoiceData>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('invoices')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      // Refresh invoices
      await fetchInvoices();
      
      toast({
        title: "Success",
        description: "Invoice updated successfully"
      });

      return true;
    } catch (error) {
      console.error('Error updating invoice:', error);
      toast({
        title: "Error",
        description: "Failed to update invoice",
        variant: "destructive"
      });
      return false;
    }
  };

  // Delete invoice
  const deleteInvoice = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setInvoices(prev => prev.filter(invoice => invoice.id !== id));
      
      toast({
        title: "Success",
        description: "Invoice deleted successfully"
      });

      return true;
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast({
        title: "Error",
        description: "Failed to delete invoice",
        variant: "destructive"
      });
      return false;
    }
  };

  // Generate unique invoice ID
  const generateInvoiceId = async (): Promise<string> => {
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const timestamp = Date.now().toString().slice(-6);
      const invoiceId = `LH${timestamp}`;

      // Check if this ID already exists
      const { data, error } = await supabase
        .from('invoices')
        .select('invoice_id')
        .eq('invoice_id', invoiceId)
        .single();

      if (error && error.code === 'PGRST116') {
        // No record found, ID is unique
        return invoiceId;
      }

      attempts++;
      // Wait a bit before trying again
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Fallback with random number
    return `LH${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 100)}`;
  };

  // Get invoice by ID
  const getInvoiceById = (id: string): Invoice | undefined => {
    return invoices.find(invoice => invoice.id === id);
  };

  // Get invoice by invoice_id
  const getInvoiceByInvoiceId = (invoiceId: string): Invoice | undefined => {
    return invoices.find(invoice => invoice.invoice_id === invoiceId);
  };

  // Search invoices
  const searchInvoices = (query: string): Invoice[] => {
    if (!query.trim()) return invoices;
    
    const lowercaseQuery = query.toLowerCase();
    return invoices.filter(invoice => 
      invoice.invoice_id.toLowerCase().includes(lowercaseQuery) ||
      invoice.customer_name.toLowerCase().includes(lowercaseQuery) ||
      invoice.customer_phone?.toLowerCase().includes(lowercaseQuery) ||
      invoice.customer_email?.toLowerCase().includes(lowercaseQuery)
    );
  };

  // Load invoices on mount
  useEffect(() => {
    fetchInvoices();
  }, []);

  return {
    invoices,
    loading,
    fetchInvoices,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    generateInvoiceId,
    getInvoiceById,
    getInvoiceByInvoiceId,
    searchInvoices
  };
}
