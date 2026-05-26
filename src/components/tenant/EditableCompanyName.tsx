import React, { useState } from 'react';
import { Pencil, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useMultiTenantAuth } from '@/hooks/useSeparateMultiTenantAuth';
import { useToast } from '@/hooks/use-toast';

interface EditableCompanyNameProps {
  className?: string;
  textClassName?: string;
  allowEdit?: boolean;
}

export function EditableCompanyName({
  className = '',
  textClassName = 'text-2xl font-bold',
  allowEdit = true,
}: EditableCompanyNameProps) {
  const { currentCompany, refreshCompanyData, isCompanyAdmin, isSuperAdmin } = useMultiTenantAuth();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(currentCompany?.display_name || '');
  const [saving, setSaving] = useState(false);

  const canEdit = allowEdit && (isCompanyAdmin() || isSuperAdmin());

  const save = async () => {
    if (!currentCompany?.id || !value.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('mt_companies')
        .update({ display_name: value.trim() })
        .eq('id', currentCompany.id);
      if (error) throw error;
      await refreshCompanyData();
      toast({ title: 'Company name updated', description: `Now showing as "${value.trim()}"` });
      setEditing(false);
    } catch (e: any) {
      toast({ title: 'Update failed', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="h-9 max-w-xs"
          autoFocus
        />
        <Button size="sm" onClick={save} disabled={saving}>
          <Check className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setValue(currentCompany?.display_name || ''); }}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 group ${className}`}>
      <span className={textClassName}>{currentCompany?.display_name || 'Company'}</span>
      {canEdit && (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => { setValue(currentCompany?.display_name || ''); setEditing(true); }}
          className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 p-0"
          title="Edit company name"
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
