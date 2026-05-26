import React from 'react';
import { cn } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';

interface GlassViewWrapperProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  onBack?: () => void;
}

export function GlassViewWrapper({ children, title, subtitle, className, onBack }: GlassViewWrapperProps) {
  return (
    <div className={cn("space-y-4 glass-view-override", className)}>
      {(title || subtitle || onBack) && (
        <div className="mb-4 flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            {title && <h2 className="text-2xl font-bold text-white/90 tracking-tight">{title}</h2>}
            {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
          </div>
        </div>
      )}
      <div className="glass-view-content">
        {children}
      </div>
    </div>
  );
}
