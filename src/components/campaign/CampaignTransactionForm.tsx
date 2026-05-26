// Campaign Transaction Form - EXACT REPLICA of existing TransactionForm
// This replicates the exact form structure, validation, and styling

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMultiTenantAuth } from '@/hooks/useSeparateMultiTenantAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

import { Calendar, Clock, DollarSign, User, Camera, Phone, FileText } from 'lucide-react';

interface CampaignTransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  transactionType: 'cash-in' | 'cash-out';
  editingTransaction?: any;
  categories: string[];
  campaignId: string;
}

export function CampaignTransactionForm({
  isOpen,
  onClose,
  onSuccess,
  transactionType,
  editingTransaction,
  categories,
  campaignId
}: CampaignTransactionFormProps) {
  const { currentUser } = useMultiTenantAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);


  // Form state - EXACT same fields as existing system
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    type: transactionType,
    category_name: '',
    amount: '',
    customer_name: '',
    number_of_pictures: '0',
    whatsapp_number: '',
    details: ''
  });

  // Reset form when dialog opens/closes or editing transaction changes
  useEffect(() => {
    if (editingTransaction) {
      setFormData({
        date: editingTransaction.date,
        time: editingTransaction.time || new Date().toTimeString().slice(0, 5),
        type: editingTransaction.type,
        category_name: editingTransaction.category_name,
        amount: editingTransaction.amount.toString(),
        customer_name: editingTransaction.customer_name,
        number_of_pictures: editingTransaction.number_of_pictures.toString(),
        whatsapp_number: editingTransaction.whatsapp_number || '',
        details: editingTransaction.details || ''
      });
    } else {
      setFormData({
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5),
        type: transactionType,
        category_name: '',
        amount: '',
        customer_name: '',
        number_of_pictures: '0',
        whatsapp_number: '',
        details: ''
      });
    }
  }, [editingTransaction, transactionType, isOpen]);



  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.category_name) {
      toast({
        title: "Validation Error",
        description: "Please select a category.",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid amount greater than 0.",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.customer_name.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a customer name.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    if (!currentUser) {
      toast({
        title: "Error",
        description: "You must be logged in to add transactions.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const transactionData = {
        campaign_id: campaignId,
        date: formData.date,
        time: formData.time,
        type: formData.type,
        category_name: formData.category_name,
        amount: parseFloat(formData.amount),
        customer_name: formData.customer_name.trim(),
        number_of_pictures: parseInt(formData.number_of_pictures) || 0,
        whatsapp_number: formData.whatsapp_number.trim(),
        details: formData.details.trim(),
        added_by: currentUser.username || currentUser.email,
        added_by_user_id: currentUser.id
      };

      if (editingTransaction) {
        // Update existing transaction (still use direct Supabase for updates)
        const result = await supabase
          .from('campaign_transactions')
          .update({
            ...transactionData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingTransaction.id)
          .eq('campaign_id', campaignId);

        if (result.error) {
          console.error('❌ Error updating transaction:', result.error);
          toast({
            title: "Error",
            description: "Failed to update transaction. Please try again.",
            variant: "destructive",
          });
          return;
        }
      } else {
        // Create new transaction directly with Supabase
        const result = await supabase
          .from('campaign_transactions')
          .insert([transactionData])
          .select()
          .single();

        if (result.error) {
          console.error('❌ Error creating transaction:', result.error);
          toast({
            title: "Error",
            description: "Failed to create transaction. Please try again.",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Success!",
          description: `${transactionType === 'cash-in' ? 'Cash-in' : 'Cash-out'} transaction recorded successfully.`,
        });
      }

      // Log the action
      await supabase
        .from('campaign_admin_logs')
        .insert([{
          campaign_id: campaignId,
          user_id: currentUser.id,
          username: currentUser.username || currentUser.email,
          action: editingTransaction ? 'Transaction Updated' : 'Transaction Created',
          details: {
            transaction_type: formData.type,
            amount: parseFloat(formData.amount),
            customer: formData.customer_name,
            category: formData.category_name
          }
        }]);

      toast({
        title: "Success",
        description: `Transaction ${editingTransaction ? 'updated' : 'created'} successfully!`,
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('❌ Error in handleSubmit:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              {editingTransaction ? 'Edit Transaction' : `Add ${transactionType === 'cash-in' ? 'Cash In' : 'Cash Out'} Transaction`}
            </div>

          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date and Time Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="time" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Time
              </Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => handleInputChange('time', e.target.value)}
                required
              />
            </div>
          </div>

          {/* Category and Amount Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category_name} onValueChange={(value) => handleInputChange('category_name', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="amount" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Amount (ZMW)
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
                required
              />
            </div>
          </div>

          {/* Customer Name and Pictures Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customer_name" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Customer Name
              </Label>
              <Input
                id="customer_name"
                placeholder="Enter customer name"
                value={formData.customer_name}
                onChange={(e) => handleInputChange('customer_name', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="number_of_pictures" className="flex items-center gap-2">
                <Camera className="h-4 w-4" />
                Number of Pictures
              </Label>
              <Input
                id="number_of_pictures"
                type="number"
                min="0"
                placeholder="0"
                value={formData.number_of_pictures}
                onChange={(e) => handleInputChange('number_of_pictures', e.target.value)}
              />
            </div>
          </div>

          {/* WhatsApp Number */}
          <div>
            <Label htmlFor="whatsapp_number" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              WhatsApp Number (Optional)
            </Label>
            <Input
              id="whatsapp_number"
              placeholder="e.g., +260 97 123 4567"
              value={formData.whatsapp_number}
              onChange={(e) => handleInputChange('whatsapp_number', e.target.value)}
            />
          </div>

          {/* Details */}
          <div>
            <Label htmlFor="details" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Details (Optional)
            </Label>
            <Textarea
              id="details"
              placeholder="Additional details about this transaction..."
              value={formData.details}
              onChange={(e) => handleInputChange('details', e.target.value)}
              rows={3}
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {/* Offline functionality temporarily disabled */}
                  {editingTransaction ? 'Update Transaction' : 'Add Transaction'}
                </div>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
