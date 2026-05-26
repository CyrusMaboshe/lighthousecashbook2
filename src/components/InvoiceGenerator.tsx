import React, { useState } from 'react';
import { CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Minus, FileText, Download, Save, Search, Eye, Trash2, ShieldCheck, Zap, Activity, Layout, Receipt, Calendar, Calculator, Sparkles, Filter, Database, ArrowRightCircle, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useInvoices, CreateInvoiceData, Invoice } from '@/hooks/useInvoices';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface InvoiceItem {
  id: string;
  package: string;
  qty: number;
  unitPrice: number;
  total: number;
}

interface InvoiceData {
  invoiceId: string;
  date: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  bookingType: 'booking' | 'payment';
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  discountAmount: number;
  total: number;
  notes: string;
}

export function InvoiceGenerator() {
  const { toast } = useToast();
  const { invoices, loading, createInvoice, generateInvoiceId, deleteInvoice, searchInvoices } = useInvoices();
  const [currentView, setCurrentView] = useState<'create' | 'list'>('create');
  const [searchQuery, setSearchQuery] = useState('');
  const [invoiceData, setInvoiceData] = useState<InvoiceData>({
    invoiceId: `LH${Date.now().toString().slice(-6)}`,
    date: new Date().toISOString().split('T')[0],
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    bookingType: 'booking',
    items: [{ id: '1', package: '', qty: 1, unitPrice: 0, total: 0 }],
    subtotal: 0,
    discount: 0,
    discountAmount: 0,
    total: 0,
    notes: ''
  });

  const packageOptions = [
    'Wedding Photography',
    'Portrait Session',
    'Event Photography',
    'Product Photography',
    'Video Production',
    'Photo Editing',
    'Custom Package'
  ];

  const calculateItemTotal = (qty: number, unitPrice: number) => qty * unitPrice;

  const calculateTotals = (items: InvoiceItem[], discount: number) => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const discountAmount = (subtotal * discount) / 100;
    const total = subtotal - discountAmount;
    return { subtotal, discountAmount, total };
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    const updatedItems = invoiceData.items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'qty' || field === 'unitPrice') {
          updatedItem.total = calculateItemTotal(updatedItem.qty, updatedItem.unitPrice);
        }
        return updatedItem;
      }
      return item;
    });

    const { subtotal, discountAmount, total } = calculateTotals(updatedItems, invoiceData.discount);

    setInvoiceData(prev => ({
      ...prev,
      items: updatedItems,
      subtotal,
      discountAmount,
      total
    }));
  };

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      package: '',
      qty: 1,
      unitPrice: 0,
      total: 0
    };
    setInvoiceData(prev => ({ ...prev, items: [...prev.items, newItem] }));
  };

  const removeItem = (id: string) => {
    if (invoiceData.items.length === 1) return;
    const updatedItems = invoiceData.items.filter(item => item.id !== id);
    const { subtotal, discountAmount, total } = calculateTotals(updatedItems, invoiceData.discount);
    setInvoiceData(prev => ({ ...prev, items: updatedItems, subtotal, discountAmount, total }));
  };

  const updateDiscount = (discount: number) => {
    const { subtotal, discountAmount, total } = calculateTotals(invoiceData.items, discount);
    setInvoiceData(prev => ({ ...prev, discount, discountAmount, total }));
  };

  const generateNewInvoiceId = async () => {
    const newId = await generateInvoiceId();
    setInvoiceData(prev => ({ ...prev, invoiceId: newId }));
  };

  const handleSaveInvoice = async () => {
    if (!invoiceData.customerName.trim()) {
      toast({ title: "Validation Error", description: "Customer name is required", variant: "destructive" });
      return;
    }
    if (invoiceData.items.some(item => !item.package.trim())) {
      toast({ title: "Validation Error", description: "All items must have a package selected", variant: "destructive" });
      return;
    }

    const createData: CreateInvoiceData = {
      invoice_id: invoiceData.invoiceId,
      date: invoiceData.date,
      customer_name: invoiceData.customerName,
      customer_phone: invoiceData.customerPhone,
      customer_email: invoiceData.customerEmail,
      booking_type: invoiceData.bookingType,
      items: invoiceData.items,
      subtotal: invoiceData.subtotal,
      discount: invoiceData.discount,
      discount_amount: invoiceData.discountAmount,
      total: invoiceData.total,
      notes: invoiceData.notes
    };

    const savedInvoice = await createInvoice(createData);
    if (savedInvoice) toast({ title: "Success", description: "System Provisioned Invoice Saved" });
  };

  const handleGeneratePDF = async () => {
    toast({ title: "Protocol Initiated", description: "Generating modern audit PDF..." });
  };

  const resetForm = async () => {
    const newId = await generateInvoiceId();
    setInvoiceData({
      invoiceId: newId,
      date: new Date().toISOString().split('T')[0],
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      bookingType: 'booking',
      items: [{ id: '1', package: '', qty: 1, unitPrice: 0, total: 0 }],
      subtotal: 0,
      discount: 0,
      discountAmount: 0,
      total: 0,
      notes: ''
    });
    setCurrentView('create');
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setInvoiceData({
      invoiceId: invoice.invoice_id,
      date: invoice.date,
      customerName: invoice.customer_name,
      customerPhone: invoice.customer_phone || '',
      customerEmail: invoice.customer_email || '',
      bookingType: invoice.booking_type,
      items: invoice.items,
      subtotal: invoice.subtotal,
      discount: invoice.discount,
      discountAmount: invoice.discount_amount,
      total: invoice.total,
      notes: invoice.notes || ''
    });
    setCurrentView('create');
  };

  const filteredInvoices = searchQuery ? searchInvoices(searchQuery) : invoices;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Premium Header */}
      <div className="glass-card overflow-hidden p-8 md:p-12 relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] -mr-32 -mt-32" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-[24px] bg-gradient-to-br from-indigo-500 to-purple-600 p-4 border border-white/20 shadow-2xl shadow-indigo-500/40">
                <Receipt className="w-full h-full text-white" />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-none">Invoice Nexus</h1>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.25em] mt-2 flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                  Financial Protocol Generation & Retrieval
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setCurrentView('create')}
              className={cn(
                "h-12 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                currentView === 'create' ? "glass-btn-primary bg-indigo-600 shadow-lg shadow-indigo-500/20" : "bg-white/5 text-slate-400 hover:bg-white/10"
              )}
            >
              <Plus className="h-4 w-4 mr-2" />
              Generate
            </Button>
            <Button
              onClick={() => setCurrentView('list')}
              className={cn(
                "h-12 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                currentView === 'list' ? "glass-btn-primary bg-indigo-600 shadow-lg shadow-indigo-500/20" : "bg-white/5 text-slate-400 hover:bg-white/10"
              )}
            >
              <Database className="h-4 w-4 mr-2" />
              Registry ({invoices.length})
            </Button>
          </div>
        </div>
      </div>

      {currentView === 'list' ? (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-700">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-600 h-4 w-4 group-focus-within:text-indigo-400 transition-colors" />
              <Input
                placeholder="Search Financial Registry..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 glass-input h-14 text-[11px] font-black uppercase tracking-widest border-white/5 focus:border-indigo-500/30 transition-all"
              />
            </div>
            <Button onClick={resetForm} className="h-14 px-8 rounded-2xl bg-indigo-600 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 active:scale-95 transition-all">
              <Plus className="h-4 w-4 mr-2" />
              Initialize Protocol
            </Button>
          </div>

          <div className="glass-card overflow-hidden border-white/5 shadow-2xl relative">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
            {loading ? (
              <div className="p-32 flex flex-col items-center justify-center">
                <Activity className="w-12 h-12 text-indigo-500 animate-spin mb-6" />
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Syncing Archives...</p>
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="p-32 text-center">
                <Layout className="w-16 h-16 text-slate-800 mx-auto mb-6 stroke-[0.5]" />
                <h4 className="text-xl font-black text-slate-600 uppercase tracking-tighter mb-2">Registry Depleted</h4>
                <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.4em]">No historical audit trails detected in sector</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.03]">
                {filteredInvoices.map((invoice) => (
                  <div key={invoice.id} className="p-6 hover:bg-white/[0.02] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-6 group">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-indigo-600 group-hover:border-indigo-500 transition-all duration-500 shadow-2xl">
                        <Receipt className="w-6 h-6 text-slate-400 group-hover:text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-lg font-black text-white tracking-tight uppercase italic leading-none">{invoice.invoice_id}</h3>
                          <Badge className={cn("text-[8px] font-black h-4", invoice.booking_type === 'booking' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20')}>
                            {invoice.booking_type.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight italic mb-3">{invoice.customer_name}</p>
                        <div className="flex items-center gap-4 text-[9px] font-black text-slate-600 uppercase tracking-widest">
                          <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /> {format(new Date(invoice.date), 'MMM d, yyyy')}</span>
                          <span className="flex items-center gap-1.5"><Layout className="w-3 h-3" /> {invoice.items.length} COMPONENT(S)</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-8">
                      <div className="text-right">
                        <div className="text-2xl font-black text-white tracking-tighter tabular-nums leading-none">ZMW {invoice.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-1">Settlement Volume</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button onClick={() => handleViewInvoice(invoice)} variant="ghost" className="h-10 w-10 p-0 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" className="h-10 w-10 p-0 rounded-xl bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/20 transition-all">
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button onClick={() => deleteInvoice(invoice.id)} variant="ghost" className="h-10 w-10 p-0 rounded-xl bg-rose-600/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/20 transition-all">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Agent Matrix */}
            <div className="flex-1 space-y-6">
              <div className="glass-card p-8 border-white/5 bg-white/[0.01]">
                <div className="flex items-center gap-3 mb-8">
                  <Users className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Agent Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Protocol Identifier</Label>
                    <div className="relative group">
                      <Input value={invoiceData.invoiceId} readOnly className="glass-input h-12 text-[11px] font-black bg-white/[0.03] border-white/5 text-indigo-400" />
                      <Button onClick={generateNewInvoiceId} className="absolute right-1 top-1 h-10 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-[8px] font-black uppercase tracking-widest">Regen</Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Temporal Offset</Label>
                    <Input type="date" value={invoiceData.date} onChange={(e) => setInvoiceData(prev => ({ ...prev, date: e.target.value }))} className="glass-input h-12 text-[11px] font-black" />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Designated Customer *</Label>
                    <Input value={invoiceData.customerName} onChange={(e) => setInvoiceData(prev => ({ ...prev, customerName: e.target.value }))} placeholder="IDENTIFY TARGET RECIPIENT..." className="glass-input h-14 text-[12px] font-black uppercase tracking-tight italic" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Contact Uplink (Phone)</Label>
                    <Input value={invoiceData.customerPhone} onChange={(e) => setInvoiceData(prev => ({ ...prev, customerPhone: e.target.value }))} placeholder="+260 000 000 000" className="glass-input h-12 text-[11px] font-black" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">E-Link (Email)</Label>
                    <Input type="email" value={invoiceData.customerEmail} onChange={(e) => setInvoiceData(prev => ({ ...prev, customerEmail: e.target.value }))} placeholder="TARGET@DOMAIN.COM" className="glass-input h-12 text-[11px] font-black uppercase tracking-widest" />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Provision Type</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => setInvoiceData(prev => ({ ...prev, bookingType: 'booking' }))} className={cn("h-12 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all", invoiceData.bookingType === 'booking' ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20" : "bg-white/5 border-white/5 text-slate-500 hover:bg-white/10")}>Phase 1: Booking</button>
                      <button onClick={() => setInvoiceData(prev => ({ ...prev, bookingType: 'payment' }))} className={cn("h-12 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all", invoiceData.bookingType === 'payment' ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20" : "bg-white/5 border-white/5 text-slate-500 hover:bg-white/10")}>Phase 2: Settlement</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Matrix Summary */}
            <div className="xl:w-[400px] flex flex-col gap-6">
              <div className="glass-card p-8 border-indigo-500/20 bg-indigo-500/[0.03] relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all duration-700" />
                <div className="flex items-center gap-3 mb-8 relative z-10">
                  <Calculator className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Settlement Matrix</h3>
                </div>

                <div className="space-y-4 relative z-10">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Sub-Calculation</span>
                    <span className="text-[13px] font-black text-slate-300 tabular-nums uppercase">ZMW {invoiceData.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>

                  <div className="flex justify-between items-center py-4 border-y border-white/5">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Protocol Offset (%)</span>
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        value={invoiceData.discount}
                        onChange={(e) => updateDiscount(Number(e.target.value))}
                        className="w-16 h-8 text-right glass-input text-[11px] font-black border-indigo-500/20"
                        min="0" max="100"
                      />
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-rose-400">
                    <span className="text-[9px] font-black uppercase tracking-widest">Negative Vector</span>
                    <span className="text-[13px] font-black tabular-nums">-ZMW {invoiceData.discountAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>

                  <div className="pt-6">
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mb-2 leading-none">Net Volume Total</span>
                      <div className="text-5xl font-black text-white tracking-tighter tabular-nums leading-none">
                        {invoiceData.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                      <span className="text-[10px] font-black text-slate-600 uppercase italic mt-2 tracking-tighter">Zambian Kwacha (ZMW)</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass-card p-6 border-white/5 bg-white/[0.01]">
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="w-4 h-4 text-slate-600" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Executive Directives</span>
                </div>
                <Textarea
                  value={invoiceData.notes}
                  onChange={(e) => setInvoiceData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="DECLARE SPECIAL INSTRUCTIONS..."
                  className="glass-input min-h-[120px] resize-none text-[11px] font-black uppercase tracking-widest bg-white/[0.02] border-white/5"
                />
              </div>
            </div>
          </div>

          {/* Component Registry */}
          <div className="glass-card overflow-hidden border-white/5 shadow-2xl">
            <div className="p-8 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400">
                  <Layout className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white tracking-tight uppercase">Protocol Components</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Unit Specification Ledger</p>
                </div>
              </div>
              <Button onClick={addItem} className="h-10 px-6 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all">
                <Plus className="h-4 w-4 mr-2" />
                Inject New Component
              </Button>
            </div>

            <div className="p-8 space-y-6">
              {/* Unit Legend */}
              <div className="grid grid-cols-12 gap-6 pb-4 border-b border-white/5 hidden md:grid">
                <div className="col-span-1 text-[10px] font-black text-slate-600 uppercase tracking-widest">ID</div>
                <div className="col-span-4 text-[10px] font-black text-slate-600 uppercase tracking-widest">Protocol Package</div>
                <div className="col-span-2 text-[10px] font-black text-slate-600 uppercase tracking-widest text-center">Density (Qty)</div>
                <div className="col-span-2 text-[10px] font-black text-slate-600 uppercase tracking-widest text-right">Unit Vector</div>
                <div className="col-span-2 text-[10px] font-black text-slate-600 uppercase tracking-widest text-right">Vector Total</div>
                <div className="col-span-1"></div>
              </div>

              {/* Matrix Rows */}
              <div className="space-y-4">
                {invoiceData.items.map((item, index) => (
                  <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center group animate-in slide-in-from-left-4 duration-500" style={{ animationDelay: `${index * 50}ms` }}>
                    <div className="col-span-1 text-[11px] font-black text-slate-700 italic">#{String(index + 1).padStart(2, '0')}</div>

                    <div className="col-span-4">
                      <Select value={item.package} onValueChange={(v) => updateItem(item.id, 'package', v)}>
                        <SelectTrigger className="glass-input h-12 text-[11px] font-black uppercase transition-all focus:border-indigo-500/40">
                          <SelectValue placeholder="SELECT SECTOR..." />
                        </SelectTrigger>
                        <SelectContent className="glass-select-content">
                          {packageOptions.map(pkg => <SelectItem key={pkg} value={pkg}>{pkg.toUpperCase()}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-2">
                      <Input type="number" value={item.qty} onChange={(e) => updateItem(item.id, 'qty', Number(e.target.value))} min="1" className="glass-input h-12 text-center text-[11px] font-black border-white/5" />
                    </div>

                    <div className="col-span-2">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-600 italic">ZMW</span>
                        <Input type="number" value={item.unitPrice} onChange={(e) => updateItem(item.id, 'unitPrice', Number(e.target.value))} min="0" step="0.01" className="glass-input h-12 pl-10 text-right text-[11px] font-black border-white/5" placeholder="0.00" />
                      </div>
                    </div>

                    <div className="col-span-2 text-right">
                      <div className="text-[16px] font-black text-white tracking-tighter tabular-nums italic">ZMW {item.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                    </div>

                    <div className="col-span-1 flex justify-center">
                      <Button onClick={() => removeItem(item.id)} disabled={invoiceData.items.length === 1} variant="ghost" className="h-10 w-10 p-0 rounded-xl bg-rose-600/5 hover:bg-rose-600 text-rose-500 hover:text-white transition-all disabled:opacity-0">
                        <Minus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Suite Footer */}
            <div className="p-8 border-t border-white/5 bg-white/[0.01] flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-3">
                <Button onClick={resetForm} variant="ghost" className="h-14 px-8 rounded-2xl text-slate-500 text-[10px] font-black uppercase tracking-widest hover:bg-white/5 italic">
                  Reset Buffer
                </Button>
              </div>
              <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                <Button onClick={handleSaveInvoice} className="h-14 px-10 rounded-2xl bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 active:scale-95 transition-all w-full md:w-auto">
                  <Save className="h-4 w-4 mr-2" />
                  Commit Protocol
                </Button>
                <Button onClick={handleGeneratePDF} className="h-14 px-10 rounded-2xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 active:scale-95 transition-all w-full md:w-auto">
                  <Download className="h-4 w-4 mr-2" />
                  Generate Modern Audit PDF
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
