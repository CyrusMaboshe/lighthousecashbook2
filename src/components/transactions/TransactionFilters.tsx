
import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { FilterOptions } from '@/pages/Index';
import { Calendar, Users } from 'lucide-react';
import { exportToPDF } from '@/utils/pdfExport';

interface TransactionFiltersProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  categories: string[];
  onShowTopCustomers: () => void;
  onShowCustomerList: () => void;
  isAdmin: boolean;
  isMobile: boolean;
}

export function TransactionFilters({
  filters,
  onFiltersChange,
  categories,
  onShowTopCustomers,
  onShowCustomerList,
  isAdmin,
  isMobile
}: TransactionFiltersProps) {
  const availableCategories = [...new Set(categories)].sort();

  const durations = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'this-week', label: 'This Week' },
    { value: 'custom', label: 'Custom Range' },
  ];

  const types = [
    { value: 'all', label: 'All Types' },
    { value: 'cash-in', label: 'Cash In Only' },
    { value: 'cash-out', label: 'Cash Out Only' },
  ];

  const handleCategoryToggle = (category: string) => {
    const currentCategories = filters.categories || [];
    const newCategories = currentCategories.includes(category)
      ? currentCategories.filter(c => c !== category)
      : [...currentCategories, category];
    
    onFiltersChange({
      ...filters,
      categories: newCategories.length === 0 ? undefined : newCategories
    });
  };

  const clearCategoryFilters = () => {
    onFiltersChange({
      ...filters,
      categories: undefined
    });
  };

  return (
    <div className={`${isMobile ? 'px-4' : 'px-2'}`}>
      {/* All Filters - Collapsible Card - Closed by default */}
      <details className="rounded-md border border-slate-200 bg-white">
        <summary className="list-none cursor-pointer select-none px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-800">All Filters</span>
            {(filters.duration !== 'all' || filters.type !== 'all' || (filters.categories?.length ?? 0) > 0 || filters.customStartDate || filters.customEndDate) && (
              <span className="text-xs text-slate-500">
                Active
              </span>
            )}
          </div>
          <span className="text-slate-500 text-xl leading-none">▾</span>
        </summary>

        <div className="px-4 pb-4 space-y-4">
          {/* Row: Duration + Type + Customer Analysis (as selects) */}
          <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-12 items-end'}`}>
            {/* Duration */}
            <div className={`${isMobile ? '' : 'col-span-3'}`}>
              <label className="block text-xs font-medium text-slate-600 mb-1">Duration</label>
              <Select value={filters.duration} onValueChange={(value) => onFiltersChange({ ...filters, duration: value as FilterOptions['duration'] })}>
                <SelectTrigger className="bg-white h-9">
                  <SelectValue placeholder="All Time" />
                </SelectTrigger>
                <SelectContent>
                  {durations.map(duration => (
                    <SelectItem key={duration.value} value={duration.value}>
                      {duration.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Type */}
            <div className={`${isMobile ? '' : 'col-span-3'}`}>
              <label className="block text-xs font-medium text-slate-600 mb-1">Type</label>
              <Select value={filters.type} onValueChange={(value) => onFiltersChange({ ...filters, type: value as FilterOptions['type'] })}>
                <SelectTrigger className="bg-white h-9">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  {types.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Customer Analysis - formatted like Type */}
            <div className={`${isMobile ? '' : 'col-span-6'}`}>
              <label className="block text-xs font-medium text-slate-600 mb-1">Customer Analysis</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {isAdmin && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onShowTopCustomers}
                    className="h-9 justify-start text-xs"
                  >
                    <Users className="w-3 h-3 mr-2" />
                    Top Customers
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onShowCustomerList}
                  className="h-9 justify-start text-xs"
                >
                  <Users className="w-3 h-3 mr-2" />
                  All Customers
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportToPDF && typeof exportToPDF === 'function' && exportToPDF('all-customers' as any, filters as any)}
                  className="h-9 justify-start text-xs"
                  title="Export All Customers as PDF"
                >
                  <Users className="w-3 h-3 mr-2" />
                  Export All Customers (PDF)
                </Button>
                {/* Spacer to align grid when only one or two buttons show */}
                {!isAdmin && <div className="hidden sm:block" />}
              </div>
            </div>
          </div>

          {/* Custom Date Range */}
          {filters.duration === 'custom' && (
            <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Start Date</label>
                <input
                  type="date"
                  value={filters.customStartDate || ''}
                  onChange={(e) => onFiltersChange({ ...filters, customStartDate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">End Date</label>
                <input
                  type="date"
                  value={filters.customEndDate || ''}
                  onChange={(e) => onFiltersChange({ ...filters, customEndDate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* Categories (Multi-select with checkboxes in dropdown) */}
          {availableCategories.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs sm:text-sm font-medium text-slate-700">Categories</label>
                {(filters.categories && filters.categories.length > 0) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearCategoryFilters}
                    className="h-7 px-2 text-xs text-slate-500 hover:text-slate-700"
                  >
                    Clear
                  </Button>
                )}
              </div>

              {/* Custom multiselect using Radix Select primitives */}
              <Select value="custom" onValueChange={() => { /* noop: interactions handled by checkboxes */ }}>
                <SelectTrigger className="bg-white h-9">
                  <SelectValue placeholder="All Categories">
                    {(filters.categories && filters.categories.length > 0)
                      ? `${filters.categories.length} selected`
                      : 'All Categories'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  <div className="px-1 py-1">
                    <button
                      type="button"
                      className="w-full text-left px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-50 rounded"
                      onClick={() => onFiltersChange({ ...filters, categories: undefined })}
                    >
                      Select None (All Categories)
                    </button>
                  </div>
                  <div className="max-h-52 overflow-auto px-1 pb-1">
                    {availableCategories.map((category) => {
                      const checked = !!filters.categories?.includes(category);
                      return (
                        <div
                          key={category}
                          className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-50 cursor-pointer"
                          onClick={() => handleCategoryToggle(category)}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleCategoryToggle(category)}
                            className="h-3.5 w-3.5 accent-blue-600"
                            aria-label={`Toggle ${category}`}
                          />
                          <span className="text-sm text-slate-700">{category}</span>
                        </div>
                      );
                    })}
                  </div>
                </SelectContent>
              </Select>

              {/* Current selections as removable chips */}
              {filters.categories && filters.categories.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {filters.categories.map((category) => (
                    <Badge
                      key={category}
                      variant="outline"
                      className="cursor-pointer"
                      onClick={() => handleCategoryToggle(category)}
                      title="Click to remove"
                    >
                      {category} ×
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </details>
    </div>
  );
}
