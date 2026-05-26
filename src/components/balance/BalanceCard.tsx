
import React from 'react';
import { LucideIcon } from 'lucide-react';
import { AnimatedNumber } from '@/components/AnimatedNumber';
import { cn } from '@/lib/utils';

interface BalanceCardProps {
  title: string;
  subtitle?: string;
  amount: number;
  icon: LucideIcon;
  gradientColors?: string;
  borderColors?: string;
  textColors?: string;
  description: string;
  showingRestrictedData: boolean;
  formatCurrency: (amount: number) => string;
}

export function BalanceCard({
  title,
  subtitle,
  amount,
  icon: Icon,
  description,
  showingRestrictedData,
}: BalanceCardProps) {
  const isPictures = title === 'Total Pictures';
  
  const iconColor = title.includes('In') ? 'text-success' : title.includes('Out') ? 'text-danger' : title.includes('Net') ? 'text-primary' : 'text-info';
  const iconBg = title.includes('In') ? 'bg-success/10' : title.includes('Out') ? 'bg-danger/10' : title.includes('Net') ? 'bg-primary/10' : 'bg-info/10';

  return (
    <div className="bg-card shadow-premium border border-border rounded-premium p-6 transition-all duration-300 hover:translate-y-[-2px] hover:shadow-xl active:scale-[0.98] cursor-default group">
      <div className="space-y-4">
        <div className={cn("inline-flex p-2.5 rounded-full transition-colors duration-300", iconBg)}>
          <Icon className={cn("w-5 h-5", iconColor)} />
        </div>
        
        <div className="space-y-1">
          <p className="text-14px font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <div className="flex items-baseline gap-2">
            <h2 className="text-28px font-bold text-foreground tracking-tight">
              {showingRestrictedData ? (
                "••••••"
              ) : (
                <AnimatedNumber 
                  value={amount} 
                  decimals={isPictures ? 0 : 2} 
                />
              )}
            </h2>
            {subtitle && !showingRestrictedData && (
              <span className="text-14px font-semibold text-secondary-foreground">{subtitle}</span>
            )}
          </div>
          {!showingRestrictedData && description && (
            <p className="text-12px text-muted-foreground/60">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
}
