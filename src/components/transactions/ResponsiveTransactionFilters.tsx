import React from 'react';
import { FilterOptions } from '@/pages/Index';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Search, Filter, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface ResponsiveTransactionFiltersProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  categories: string[];
  className?: string;
}

export function ResponsiveTransactionFilters({
  filters,
  onFiltersChange,
  categories,
  className = ""
}: ResponsiveTransactionFiltersProps) {
  
  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      duration: 'all',
      type: 'all',
      categories: [],
      customStartDate: '',
      customEndDate: '',
      search: '',
      category: '',
      dateRange: ''
    });
  };

  const hasActiveFilters = filters.search || 
                          filters.category || 
                          filters.dateRange || 
                          filters.duration !== 'all' || 
                          filters.type !== 'all' ||
                          (filters.categories && filters.categories.length > 0);

  return (
    <Card className={`w-full ${className}`}>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search transactions, customers, or details..."
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filter Row */}
          <div className="flex flex-wrap gap-2">
            {/* Transaction Type Filter */}
            <div className="min-w-[120px]">
              <Select
                value={filters.type}
                onValueChange={(value) => handleFilterChange('type', value)}
              >
                <SelectTrigger className="responsive-input h-auto">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="cash-in">Cash In</SelectItem>
                  <SelectItem value="cash-out">Cash Out</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Category Filter */}
            <div className="min-w-[140px]">
              <Select
                value={filters.category || ''}
                onValueChange={(value) => handleFilterChange('category', value)}
              >
                <SelectTrigger className="responsive-input h-auto">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Duration Filter */}
            <div className="min-w-[120px]">
              <Select
                value={filters.duration}
                onValueChange={(value) => handleFilterChange('duration', value)}
              >
                <SelectTrigger className="responsive-input h-auto">
                  <SelectValue placeholder="Duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="this-week">This Week</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <Button
                onClick={clearFilters}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Clear
              </Button>
            )}
          </div>

          {/* Custom Date Range Inputs (shown when custom is selected) */}
          {filters.duration === 'custom' && (
            <div className="flex flex-wrap gap-2">
              <div className="flex-1 min-w-[140px]">
                <Input
                  type="date"
                  placeholder="Start Date"
                  value={filters.customStartDate || ''}
                  onChange={(e) => handleFilterChange('customStartDate', e.target.value)}
                />
              </div>
              <div className="flex-1 min-w-[140px]">
                <Input
                  type="date"
                  placeholder="End Date"
                  value={filters.customEndDate || ''}
                  onChange={(e) => handleFilterChange('customEndDate', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Active Filters Summary */}
          {hasActiveFilters && (
            <div className="text-sm text-gray-600 border-t pt-2">
              <span className="font-medium">Active filters:</span>
              {filters.search && <span className="ml-2 bg-blue-100 px-2 py-1 rounded text-xs">Search: "{filters.search}"</span>}
              {filters.category && <span className="ml-2 bg-blue-100 px-2 py-1 rounded text-xs">Category: {filters.category}</span>}
              {filters.duration !== 'all' && <span className="ml-2 bg-blue-100 px-2 py-1 rounded text-xs">Duration: {filters.duration}</span>}
              {filters.type !== 'all' && <span className="ml-2 bg-blue-100 px-2 py-1 rounded text-xs">Type: {filters.type}</span>}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}