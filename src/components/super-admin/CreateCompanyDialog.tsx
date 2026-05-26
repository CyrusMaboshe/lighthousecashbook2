// Create Company Dialog - Form for creating new companies
// This component provides a comprehensive form for super admins to create new companies

import React, { useState } from 'react';
import { Building2, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useMultiTenantAuth } from '@/hooks/useMultiTenantAuth';
import { Company, CompanySettings } from '@/types/multiTenant';
import { useToast } from '@/hooks/use-toast';

interface CreateCompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompanyCreated: (company: Company) => void;
}

interface FormData {
  name: string;
  display_name: string;
  description: string;
  settings: CompanySettings;
}

export function CreateCompanyDialog({ open, onOpenChange, onCompanyCreated }: CreateCompanyDialogProps) {
  const { createCompany } = useMultiTenantAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    display_name: '',
    description: '',
    settings: {
      show_full_balance_to_users: false,
      current_visible_month: new Date().getMonth(),
      current_visible_year: new Date().getFullYear(),
      allow_user_transaction_creation: true,
      allow_user_transaction_editing: false,
      require_receipt_printing: false
    }
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate company name (used for URL/API)
    if (!formData.name.trim()) {
      newErrors.name = 'Company name is required';
    } else if (!/^[a-zA-Z0-9_-]{3,50}$/.test(formData.name)) {
      newErrors.name = 'Company name must be 3-50 characters and contain only letters, numbers, hyphens, and underscores';
    }

    // Validate display name
    if (!formData.display_name.trim()) {
      newErrors.display_name = 'Display name is required';
    } else if (formData.display_name.length < 2 || formData.display_name.length > 100) {
      newErrors.display_name = 'Display name must be 2-100 characters';
    }

    // Validate description (optional but if provided, check length)
    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);

      const company = await createCompany({
        name: formData.name.toLowerCase().replace(/\s+/g, '-'),
        display_name: formData.display_name,
        description: formData.description || undefined,
        settings: formData.settings
      });

      toast({
        title: "Company Created",
        description: `${company.display_name} has been successfully created.`,
      });

      onCompanyCreated(company);
      handleClose();

    } catch (error) {
      console.error('Error creating company:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create company",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      display_name: '',
      description: '',
      settings: {
        show_full_balance_to_users: false,
        current_visible_month: new Date().getMonth(),
        current_visible_year: new Date().getFullYear(),
        allow_user_transaction_creation: true,
        allow_user_transaction_editing: false,
        require_receipt_printing: false
      }
    });
    setErrors({});
    onOpenChange(false);
  };

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const updateSettings = (setting: keyof CompanySettings, value: any) => {
    setFormData(prev => ({
      ...prev,
      settings: { ...prev.settings, [setting]: value }
    }));
  };

  // Auto-generate company name from display name
  const handleDisplayNameChange = (value: string) => {
    updateFormData('display_name', value);
    
    // Auto-generate name if it's empty or matches the previous display name
    const autoName = value.toLowerCase()
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
    
    if (!formData.name || formData.name === formData.display_name.toLowerCase().replace(/\s+/g, '-')) {
      updateFormData('name', autoName);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Create New Company
          </DialogTitle>
          <DialogDescription>
            Set up a new company with its own users, transactions, and settings.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
              <CardDescription>
                Company identification and display information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="display_name">Display Name *</Label>
                  <Input
                    id="display_name"
                    value={formData.display_name}
                    onChange={(e) => handleDisplayNameChange(e.target.value)}
                    placeholder="e.g., Acme Corporation"
                    className={errors.display_name ? 'border-red-500' : ''}
                  />
                  {errors.display_name && (
                    <p className="text-sm text-red-500">{errors.display_name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Company Name (URL) *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => updateFormData('name', e.target.value)}
                    placeholder="e.g., acme-corporation"
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500">{errors.name}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Used for URLs and API endpoints. Only letters, numbers, hyphens, and underscores.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => updateFormData('description', e.target.value)}
                  placeholder="Brief description of the company..."
                  rows={3}
                  className={errors.description ? 'border-red-500' : ''}
                />
                {errors.description && (
                  <p className="text-sm text-red-500">{errors.description}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Company Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Company Settings</CardTitle>
              <CardDescription>
                Configure default behavior and permissions for this company
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Show Full Balance to Users</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow regular users to see all transactions, not just their own
                    </p>
                  </div>
                  <Switch
                    checked={formData.settings.show_full_balance_to_users}
                    onCheckedChange={(checked) => updateSettings('show_full_balance_to_users', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Allow User Transaction Creation</Label>
                    <p className="text-sm text-muted-foreground">
                      Let regular users create new transactions
                    </p>
                  </div>
                  <Switch
                    checked={formData.settings.allow_user_transaction_creation}
                    onCheckedChange={(checked) => updateSettings('allow_user_transaction_creation', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Allow User Transaction Editing</Label>
                    <p className="text-sm text-muted-foreground">
                      Let regular users edit their own transactions
                    </p>
                  </div>
                  <Switch
                    checked={formData.settings.allow_user_transaction_editing}
                    onCheckedChange={(checked) => updateSettings('allow_user_transaction_editing', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Require Receipt Printing</Label>
                    <p className="text-sm text-muted-foreground">
                      Mandate receipt printing for all transactions
                    </p>
                  </div>
                  <Switch
                    checked={formData.settings.require_receipt_printing}
                    onCheckedChange={(checked) => updateSettings('require_receipt_printing', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Company
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
