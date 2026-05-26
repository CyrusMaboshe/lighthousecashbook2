import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { X, Plus, TrendingUp, TrendingDown, Calendar, Clock, User, Phone, Camera, FileText, Sparkles, Shield, Zap, DollarSign, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Transaction, useTransactions } from '@/hooks/useTransactions';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/contexts/ThemeContext';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';


// Generate static options outside component to avoid recreate on every render
const AMOUNT_OPTIONS = (() => {
  const options = [];
  for (let i = 25; i <= 500; i += 25) {
    options.push(i);
  }
  return options;
})();

const PICTURE_OPTIONS = (() => {
  const options = [];
  for (let i = 1; i <= 20; i++) {
    options.push(i);
  }
  for (let i = 25; i <= 50; i += 5) {
    options.push(i);
  }
  for (let i = 60; i <= 100; i += 10) {
    options.push(i);
  }
  for (let i = 150; i <= 500; i += 50) {
    options.push(i);
  }
  for (let i = 600; i <= 1000; i += 100) {
    options.push(i);
  }
  const bigNumbers = [1500, 2000, 2500, 3000];
  options.push(...bigNumbers);
  return options;
})();

interface TransactionFormProps {
  type: 'cash-in' | 'cash-out';
  categories: string[];
  onSubmit: (transaction: Omit<Transaction, 'id' | 'added_by'>) => void;
  onCancel: () => void;
  onAddCategory?: (category: string) => void;
  initialTransaction?: Transaction; // For editing mode
  onUpdate?: (id: string, transaction: Partial<Transaction>) => void; // For updating
}

export function TransactionForm({ type, categories, onSubmit, onCancel, onAddCategory, initialTransaction, onUpdate }: TransactionFormProps) {
  const { currentUser, isAdmin } = useAuth();
  const { toast } = useToast();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const isEditMode = !!initialTransaction;

  // ========== HELPER FUNCTIONS (defined before useState) ==========

  // Helper function to determine if amount is a predefined option
  const isPredefinedAmount = (amount: number): boolean => {
    return AMOUNT_OPTIONS.includes(amount);
  };

  // Helper function to determine if picture count is a predefined option
  const isPredefinedPictureCount = (count: number): boolean => {
    return PICTURE_OPTIONS.includes(count);
  };

  // Initialize form data with proper handling for cash-in amounts
  const getInitialAmount = () => {
    if (type === 'cash-out') {
      return 'custom';
    }

    if (initialTransaction?.amount) {
      const amount = Number(initialTransaction.amount);
      // Check if the amount is one of the predefined options
      if (isPredefinedAmount(amount)) {
        return amount.toString();
      } else {
        // Use 'custom' if it's not a predefined amount
        return 'custom';
      }
    }

    return '';
  };

  // Initialize number of pictures with proper handling for cash-in amounts
  const getInitialPictures = () => {
    if (type === 'cash-out') {
      return '0';
    }

    if (initialTransaction?.number_of_pictures) {
      const count = Number(initialTransaction.number_of_pictures);
      // Check if the count is one of the predefined options
      if (isPredefinedPictureCount(count)) {
        return count.toString();
      } else {
        // Use 'custom' if it's not a predefined count
        return 'custom';
      }
    }

    return '';
  };

  // ========== STATE INITIALIZATION ==========

  const STORAGE_KEY = `tx_form_state_${type}`;

  const defaultFormData = {
    date: initialTransaction?.date || format(new Date(), 'yyyy-MM-dd'),
    time: initialTransaction?.time || format(new Date(), 'HH:mm'),
    category: initialTransaction?.category_name || '',
    newCategory: '',
    amount: getInitialAmount(),
    customerName: initialTransaction?.customer_name || (type === 'cash-out' ? (currentUser?.username || '') : ''),
    numberOfPictures: getInitialPictures(),
    whatsappNumber: initialTransaction?.whatsapp_number || (type === 'cash-in' ? '+260' : ''),
    details: initialTransaction?.details || (type === 'cash-out' ? '' : ''),
  };

  const [formData, setFormData] = useState(() => {
    if (!initialTransaction) {
      const saved = localStorage.getItem(STORAGE_KEY + '_data');
      if (saved) {
        try {
          return { ...defaultFormData, ...JSON.parse(saved) };
        } catch (e) { }
      }
    }
    return defaultFormData;
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showNewCategory, setShowNewCategory] = useState(() => {
    if (!initialTransaction) {
      return localStorage.getItem(STORAGE_KEY + '_newCat') === 'true';
    }
    return false;
  });

  const [customAmount, setCustomAmount] = useState(() => {
    if (!initialTransaction) {
      return localStorage.getItem(STORAGE_KEY + '_amt') || '';
    }
    return initialTransaction?.amount?.toString() || '';
  });

  const [customPictures, setCustomPictures] = useState(() => {
    if (!initialTransaction) {
      return localStorage.getItem(STORAGE_KEY + '_pics') || '';
    }
    return initialTransaction?.number_of_pictures?.toString() || '';
  });

  // In-app Contact Picker State
  const [showContactPickerModal, setShowContactPickerModal] = useState(false);
  const [contactSearchTerm, setContactSearchTerm] = useState('');
  const [debouncedContactSearch, setDebouncedContactSearch] = useState('');

  // Debounce the search term to keep typing fluid
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedContactSearch(contactSearchTerm);
    }, 200);
    return () => clearTimeout(timer);
  }, [contactSearchTerm]);

  // Load transactions to extract historical contacts
  const { transactions } = useTransactions();

  // Extract unique contacts from transactions
  const uniqueContacts = React.useMemo(() => {
    if (!transactions) return [];
    
    const contactMap = new Map<string, { name: string; phone: string; lastVisit: string }>();
    
    // Sort transactions by date descending so the most recent WhatsApp number is preserved
    const cashInTransactions = [...transactions]
      .filter(t => t.type === 'cash-in' && t.customer_name && t.whatsapp_number)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    for (const tx of cashInTransactions) {
      const name = tx.customer_name.trim();
      const phone = tx.whatsapp_number.trim();
      if (!name || !phone) continue;
      
      const key = `${name.toLowerCase()}-${phone}`;
      if (!contactMap.has(key)) {
        contactMap.set(key, {
          name,
          phone,
          lastVisit: tx.date
        });
      }
    }
    
    return Array.from(contactMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [transactions]);

  // Filter contacts based on debounced search query
  const filteredContacts = React.useMemo(() => {
    const query = debouncedContactSearch.toLowerCase().trim();
    if (!query) return uniqueContacts;
    return uniqueContacts.filter(c => 
      c.name.toLowerCase().includes(query) || 
      c.phone.includes(query)
    );
  }, [uniqueContacts, debouncedContactSearch]);

  // Incremental rendering for scrolling performance
  const [visibleContactsCount, setVisibleContactsCount] = useState(30);
  useEffect(() => {
    setVisibleContactsCount(30);
  }, [debouncedContactSearch]);

  const visibleContacts = React.useMemo(() => {
    return filteredContacts.slice(0, visibleContactsCount);
  }, [filteredContacts, visibleContactsCount]);

  const handleContactListScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    if (container.scrollHeight - container.scrollTop <= container.clientHeight + 80) {
      setVisibleContactsCount(prev => Math.min(prev + 30, filteredContacts.length));
    }
  };

  const selectContact = (name: string, phone: string) => {
    setFormData(prev => ({
      ...prev,
      customerName: name,
      whatsappNumber: phone.startsWith('+') ? phone : '+260' + phone.replace(/^\+?260?/, '').replace(/^0/, '')
    }));
    setShowContactPickerModal(false);
    toast({
      title: "Contact Selected",
      description: `Loaded ${name} successfully.`,
    });
  };

  // Debounced LocalStorage Synchronization
  React.useEffect(() => {
    if (initialTransaction) return;

    const timer = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY + '_data', JSON.stringify(formData));
      localStorage.setItem(STORAGE_KEY + '_newCat', String(showNewCategory));
      localStorage.setItem(STORAGE_KEY + '_amt', customAmount);
      localStorage.setItem(STORAGE_KEY + '_pics', customPictures);
    }, 500);

    return () => clearTimeout(timer);
  }, [formData, showNewCategory, customAmount, customPictures, initialTransaction, STORAGE_KEY]);

  const clearPersistedData = () => {
    localStorage.removeItem(STORAGE_KEY + '_data');
    localStorage.removeItem(STORAGE_KEY + '_newCat');
    localStorage.removeItem(STORAGE_KEY + '_amt');
    localStorage.removeItem(STORAGE_KEY + '_pics');
  };

  // ========== EVENT HANDLERS ==========

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    // Get final amount value
    const finalAmount = formData.amount === 'custom' ? customAmount : formData.amount;

    // Get final pictures value
    const finalPictures = formData.numberOfPictures === 'custom' ? customPictures : formData.numberOfPictures;

    // Validation for cash-in transactions
    if (type === 'cash-in') {
      if (!finalAmount || !formData.customerName || !formData.whatsappNumber || formData.whatsappNumber === '+260') {
        toast({
          title: "Validation Error",
          description: "Amount, customer name, and WhatsApp number are mandatory for cash-in transactions.",
          variant: "destructive",
        });
        return;
      }
    }

    // Validation for cash-out transactions - removed details requirement
    if (type === 'cash-out') {
      if (!finalAmount || !formData.category) {
        toast({
          title: "Validation Error",
          description: "Amount and category are mandatory for cash-out transactions.",
          variant: "destructive",
        });
        return;
      }
    }

    const finalCategory = showNewCategory ? formData.newCategory : formData.category;

    setIsSubmitting(true);

    try {
      const transactionData = {
        date: formData.date,
        time: formData.time,
        type,
        category_name: finalCategory,
        amount: parseFloat(finalAmount),
        customer_name: type === 'cash-out' ? (currentUser?.username || 'Unknown') : formData.customerName,
        number_of_pictures: type === 'cash-in' ? (parseInt(finalPictures) || 0) : 0,
        whatsapp_number: type === 'cash-in' ? formData.whatsappNumber : '',
        details: formData.details,
      };

      if (isEditMode && initialTransaction && onUpdate) {
        // Update existing transaction
        onUpdate(initialTransaction.id, transactionData);
        toast({
          title: "Transaction Updated",
          description: "The transaction has been successfully updated.",
        });
        onCancel(); // Close the form
      } else {
        // Create new transaction
        clearPersistedData();
        onSubmit(transactionData);
      }
    } catch (error) {
      console.error('Error submitting transaction:', error);
      toast({
        title: "Error",
        description: `Failed to ${isEditMode ? 'update' : 'save'} transaction. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWhatsAppChange = (value: string) => {
    if (!value.startsWith('+260')) {
      value = '+260' + value.replace(/^\+?260?/, '');
    }
    setFormData(prev => ({ ...prev, whatsappNumber: value }));
  };

  const handleContactPick = async () => {
    try {
      const nav = navigator as any;
      if ('contacts' in nav && 'ContactsManager' in window) {
        const props = ['name', 'tel'];
        const opts = { multiple: false };
        const contacts = await nav.contacts.select(props, opts);

        if (contacts && contacts.length > 0) {
          const contact = contacts[0];
          setFormData(prev => ({
            ...prev,
            customerName: (contact.name && contact.name.length > 0) ? contact.name[0] : prev.customerName,
            whatsappNumber: (contact.tel && contact.tel.length > 0)
              ? '+260' + contact.tel[0].replace(/\D/g, '').replace(/^260/, '').replace(/^0/, '')
              : prev.whatsappNumber
          }));
          toast({
            title: "Contact Selected",
            description: "Contact details loaded successfully.",
          });
        }
      } else {
        toast({
          title: "Not Supported",
          description: "Your device or browser doesn't support the contact picker. Please enter manually.",
        });
      }
    } catch (err) {
      console.error('Contact picker error:', err);
      // Graceful degradation when user cancels or permission denied
    }
  };

  const handleAddNewCategory = () => {
    if (formData.newCategory.trim() && onAddCategory) {
      onAddCategory(formData.newCategory.trim());
      setFormData(prev => ({ ...prev, category: formData.newCategory.trim(), newCategory: '' }));
      setShowNewCategory(false);
      toast({
        title: "Category Added",
        description: "New category has been added successfully.",
      });
    }
  };

  return (
    <>
      <Card
        className={cn(
          "transaction-form-card relative flex flex-col w-full border-0 rounded-xl overflow-hidden shadow-2xl",
          isLight
            ? "bg-white border border-slate-200"
            : "bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 border-white/10"
        )}
        style={{ height: '85vh', maxHeight: '800px', backdropFilter: 'blur(40px)' }}
      >
      {/* Fixed Header */}
      <div className={cn(
        "flex flex-row items-center justify-between px-6 py-4 border-b flex-shrink-0 z-20",
        isLight
          ? "border-slate-200 bg-white/95 backdrop-blur-md"
          : "border-white/10 bg-slate-900/50 backdrop-blur-md"
      )}>
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center shadow-md border",
            type === 'cash-in'
              ? isLight ? 'bg-green-50 border-green-200' : 'bg-green-500/20 border-green-500/30'
              : isLight ? 'bg-red-50 border-red-200' : 'bg-red-500/20 border-red-500/30'
          )}>
            {type === 'cash-in' ? (
              <TrendingUp className={cn("h-5 w-5", isLight ? "text-green-600" : "text-green-300")} />
            ) : (
              <TrendingDown className={cn("h-5 w-5", isLight ? "text-red-600" : "text-red-300")} />
            )}
          </div>
          <div>
            <CardTitle className={cn("text-xl font-bold tracking-tight", isLight ? "text-slate-900" : "text-white")}>
              {isEditMode ? 'Edit' : 'New'} {type === 'cash-in' ? 'Cash In' : 'Cash Out'}
            </CardTitle>
            <p className={cn("text-sm font-medium", isLight ? "text-slate-500" : "text-slate-400")}>
              {isEditMode ? 'Update transaction details' : (type === 'cash-in' ? 'Record incoming payment' : 'Record outgoing payment')}
            </p>
          </div>
        </div>
      </div>

      {/* Scrollable Content Area */}
      {(() => {
        const inputClass = type === 'cash-in'
          ? (isLight ? 'glass-input-success-light' : 'glass-input-success')
          : (isLight ? 'glass-input-danger-light' : 'glass-input-danger');
        const labelClass = cn("text-sm font-bold mb-2 block tracking-tight", isLight ? "text-slate-700" : "text-slate-200");
        return (
          <div className={cn("flex-1 overflow-y-auto overflow-x-hidden p-6 scroll-smooth custom-scrollbar gpu-accelerated scroll-momentum relative z-10")} style={{ scrollbarGutter: 'stable' }}>
            <form onSubmit={handleSubmit} className="space-y-6 pb-20 sm:pb-6">
              {/* Clean Date and Time Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date" className={labelClass}>
                    Date
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    required
                    className={cn(inputClass, "h-11")}
                  />
                </div>

                <div>
                  <Label htmlFor="time" className={labelClass}>
                    Time
                  </Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                    required
                    className={cn(inputClass, "h-11")}
                  />
                </div>
              </div>

              {/* Enhanced Category Section */}
              <div className="group">
                <div className="flex items-center justify-between mb-3">
                  <Label className={cn(labelClass, "mb-0 flex items-center gap-2")}>
                    <FileText className={cn("w-4 h-4", type === 'cash-in' ? (isLight ? "text-green-600" : "text-green-300") : (isLight ? "text-red-600" : "text-red-300"))} />
                    Transaction Category {type === 'cash-out' && <span className={cn("font-bold", isLight ? "text-red-500" : "text-red-400")}>*</span>}
                  </Label>
                  {isAdmin && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowNewCategory(!showNewCategory)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1 rounded-lg transition-all text-xs",
                        isLight
                          ? "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700"
                          : "bg-white/5 border-white/10 hover:bg-white/10 text-white"
                      )}
                    >
                      <Plus className="h-3 w-3" />
                      New Category
                    </Button>
                  )}
                </div>

                {showNewCategory ? (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter new category name"
                      value={formData.newCategory}
                      onChange={(e) => setFormData(prev => ({ ...prev, newCategory: e.target.value }))}
                      required
                      className={inputClass}
                    />
                    <Button
                      type="button"
                      onClick={handleAddNewCategory}
                      className={cn(
                        "font-bold px-4",
                        isLight
                          ? "bg-slate-900 text-white hover:bg-slate-800"
                          : "bg-white text-slate-900 hover:bg-white/90"
                      )}
                    >
                      Add
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowNewCategory(false)}
                      className={cn(
                        isLight
                          ? "border-slate-200 text-slate-700 hover:bg-slate-50"
                          : "border-white/20 text-white hover:bg-white/10"
                      )}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                    required={type === 'cash-out'}
                  >
                    <SelectTrigger className={cn(inputClass, "h-11")}>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent className={cn("border-white/20", isLight ? "bg-white text-slate-900 border-slate-200" : "glass-select-content text-white")}>
                      {categories && categories.length > 0 && categories.filter(category => category && category.trim() !== '').length > 0 ? (
                        categories.filter(category => category && category.trim() !== '').map(category => (
                          <SelectItem key={category} value={category} className={cn(isLight ? "text-slate-900 focus:bg-slate-100" : "glass-select-item text-white focus:bg-white/10")}>
                            {category}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-categories-available" disabled>
                          No categories available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount" className={labelClass}>Amount (ZMW) *</Label>
                  {type === 'cash-out' ? (
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      required
                      className={cn(inputClass, "h-11")}
                    />
                  ) : (
                    <>
                      <Select
                        value={formData.amount}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, amount: value }))}
                        required
                      >
                        <SelectTrigger className={cn(inputClass, "h-11")}>
                          <SelectValue placeholder="Select amount" />
                        </SelectTrigger>
                        <SelectContent className={cn("border-white/20", isLight ? "bg-white text-slate-900 border-slate-200" : "glass-select-content text-white")}>
                          {AMOUNT_OPTIONS.map(amount => (
                            <SelectItem key={amount} value={amount.toString()} className={cn(isLight ? "text-slate-900 focus:bg-slate-100" : "glass-select-item")}>
                              ZMW {amount.toLocaleString()}
                            </SelectItem>
                          ))}
                          <SelectItem value="custom" className={cn(isLight ? "text-slate-900 focus:bg-slate-100" : "glass-select-item")}>Custom Amount</SelectItem>
                        </SelectContent>
                      </Select>
                      {formData.amount === 'custom' && (
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Enter custom amount"
                          className={cn(inputClass, "mt-2 h-11")}
                          value={customAmount}
                          onChange={(e) => setCustomAmount(e.target.value)}
                          required
                        />
                      )}
                    </>
                  )}
                </div>

                {type === 'cash-in' && (
                  <div>
                    <Label htmlFor="numberOfPictures" className={labelClass}>Number of Pictures</Label>
                    <Select
                      value={formData.numberOfPictures}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, numberOfPictures: value }))}
                    >
                      <SelectTrigger className={cn(inputClass, "h-11")}>
                        <SelectValue placeholder="Select count" />
                      </SelectTrigger>
                        <SelectContent className={cn("border-white/20", isLight ? "bg-white text-slate-900 border-slate-200" : "glass-select-content text-white")}>
                          {PICTURE_OPTIONS.map(pictures => (
                            <SelectItem key={pictures} value={pictures.toString()} className={cn(isLight ? "text-slate-900 focus:bg-slate-100" : "glass-select-item")}>
                              {pictures.toLocaleString()} pictures
                            </SelectItem>
                          ))}
                          <SelectItem value="custom" className={cn(isLight ? "text-slate-900 focus:bg-slate-100" : "glass-select-item")}>Custom Number</SelectItem>
                        </SelectContent>
                    </Select>
                    {formData.numberOfPictures === 'custom' && (
                      <Input
                        type="number"
                        placeholder="Enter custom number"
                        className={cn(inputClass, "mt-2 h-11")}
                        value={customPictures}
                        onChange={(e) => setCustomPictures(e.target.value)}
                      />
                    )}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="customerName" className={labelClass}>
                  {type === 'cash-in' ? 'Customer Name *' : 'Withdraw By'}
                </Label>
                <Input
                  id="customerName"
                  placeholder={type === 'cash-in' ? 'Enter customer name' : currentUser?.username || 'Unknown'}
                  value={formData.customerName}
                  onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                  required={type === 'cash-in'}
                  disabled={type === 'cash-out'}
                  className={cn(inputClass, "h-11 disabled:opacity-50")}
                />
              </div>

              {type === 'cash-in' && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label htmlFor="whatsappNumber" className={cn(labelClass, "mb-0")}>WhatsApp Number *</Label>
                    <Button
                      type="button"
                      onClick={() => setShowContactPickerModal(true)}
                      variant="outline"
                      size="sm"
                      className={cn(
                        "h-7 text-xs px-2 flex items-center gap-1",
                        isLight
                          ? "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-600"
                          : "bg-white/5 border-white/10 hover:bg-white/10 text-slate-200"
                      )}
                    >
                      <User className="h-3 w-3" />
                      Select Contact
                    </Button>
                  </div>
                  <Input
                    id="whatsappNumber"
                    placeholder="+260123456789"
                    value={formData.whatsappNumber}
                    onChange={(e) => handleWhatsAppChange(e.target.value)}
                    required
                    className={cn(inputClass, "h-11")}
                  />
                  <p className={cn("text-[10px] font-bold uppercase tracking-widest mt-2 px-1", isLight ? "text-green-700" : "text-green-200/70")}>
                    Number will automatically include +260 prefix
                  </p>
                </div>
              )}

              <div>
                <Label htmlFor="details" className={labelClass}>
                  Additional Details
                </Label>
                <Textarea
                  id="details"
                  placeholder="Notes about this transaction..."
                  value={formData.details}
                  onChange={(e) => setFormData(prev => ({ ...prev, details: e.target.value }))}
                  rows={3}
                  className={cn(inputClass, "min-h-[100px] py-3")}
                />
              </div>

              {/* Clean Action Buttons */}
              <div className={cn("flex justify-end gap-3 pt-6 border-t mt-6", isLight ? "border-slate-200" : "border-white/10")}>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    clearPersistedData();
                    onCancel();
                  }}
                  disabled={isSubmitting}
                  className={cn(
                    "px-6 h-12 rounded-xl transition-all font-bold",
                    isLight
                      ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      : "border-white/10 bg-white/5 text-white hover:bg-white/10"
                  )}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className={cn(
                    "px-8 h-12 rounded-xl font-black uppercase tracking-widest transition-all duration-300 shadow-xl hover:scale-[1.02] active:scale-[0.98]",
                    type === 'cash-in'
                      ? isLight
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white border border-green-400/30'
                        : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white border border-green-400/30'
                      : isLight
                        ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white border border-red-400/30'
                        : 'bg-gradient-to-r from-red-500 to-rose-600 text-white border border-red-400/30'
                  )}
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Processing...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {type === 'cash-in' ? (
                        <TrendingUp className="w-5 h-5" />
                      ) : (
                        <TrendingDown className="w-5 h-5" />
                      )}
                      <span>{isEditMode ? 'Update' : (type === 'cash-in' ? 'Save Income' : 'Save Expense')}</span>
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </div>
        );
      })()}
      </Card>

      {/* Custom Contact Picker Dialog */}
      <Dialog open={showContactPickerModal} onOpenChange={setShowContactPickerModal}>
        <DialogContent className={cn("glass-modal max-w-md w-[92vw] rounded-2xl overflow-hidden p-0 border border-white/10", isLight ? "bg-white text-slate-900 border-slate-200" : "bg-slate-950/90 text-white backdrop-blur-xl")}>
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-lg font-bold">Select Contact</h3>
            <button
              onClick={() => setShowContactPickerModal(false)}
              className="p-1 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="p-4 space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search name or phone..."
                value={contactSearchTerm}
                onChange={(e) => setContactSearchTerm(e.target.value)}
                className={cn("pl-10 h-10", isLight ? "bg-slate-100 border-slate-200" : "bg-white/5 border-white/10 text-white")}
              />
            </div>

            {/* Device Import Button as first option */}
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowContactPickerModal(false);
                handleContactPick();
              }}
              className={cn("w-full h-11 justify-start gap-3 rounded-xl border font-bold text-xs transition-all", isLight ? "bg-slate-50 border-slate-200 hover:bg-slate-100" : "bg-white/5 border-white/10 hover:bg-white/10 text-white")}
            >
              <Phone className="w-4 h-4 text-blue-400" />
              Import from Device Contacts
            </Button>

            {/* Contacts Scroll Container */}
            <div 
              onScroll={handleContactListScroll}
              className="max-h-[300px] overflow-y-auto pr-1 space-y-2 custom-scrollbar touch-pan-y"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {visibleContacts.length > 0 ? (
                visibleContacts.map((contact, i) => (
                  <button
                    key={`${contact.name}-${contact.phone}-${i}`}
                    type="button"
                    onClick={() => selectContact(contact.name, contact.phone)}
                    className={cn(
                      "w-full text-left p-3 rounded-xl border flex items-center justify-between transition-all duration-150 hover:scale-[0.99] active:scale-[0.97]",
                      isLight 
                        ? "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-900" 
                        : "bg-white/5 border-white/5 hover:bg-white/10 text-white"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-md">
                        {contact.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-sm truncate max-w-[180px]">{contact.name}</div>
                        <div className="text-xs text-slate-400 font-mono">{contact.phone}</div>
                      </div>
                    </div>
                    
                    <div className="text-[10px] text-slate-400 text-right uppercase tracking-wider font-semibold">
                      Last: {format(new Date(contact.lastVisit), 'MMM d')}
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500 space-y-2">
                  <User className="w-10 h-10 mx-auto opacity-30 animate-pulse" />
                  <p className="text-sm font-medium">No contacts found</p>
                </div>
              )}
            </div>
            
            {filteredContacts.length > visibleContactsCount && (
              <div className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Showing {visibleContactsCount} of {filteredContacts.length} contacts
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
