import React, { memo, useMemo, useCallback, useRef } from 'react';
import { Transaction } from '@/hooks/useTransactions';
import { FilterOptions } from '@/pages/Index';
import { cn } from '@/lib/utils';

/**
* Optional: Horizontal scroll helpers for wide transaction lists.
* Use TransactionListScroller around your scroll container to render
* top and bottom scroll buttons.
*/
const TransactionListScroller: React.FC<{
 children: (ref: React.RefObject<HTMLDivElement>) => React.ReactNode;
 className?: string;
}> = ({ children, className }) => {
 const scrollRef = useRef<HTMLDivElement>(null);

 const scrollBy = (delta: number) => {
   const el = scrollRef.current;
   if (!el) return;
   el.scrollBy({ left: delta, behavior: 'smooth' });
 };

 return (
   <div className={cn("relative", className)}>
     {/* Top controls */}
     <div className="sticky top-0 z-10 pointer-events-none">
       <div className="flex justify-between px-2 py-1">
         <button
           type="button"
           className="pointer-events-auto h-7 w-7 rounded-full bg-white/90 shadow hover:bg-white text-slate-700 flex items-center justify-center"
           onClick={() => scrollBy(-240)}
           aria-label="Scroll left"
           title="Scroll left"
         >
           ‹
         </button>
         <button
           type="button"
           className="pointer-events-auto h-7 w-7 rounded-full bg-white/90 shadow hover:bg-white text-slate-700 flex items-center justify-center"
           onClick={() => scrollBy(240)}
           aria-label="Scroll right"
           title="Scroll right"
         >
           ›
         </button>
       </div>
     </div>

     {/* Scroll area */}
     <div ref={scrollRef} className="overflow-x-auto">
       {children(scrollRef)}
     </div>

     {/* Bottom controls */}
     <div className="sticky bottom-0 z-10 pointer-events-none">
       <div className="flex justify-between px-2 py-1">
         <button
           type="button"
           className="pointer-events-auto h-7 w-7 rounded-full bg-white/90 shadow hover:bg-white text-slate-700 flex items-center justify-center"
           onClick={() => scrollBy(-240)}
           aria-label="Scroll left"
           title="Scroll left"
         >
           ‹
         </button>
         <button
           type="button"
           className="pointer-events-auto h-7 w-7 rounded-full bg-white/90 shadow hover:bg-white text-slate-700 flex items-center justify-center"
           onClick={() => scrollBy(240)}
           aria-label="Scroll right"
           title="Scroll right"
         >
           ›
         </button>
       </div>
     </div>
   </div>
 );
};

// Memoized transaction row component
export const MemoizedTransactionRow = memo<{
 transaction: Transaction;
 index: number;
 isEditing?: boolean;
 onEdit?: (transaction: Transaction) => void;
 onDelete?: (id: string) => void;
 isAdmin?: boolean;
}>(({ transaction, index, isEditing, onEdit, onDelete, isAdmin }) => {
  const handleEdit = useCallback(() => {
    onEdit?.(transaction);
  }, [onEdit, transaction]);

  const handleDelete = useCallback(() => {
    onDelete?.(transaction.id);
  }, [onDelete, transaction.id]);

  const typeColor = useMemo(() => 
    transaction.type === 'cash-in' 
      ? 'text-green-600 bg-green-50' 
      : 'text-red-600 bg-red-50'
  , [transaction.type]);

  const formattedAmount = useMemo(() => 
    `K${transaction.amount.toLocaleString()}`
  , [transaction.amount]);

 return (
   <div
     className={cn(
       "group relative grid grid-cols-[1.2fr_0.6fr_1fr_1fr_1fr_0.6fr_0.6fr] min-w-[800px] items-center gap-2 px-3 py-2 border-b border-gray-100",
       "bg-white hover:bg-slate-50 transition-colors duration-150",
       isEditing && "bg-blue-50/60 border-blue-200"
     )}
   >
      {/* Leading icon + date/time */}
      <div className="col-span-3 flex items-center gap-2 min-w-0">
        <div
          className={cn(
            "h-7 w-7 flex items-center justify-center rounded-md text-white shrink-0",
            transaction.type === 'cash-in' ? "bg-green-500" : "bg-red-500"
          )}
          aria-hidden
          title={transaction.type === 'cash-in' ? 'Cash In' : 'Cash Out'}
        >
          {/* Simple arrow icons using unicode for zero-dependency; can swap to lucide if desired */}
          <span className="text-xs">{transaction.type === 'cash-in' ? '↑' : '↓'}</span>
        </div>
        <div className="min-w-0">
          <div className="text-[13px] font-medium text-slate-900 truncate">{transaction.date}</div>
          {transaction.time && (
            <div className="text-[11px] text-slate-500 truncate">{transaction.time}</div>
          )}
        </div>
      </div>

      {/* Type pill */}
      <div className="col-span-1">
        <span
          className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium",
            typeColor
          )}
        >
          {transaction.type === 'cash-in' ? 'In' : 'Out'}
        </span>
      </div>

      {/* Category with icon */}
      <div className="col-span-2 min-w-0">
        <div className="flex items-center gap-1.5 text-[12px] text-slate-700 truncate" title={transaction.category_name}>
          <span className="text-slate-400">🏷️</span>
          <span className="truncate">{transaction.category_name}</span>
        </div>
      </div>

      {/* Amount prominent, compact */}
      <div className="col-span-2">
        <div className={cn(
          "text-sm font-semibold tabular-nums",
          transaction.type === 'cash-in' ? 'text-green-700' : 'text-red-700'
        )}>
          {formattedAmount}
        </div>
      </div>

      {/* Customer with icon */}
      <div className="col-span-2 min-w-0">
        <div className="flex items-center gap-1.5 text-[12px] text-slate-700 truncate" title={transaction.customer_name}>
          <span className="text-slate-400">👤</span>
          <span className="truncate">{transaction.customer_name}</span>
        </div>
      </div>

      {/* Pictures (compact) */}
      <div className="col-span-1 text-[12px] text-slate-500 text-center">
        {transaction.number_of_pictures || 0}
      </div>

      {/* Admin actions appear on hover for cleaner look */}
      <div className="col-span-1 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {isAdmin && (
          <>
            <button
              onClick={handleEdit}
              className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
              title="Edit transaction"
              aria-label="Edit transaction"
            >
              ✏️
            </button>
            <button
              onClick={handleDelete}
              className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
              title="Delete transaction"
              aria-label="Delete transaction"
            >
              🗑️
            </button>
          </>
        )}
      </div>
    </div>
  );
});

MemoizedTransactionRow.displayName = 'MemoizedTransactionRow';

// Memoized balance card component
export const MemoizedBalanceCard = memo<{
  title: string;
  amount: number;
  type: 'positive' | 'negative' | 'neutral';
  icon?: React.ReactNode;
  subtitle?: string;
  loading?: boolean;
}>(({ title, amount, type, icon, subtitle, loading }) => {
  const formattedAmount = useMemo(() => 
    `K${Math.abs(amount).toLocaleString()}`
  , [amount]);

  const colorClasses = useMemo(() => {
    switch (type) {
      case 'positive':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'negative':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  }, [type]);

  if (loading) {
    return (
      <div className="p-4 bg-white rounded-lg border border-gray-200 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-6 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  return (
    <div className={cn(
      // Slightly denser balance card to match the compact list
      "p-3 rounded-lg border transition-all duration-200 hover:shadow-sm",
      colorClasses
    )}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[13px] font-medium opacity-80">{title}</p>
          <p className="text-xl font-bold">{formattedAmount}</p>
          {subtitle && (
            <p className="text-[11px] opacity-60 mt-0.5">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="text-xl opacity-60">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
});

MemoizedBalanceCard.displayName = 'MemoizedBalanceCard';

// Memoized filter component
export const MemoizedTransactionFilters = memo<{
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  categories: string[];
  loading?: boolean;
}>(({ filters, onFiltersChange, categories, loading }) => {
  const handleTypeChange = useCallback((type: 'all' | 'cash-in' | 'cash-out') => {
    onFiltersChange({ ...filters, type });
  }, [filters, onFiltersChange]);

  const handleCategoryChange = useCallback((category: string) => {
    // Conform to FilterOptions shape used across app (categories: string[] | undefined)
    const next = category ? [category] : undefined;
    onFiltersChange({ ...filters, categories: next } as FilterOptions);
  }, [filters, onFiltersChange]);

  // This variant of FilterOptions may not include search; keep it no-op to satisfy typing.
  const handleSearchChange = useCallback((_search: string) => {
    // no-op
  }, []);

  if (loading) {
    return (
      <div className="p-4 bg-white rounded-lg border border-gray-200 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 bg-white rounded-lg border border-gray-200">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-[13px] font-medium text-gray-700 mb-1">
            Type
          </label>
          <select
            value={filters.type}
            onChange={(e) => handleTypeChange(e.target.value as any)}
            className="w-full h-9 px-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="all">All Types</option>
            <option value="cash-in">Cash In</option>
            <option value="cash-out">Cash Out</option>
          </select>
        </div>

        <div>
          <label className="block text-[13px] font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            value={(filters as any).categories?.[0] ?? ''}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="w-full h-9 px-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[13px] font-medium text-gray-700 mb-1">
            Search
          </label>
          <input
            type="text"
            value={(filters as any).search ?? ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search transactions..."
            className="w-full h-9 px-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>
      </div>
    </div>
  );
});

MemoizedTransactionFilters.displayName = 'MemoizedTransactionFilters';

// Memoized loading skeleton
export const MemoizedLoadingSkeleton = memo<{
 rows?: number;
 className?: string;
}>(({ rows = 5, className }) => (
 <div className={cn("space-y-2", className)}>
   {Array.from({ length: rows }).map((_, index) => (
     <div key={index} className="animate-pulse">
       <div className="grid grid-cols-[1.2fr_0.6fr_1fr_1fr_1fr_0.6fr_0.6fr] min-w-[800px] gap-2 px-3 py-2">
         <div className="h-4 bg-gray-200 rounded col-span-1"></div>
         <div className="h-4 bg-gray-200 rounded col-span-1"></div>
         <div className="h-4 bg-gray-200 rounded col-span-1"></div>
         <div className="h-4 bg-gray-200 rounded col-span-1"></div>
         <div className="h-4 bg-gray-200 rounded col-span-1"></div>
         <div className="h-4 bg-gray-200 rounded col-span-1"></div>
         <div className="h-4 bg-gray-200 rounded col-span-1"></div>
       </div>
     </div>
   ))}
 </div>
));

MemoizedLoadingSkeleton.displayName = 'MemoizedLoadingSkeleton';
