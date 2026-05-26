import React from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  className?: string;
}

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

interface ResponsiveGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4 | 5 | 6;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

interface ResponsiveCardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  hover?: boolean;
}

interface ResponsiveFlexProps {
  children: React.ReactNode;
  direction?: 'row' | 'column';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  align?: 'start' | 'center' | 'end' | 'stretch';
  wrap?: boolean;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Main responsive layout wrapper
export function ResponsiveLayout({ children, className }: ResponsiveLayoutProps) {
  return (
    <div className={cn('responsive-container', className)}>
      {children}
    </div>
  );
}

// Responsive container with max-width constraints
export function ResponsiveContainer({ 
  children, 
  className, 
  maxWidth = 'full' 
}: ResponsiveContainerProps) {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md', 
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full'
  };

  return (
    <div className={cn(
      'responsive-container',
      maxWidthClasses[maxWidth],
      className
    )}>
      {children}
    </div>
  );
}

// Responsive grid system
export function ResponsiveGrid({ 
  children, 
  columns = 2, 
  gap = 'md',
  className 
}: ResponsiveGridProps) {
  const gridClasses = {
    1: 'responsive-grid grid-cols-1',
    2: 'responsive-grid responsive-grid-2',
    3: 'responsive-grid responsive-grid-3', 
    4: 'responsive-grid responsive-grid-4',
    5: 'responsive-grid responsive-grid-5',
    6: 'responsive-grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6'
  };

  const gapClasses = {
    sm: 'gap-2 sm:gap-3',
    md: 'gap-3 sm:gap-4',
    lg: 'gap-4 sm:gap-6'
  };

  return (
    <div className={cn(
      gridClasses[columns],
      gapClasses[gap],
      className
    )}>
      {children}
    </div>
  );
}

// Responsive card component
export function ResponsiveCard({ 
  children, 
  className, 
  padding = 'md',
  hover = false 
}: ResponsiveCardProps) {
  const paddingClasses = {
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8'
  };

  return (
    <div className={cn(
      'responsive-card',
      paddingClasses[padding],
      hover && 'hover:shadow-md transition-shadow duration-200',
      className
    )}>
      {children}
    </div>
  );
}

// Responsive flex container
export function ResponsiveFlex({
  children,
  direction = 'row',
  justify = 'start',
  align = 'center',
  wrap = true,
  gap = 'md',
  className
}: ResponsiveFlexProps) {
  const directionClasses = {
    row: 'flex-row',
    column: 'flex-col'
  };

  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center', 
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly'
  };

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end', 
    stretch: 'items-stretch'
  };

  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-3 sm:gap-4',
    lg: 'gap-4 sm:gap-6'
  };

  return (
    <div className={cn(
      'flex',
      directionClasses[direction],
      justifyClasses[justify],
      alignClasses[align],
      wrap && 'flex-wrap',
      gapClasses[gap],
      className
    )}>
      {children}
    </div>
  );
}

// Responsive table wrapper
export function ResponsiveTable({ children, className }: ResponsiveLayoutProps) {
  return (
    <div className={cn('responsive-table', className)}>
      {children}
    </div>
  );
}

// Responsive button component
interface ResponsiveButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export function ResponsiveButton({
  children,
  variant = 'primary',
  size = 'md',
  className,
  onClick,
  disabled = false,
  type = 'button'
}: ResponsiveButtonProps) {
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-blue-500',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500'
  };

  const sizeClasses = {
    sm: 'text-sm px-3 py-1.5 min-h-[2rem]',
    md: 'text-base px-4 py-2 min-h-[2.5rem]',
    lg: 'text-lg px-6 py-3 min-h-[3rem]'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'responsive-button',
        'font-medium rounded-md transition-colors duration-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {children}
    </button>
  );
}

// Responsive input component
interface ResponsiveInputProps {
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  className?: string;
  disabled?: boolean;
}

export function ResponsiveInput({
  placeholder,
  value,
  onChange,
  type = 'text',
  className,
  disabled = false
}: ResponsiveInputProps) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={cn(
        'responsive-input',
        'border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
        'disabled:bg-gray-100 disabled:cursor-not-allowed',
        'transition-colors duration-200',
        className
      )}
    />
  );
}
