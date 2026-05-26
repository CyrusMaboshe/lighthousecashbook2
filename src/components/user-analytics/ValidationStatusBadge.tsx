import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import { ValidationResult, formatValidationMessage } from '@/utils/userAnalyticsValidation';

interface ValidationStatusBadgeProps {
  validation: ValidationResult;
  showDetails?: boolean;
  className?: string;
}

export function ValidationStatusBadge({ 
  validation, 
  showDetails = false, 
  className = "" 
}: ValidationStatusBadgeProps) {
  if (validation.isValid) {
    return (
      <Badge 
        variant="outline" 
        className={`border-green-200 bg-green-50 text-green-800 ${className}`}
      >
        <CheckCircle className="w-3 h-3 mr-1" />
        {showDetails ? formatValidationMessage(validation) : 'Revenue = Cash-In ✓'}
      </Badge>
    );
  } else {
    return (
      <Badge 
        variant="outline" 
        className={`border-red-200 bg-red-50 text-red-800 ${className}`}
      >
        <AlertTriangle className="w-3 h-3 mr-1" />
        {showDetails ? formatValidationMessage(validation) : 'Validation Error ⚠️'}
      </Badge>
    );
  }
}

interface ValidationSummaryProps {
  validation: ValidationResult;
  title?: string;
}

export function ValidationSummary({ validation, title = "Data Integrity Check" }: ValidationSummaryProps) {
  return (
    <div className="p-3 rounded-lg border bg-slate-50">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-slate-700">{title}</h4>
        <ValidationStatusBadge validation={validation} />
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-xs text-slate-600">
        <div>
          <span className="font-medium">Total Revenue:</span>
          <div className="text-slate-900">ZMW {validation.totalRevenue.toFixed(2)}</div>
        </div>
        <div>
          <span className="font-medium">Total Cash-In:</span>
          <div className="text-slate-900">ZMW {validation.totalCashIn.toFixed(2)}</div>
        </div>
      </div>
      
      {!validation.isValid && (
        <div className="mt-2 text-xs text-red-600">
          <span className="font-medium">Difference:</span> ZMW {validation.difference.toFixed(2)}
        </div>
      )}
    </div>
  );
}
