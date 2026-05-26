/**
 * Company Branding Manager
 * Allows company admins to customize their dashboard branding in real-time
 * Supports logo upload, business type selection, and custom visual elements
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useMultiTenantAuth } from '@/hooks/useSeparateMultiTenantAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Upload,
  Camera,
  Palette,
  Save,
  RefreshCw,
  Image as ImageIcon,
  Building2,
  Briefcase,
  ShoppingBag,
  Utensils,
  Car,
  Home,
  Heart,
  Scissors,
  Wrench,
  GraduationCap,
  Stethoscope,
  Scale,
  Truck,
  Shirt,
  Coffee
} from 'lucide-react';

interface CompanyBranding {
  logo_url?: string;
  business_type: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  business_icon: string;
  custom_header_text?: string;
  show_business_metrics: boolean;
  metric_name: string;
  metric_icon: string;
}

const BUSINESS_TYPES = [
  { value: 'photography', label: 'Photography Studio', icon: Camera, color: '#8B5CF6' },
  { value: 'retail', label: 'Retail Store', icon: ShoppingBag, color: '#10B981' },
  { value: 'restaurant', label: 'Restaurant/Food', icon: Utensils, color: '#F59E0B' },
  { value: 'automotive', label: 'Automotive', icon: Car, color: '#EF4444' },
  { value: 'real_estate', label: 'Real Estate', icon: Home, color: '#3B82F6' },
  { value: 'healthcare', label: 'Healthcare', icon: Heart, color: '#EC4899' },
  { value: 'salon', label: 'Salon/Beauty', icon: Scissors, color: '#F97316' },
  { value: 'construction', label: 'Construction', icon: Wrench, color: '#6B7280' },
  { value: 'education', label: 'Education', icon: GraduationCap, color: '#8B5CF6' },
  { value: 'medical', label: 'Medical Practice', icon: Stethoscope, color: '#06B6D4' },
  { value: 'legal', label: 'Legal Services', icon: Scale, color: '#1F2937' },
  { value: 'logistics', label: 'Logistics/Transport', icon: Truck, color: '#059669' },
  { value: 'fashion', label: 'Fashion/Clothing', icon: Shirt, color: '#DB2777' },
  { value: 'cafe', label: 'Cafe/Coffee Shop', icon: Coffee, color: '#92400E' },
  { value: 'general', label: 'General Business', icon: Briefcase, color: '#374151' }
];

const METRIC_OPTIONS = [
  { value: 'pictures', label: 'Pictures', icon: Camera },
  { value: 'products', label: 'Products', icon: ShoppingBag },
  { value: 'orders', label: 'Orders', icon: Briefcase },
  { value: 'customers', label: 'Customers', icon: Heart },
  { value: 'services', label: 'Services', icon: Wrench },
  { value: 'appointments', label: 'Appointments', icon: Stethoscope },
  { value: 'deliveries', label: 'Deliveries', icon: Truck },
  { value: 'items', label: 'Items', icon: Building2 }
];

export function CompanyBrandingManager() {
  const { currentCompany, currentUser, refreshCompanyData } = useMultiTenantAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  
  const [branding, setBranding] = useState<CompanyBranding>({
    business_type: 'photography',
    primary_color: '#3B82F6',
    secondary_color: '#8B5CF6',
    accent_color: '#10B981',
    business_icon: 'Camera',
    show_business_metrics: true,
    metric_name: 'pictures',
    metric_icon: 'Camera'
  });

  // Load current company branding
  const loadCompanyBranding = async () => {
    if (!currentCompany?.id) return;

    try {
      setLoading(true);
      console.log('🎨 Loading company branding for:', currentCompany.display_name);

      const { data, error } = await supabase
        .from('mt_companies')
        .select('logo_url, settings')
        .eq('id', currentCompany.id)
        .single();

      if (error) {
        console.error('Error loading company branding:', error);
        return;
      }

      if (data) {
        const settings = data.settings || {};
        setBranding({
          logo_url: data.logo_url,
          business_type: settings.business_type || 'photography',
          primary_color: settings.primary_color || '#3B82F6',
          secondary_color: settings.secondary_color || '#8B5CF6',
          accent_color: settings.accent_color || '#10B981',
          business_icon: settings.business_icon || 'Camera',
          custom_header_text: settings.custom_header_text,
          show_business_metrics: settings.show_business_metrics !== false,
          metric_name: settings.metric_name || 'pictures',
          metric_icon: settings.metric_icon || 'Camera'
        });

        if (data.logo_url) {
          setLogoPreview(data.logo_url);
        }
      }
    } catch (error) {
      console.error('Error loading company branding:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle logo file selection
  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload logo to Supabase storage - Enhanced with better error handling
  const uploadLogo = async (file: File): Promise<string | null> => {
    try {
      console.log('📤 Starting logo upload for file:', file.name, 'Size:', file.size);

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Logo file must be smaller than 5MB.",
          variant: "destructive",
        });
        return null;
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please upload a valid image file (JPEG, PNG, GIF, WebP, or SVG).",
          variant: "destructive",
        });
        return null;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `company-${currentCompany.id}-logo-${Date.now()}.${fileExt}`;

      console.log('📤 Uploading to storage with filename:', fileName);

      const { data, error } = await supabase.storage
        .from('company-logos')
        .upload(fileName, file, {
          upsert: true,
          contentType: file.type
        });

      if (error) {
        console.error('❌ Logo upload error:', error);

        // Try to create the bucket if it doesn't exist
        if (error.message.includes('Bucket not found')) {
          console.log('🪣 Attempting to create company-logos bucket...');

          const { error: bucketError } = await supabase.storage.createBucket('company-logos', {
            public: true,
            fileSizeLimit: 5242880, // 5MB
            allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
          });

          if (bucketError) {
            console.error('❌ Failed to create bucket:', bucketError);
          } else {
            console.log('✅ Bucket created, retrying upload...');
            // Retry upload
            const { data: retryData, error: retryError } = await supabase.storage
              .from('company-logos')
              .upload(fileName, file, {
                upsert: true,
                contentType: file.type
              });

            if (retryError) {
              console.error('❌ Retry upload failed:', retryError);
              throw retryError;
            }

            const { data: urlData } = supabase.storage
              .from('company-logos')
              .getPublicUrl(fileName);

            console.log('✅ Logo uploaded successfully (retry):', urlData.publicUrl);
            return urlData.publicUrl;
          }
        }

        // If storage fails, use base64 as fallback
        console.log('📝 Using base64 fallback for logo storage');
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            const base64Result = reader.result as string;
            console.log('✅ Base64 conversion complete');
            resolve(base64Result);
          };
          reader.onerror = () => {
            console.error('❌ Base64 conversion failed');
            resolve(null);
          };
          reader.readAsDataURL(file);
        });
      }

      const { data: urlData } = supabase.storage
        .from('company-logos')
        .getPublicUrl(fileName);

      console.log('✅ Logo uploaded successfully:', urlData.publicUrl);
      return urlData.publicUrl;
    } catch (error) {
      console.error('❌ Logo upload failed:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload logo. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  };

  // Save branding settings
  const saveBrandingSettings = async () => {
    if (!currentCompany?.id) return;

    try {
      setSaving(true);
      console.log('💾 Saving company branding settings...');

      let logoUrl = branding.logo_url;

      // Upload new logo if selected
      if (logoFile) {
        const uploadedUrl = await uploadLogo(logoFile);
        if (uploadedUrl) {
          logoUrl = uploadedUrl;
        }
      }

      // Update company settings
      const updatedSettings = {
        ...currentCompany.settings,
        business_type: branding.business_type,
        primary_color: branding.primary_color,
        secondary_color: branding.secondary_color,
        accent_color: branding.accent_color,
        business_icon: branding.business_icon,
        custom_header_text: branding.custom_header_text,
        show_business_metrics: branding.show_business_metrics,
        metric_name: branding.metric_name,
        metric_icon: branding.metric_icon
      };

      console.log('💾 Updating database with logo URL:', logoUrl);
      console.log('💾 Updating database with settings:', updatedSettings);

      const { data: updateData, error } = await supabase
        .from('mt_companies')
        .update({
          logo_url: logoUrl,
          settings: updatedSettings,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentCompany.id)
        .select();

      if (error) {
        console.error('❌ Database update error:', error);
        throw error;
      }

      console.log('✅ Database updated successfully:', updateData);

      // Note: The separate multi-tenant auth doesn't have updateCompanySettings
      // The database update above is sufficient for now

      // Update the branding state to reflect saved changes
      setBranding(prev => ({
        ...prev,
        logo_url: logoUrl
      }));

      // Clear the logo file since it's been uploaded
      setLogoFile(null);

      console.log('✅ Company branding updated successfully');
      console.log('Updated settings:', updatedSettings);

      // Refresh company data to reflect changes immediately
      await refreshCompanyData();

      toast({
        title: "Branding Updated!",
        description: "Your company branding has been saved successfully. Changes are now visible.",
      });

    } catch (error) {
      console.error('Error saving branding settings:', error);
      toast({
        title: "Error",
        description: "Failed to save branding settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Load branding on component mount
  useEffect(() => {
    if (currentCompany?.id) {
      loadCompanyBranding();
    }
  }, [currentCompany?.id]);

  const selectedBusinessType = BUSINESS_TYPES.find(bt => bt.value === branding.business_type);
  const selectedMetric = METRIC_OPTIONS.find(m => m.value === branding.metric_name);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Company Branding</h1>
          <p className="text-gray-600">
            Customize your dashboard appearance and business branding
          </p>
        </div>
        <Button
          onClick={loadCompanyBranding}
          variant="outline"
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Logo Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Company Logo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="max-h-28 max-w-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-4 text-gray-500" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> company logo
                    </p>
                  </div>
                )}
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleLogoChange}
                />
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Business Type */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Business Type
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="business-type">Select Your Business Type</Label>
              <Select
                value={branding.business_type}
                onValueChange={(value) => setBranding(prev => ({ ...prev, business_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose business type" />
                </SelectTrigger>
                <SelectContent>
                  {BUSINESS_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <type.icon className="h-4 w-4" style={{ color: type.color }} />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedBusinessType && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <selectedBusinessType.icon className="h-4 w-4" style={{ color: selectedBusinessType.color }} />
                  Selected: {selectedBusinessType.label}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Color Customization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Color Theme
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="primary-color">Primary Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={branding.primary_color}
                    onChange={(e) => setBranding(prev => ({ ...prev, primary_color: e.target.value }))}
                    className="w-12 h-8 rounded border"
                  />
                  <Input
                    value={branding.primary_color}
                    onChange={(e) => setBranding(prev => ({ ...prev, primary_color: e.target.value }))}
                    placeholder="#3B82F6"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="secondary-color">Secondary Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={branding.secondary_color}
                    onChange={(e) => setBranding(prev => ({ ...prev, secondary_color: e.target.value }))}
                    className="w-12 h-8 rounded border"
                  />
                  <Input
                    value={branding.secondary_color}
                    onChange={(e) => setBranding(prev => ({ ...prev, secondary_color: e.target.value }))}
                    placeholder="#8B5CF6"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Business Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Business Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="metric-name">What do you track?</Label>
              <Select
                value={branding.metric_name}
                onValueChange={(value) => setBranding(prev => ({ ...prev, metric_name: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose what you track" />
                </SelectTrigger>
                <SelectContent>
                  {METRIC_OPTIONS.map((metric) => (
                    <SelectItem key={metric.value} value={metric.value}>
                      <div className="flex items-center gap-2">
                        <metric.icon className="h-4 w-4" />
                        {metric.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="custom-header">Custom Header Text (Optional)</Label>
              <Input
                value={branding.custom_header_text || ''}
                onChange={(e) => setBranding(prev => ({ ...prev, custom_header_text: e.target.value }))}
                placeholder="e.g., 'Professional Photography Services'"
              />
            </div>

            {selectedMetric && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <selectedMetric.icon className="h-4 w-4" />
                  Your dashboard will show: Total {selectedMetric.label}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={saveBrandingSettings}
          disabled={saving}
          className="flex items-center gap-2"
        >
          {saving ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? 'Saving...' : 'Save Branding Settings'}
        </Button>
      </div>
    </div>
  );
}
