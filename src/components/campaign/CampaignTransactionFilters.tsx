// Campaign Transaction Filters - EXACT REPLICA of existing filters
// This replicates the exact filter functionality and styling

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, Download, Plus } from 'lucide-react';

interface CampaignTransactionFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterType: 'all' | 'cash-in' | 'cash-out';
  onFilterTypeChange: (value: 'all' | 'cash-in' | 'cash-out') => void;
  filterCategory: string;
  onFilterCategoryChange: (value: string) => void;
  categories: string[];
  onAddTransaction: () => void;
  onExport: () => void;
  transactionCount: number;
  totalCount: number;
}

export function CampaignTransactionFilters({
  searchTerm,
  onSearchChange,
  filterType,
  onFilterTypeChange,
  filterCategory,
  onFilterCategoryChange,
  categories,
  onAddTransaction,
  onExport,
  transactionCount,
  totalCount
}: CampaignTransactionFiltersProps) {
  return (
    <div className="space-y-4">
      {/* Header with Add Transaction and Export buttons */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Campaign Transactions</h1>
          <p className="text-gray-600">
            Showing {transactionCount} of {totalCount} transactions
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={onAddTransaction} 
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Transaction
          </Button>
          <Button 
            variant="outline" 
            onClick={onExport}
            className="border-gray-300 hover:bg-gray-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters Card - EXACT same styling as existing system */}
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by customer, category, details, or added by..."
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Type Filter */}
            <div className="w-full lg:w-48">
              <Select value={filterType} onValueChange={onFilterTypeChange}>
                <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="cash-in">Cash In</SelectItem>
                  <SelectItem value="cash-out">Cash Out</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Category Filter */}
            <div className="w-full lg:w-48">
              <Select value={filterCategory} onValueChange={onFilterCategoryChange}>
                <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filter Icon Button */}
            <Button 
              variant="outline" 
              size="icon"
              className="border-gray-300 hover:bg-gray-50"
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          {/* Active Filters Display */}
          {(filterType !== 'all' || filterCategory !== 'all' || searchTerm) && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
              <span className="text-sm text-gray-600">Active filters:</span>
              
              {searchTerm && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Search: "{searchTerm}"
                  <button
                    onClick={() => onSearchChange('')}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              )}
              
              {filterType !== 'all' && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Type: {filterType === 'cash-in' ? 'Cash In' : 'Cash Out'}
                  <button
                    onClick={() => onFilterTypeChange('all')}
                    className="ml-1 text-green-600 hover:text-green-800"
                  >
                    ×
                  </button>
                </span>
              )}
              
              {filterCategory !== 'all' && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Category: {filterCategory}
                  <button
                    onClick={() => onFilterCategoryChange('all')}
                    className="ml-1 text-purple-600 hover:text-purple-800"
                  >
                    ×
                  </button>
                </span>
              )}

              {/* Clear All Filters */}
              <button
                onClick={() => {
                  onSearchChange('');
                  onFilterTypeChange('all');
                  onFilterCategoryChange('all');
                }}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200"
              >
                Clear all
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
