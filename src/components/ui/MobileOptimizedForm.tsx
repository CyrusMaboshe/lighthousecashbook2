import React, { forwardRef, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useDeviceInfo } from '@/hooks/use-mobile';

interface MobileOptimizedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  preventZoom?: boolean;
}

export const MobileOptimizedInput = forwardRef<HTMLInputElement, MobileOptimizedInputProps>(
  ({ className, label, error, icon, preventZoom = true, type = 'text', ...props }, ref) => {
    const { isMobile } = useDeviceInfo();
    
    // Prevent zoom on iOS by ensuring font-size is at least 16px
    const inputStyle = preventZoom && isMobile ? { fontSize: 'max(16px, 1rem)' } : {};

    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              {icon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              "w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm",
              "focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
              "transition-all duration-200",
              "placeholder-gray-400",
              icon && "pl-10",
              error && "border-red-500 focus:ring-red-500 focus:border-red-500",
              isMobile && "min-h-[44px] text-base", // Better touch targets on mobile
              className
            )}
            style={inputStyle}
            ref={ref}
            {...props}
          />
        </div>
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }
);

MobileOptimizedInput.displayName = 'MobileOptimizedInput';

interface MobileOptimizedSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const MobileOptimizedSelect = forwardRef<HTMLSelectElement, MobileOptimizedSelectProps>(
  ({ className, label, error, options, ...props }, ref) => {
    const { isMobile } = useDeviceInfo();

    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <select
          className={cn(
            "w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm",
            "focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
            "transition-all duration-200",
            "bg-white appearance-none",
            error && "border-red-500 focus:ring-red-500 focus:border-red-500",
            isMobile && "min-h-[44px] text-base", // Better touch targets on mobile
            className
          )}
          style={isMobile ? { fontSize: 'max(16px, 1rem)' } : {}}
          ref={ref}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }
);

MobileOptimizedSelect.displayName = 'MobileOptimizedSelect';

interface MobileOptimizedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const MobileOptimizedButton = forwardRef<HTMLButtonElement, MobileOptimizedButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, icon, children, ...props }, ref) => {
    const { isMobile } = useDeviceInfo();

    const variants = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
      secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
      outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500',
      ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500'
    };

    const sizes = {
      sm: isMobile ? 'px-3 py-2 text-sm min-h-[40px]' : 'px-3 py-2 text-sm',
      md: isMobile ? 'px-4 py-3 text-base min-h-[44px]' : 'px-4 py-2 text-sm',
      lg: isMobile ? 'px-6 py-4 text-lg min-h-[48px]' : 'px-6 py-3 text-base'
    };

    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-medium",
          "focus:outline-none focus:ring-2 focus:ring-offset-2",
          "transition-all duration-200",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "touch-manipulation", // Improves touch responsiveness
          variants[variant],
          sizes[size],
          loading && "cursor-not-allowed",
          className
        )}
        disabled={loading || props.disabled}
        ref={ref}
        {...props}
      >
        {loading && (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
        )}
        {icon && !loading && (
          <span className="mr-2">{icon}</span>
        )}
        {children}
      </button>
    );
  }
);

MobileOptimizedButton.displayName = 'MobileOptimizedButton';

interface MobileOptimizedFormProps {
  children: React.ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
  className?: string;
}

export const MobileOptimizedForm: React.FC<MobileOptimizedFormProps> = ({
  children,
  onSubmit,
  className
}) => {
  const formRef = useRef<HTMLFormElement>(null);
  const { isMobile } = useDeviceInfo();

  useEffect(() => {
    if (!isMobile || !formRef.current) return;

    // Prevent viewport zoom when focusing inputs on iOS
    const handleFocusIn = (e: FocusEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) {
        // Temporarily disable viewport scaling
        const viewport = document.querySelector('meta[name=viewport]');
        if (viewport) {
          const originalContent = viewport.getAttribute('content');
          viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
          
          // Restore original viewport after a delay
          setTimeout(() => {
            if (originalContent) {
              viewport.setAttribute('content', originalContent);
            }
          }, 500);
        }
      }
    };

    const form = formRef.current;
    form.addEventListener('focusin', handleFocusIn);

    return () => {
      form.removeEventListener('focusin', handleFocusIn);
    };
  }, [isMobile]);

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      className={cn(
        "space-y-4",
        isMobile && "space-y-6", // More spacing on mobile
        className
      )}
    >
      {children}
    </form>
  );
};

// Hook for managing form state with mobile optimizations
export function useMobileOptimizedForm<T extends Record<string, any>>(
  initialValues: T,
  onSubmit: (values: T) => void | Promise<void>
) {
  const [values, setValues] = React.useState<T>(initialValues);
  const [errors, setErrors] = React.useState<Partial<Record<keyof T, string>>>({});
  const [loading, setLoading] = React.useState(false);

  const setValue = React.useCallback((key: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [key]: value }));
    // Clear error when user starts typing
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: undefined }));
    }
  }, [errors]);

  const setError = React.useCallback((key: keyof T, error: string) => {
    setErrors(prev => ({ ...prev, [key]: error }));
  }, []);

  const handleSubmit = React.useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(values);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setLoading(false);
    }
  }, [values, onSubmit]);

  const reset = React.useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setLoading(false);
  }, [initialValues]);

  return {
    values,
    errors,
    loading,
    setValue,
    setError,
    handleSubmit,
    reset
  };
}
