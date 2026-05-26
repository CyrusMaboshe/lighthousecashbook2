import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarIcon, Filter, X, Crown, Users, MessageSquare, ChevronDown, Search, SlidersHorizontal } from 'lucide-react';
import { format } from 'date-fns';
import { FilterOptions } from '@/pages/Index';
import { useIsMobile } from '@/hooks/use-mobile';

interface FilterBarProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  categories: string[];
  onShowTopCustomers: () => void;
  onShowCustomerList: () => void;
  isAdmin: boolean;
}

export function FilterBar({ 
  filters, 
  onFiltersChange, 
  categories, 
  onShowTopCustomers, 
  onShowCustomerList,
  isAdmin 
}: FilterBarProps) {
  const [isFilterOpen, setIsFilterOpen] = React.useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = React.useState(false);
  const [startDate, setStartDate] = React.useState<Date | undefined>(
    filters.customStartDate ? new Date(filters.customStartDate) : undefined
  );
  const [endDate, setEndDate] = React.useState<Date | undefined>(
    filters.customEndDate ? new Date(filters.customEndDate) : undefined
  );
  const isMobile = useIsMobile();

  const handleDurationChange = (duration: FilterOptions['duration']) => {
    const newFilters = { ...filters, duration };
    if (duration !== 'custom') {
      newFilters.customStartDate = undefined;
      newFilters.customEndDate = undefined;
      setStartDate(undefined);
      setEndDate(undefined);
    }
    onFiltersChange(newFilters);
  };

  const handleTypeChange = (type: FilterOptions['type']) => {
    onFiltersChange({ ...filters, type });
  };

  const handleCategoryChange = (categoryName: string, checked: boolean) => {
    const currentCategories = filters.categories || [];
    let newCategories: string[];
    
    if (checked) {
      newCategories = [...currentCategories, categoryName];
    } else {
      newCategories = currentCategories.filter(c => c !== categoryName);
    }
    
    onFiltersChange({ 
      ...filters, 
      categories: newCategories.length > 0 ? newCategories : undefined 
    });
  };

  const handleStartDateChange = (date: Date | undefined) => {
    setStartDate(date);
    onFiltersChange({
      ...filters,
      customStartDate: date ? format(date, 'yyyy-MM-dd') : undefined
    });
  };

  const handleEndDateChange = (date: Date | undefined) => {
    setEndDate(date);
    onFiltersChange({
      ...filters,
      customEndDate: date ? format(date, 'yyyy-MM-dd') : undefined
    });
  };

  const clearFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    onFiltersChange({
      duration: 'all',
      type: 'all'
    });
  };

  const hasActiveFilters = filters.duration !== 'all' || 
                          filters.type !== 'all' || 
                          (filters.categories && filters.categories.length > 0);

  return (
    <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-white/20">
      <CardContent className="p-4">
        {isMobile ? (
          <div className="space-y-2">
            {/* First Row: Duration and Transaction Type - MADE SMALLER */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 flex-1">
                <Label className="text-slate-600 whitespace-nowrap text-xs">Duration</Label>
                <Select value={filters.duration} onValueChange={handleDurationChange}>
                  <SelectTrigger className="h-8 flex-1 text-xs">
                    <SelectValue />
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

              <div className="flex items-center gap-1 flex-1">
                <Label className="text-slate-600 whitespace-nowrap text-xs">Transaction</Label>
                <Select value={filters.type} onValueChange={handleTypeChange}>
                  <SelectTrigger className="h-8 flex-1 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="cash-in">Cash In</SelectItem>
                    <SelectItem value="cash-out">Cash Out</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Second Row: Categories, Top Customers, Customer Directory - MADE SMALLER */}
            <div className="flex items-center gap-1">
              {/* Categories Filter */}
              <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="h-8 flex items-center gap-1 text-xs px-2 flex-1"
                  >
                    <Filter className="h-3 w-3" />
                    Categories
                    {filters.categories && filters.categories.length > 0 && (
                      <Badge variant="secondary" className="ml-1 px-1 py-0 text-xs h-3">
                        {filters.categories.length}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0">
                  <div className="p-4">
                    <h4 className="font-medium text-sm mb-3">Filter by Categories</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {categories.map((category) => (
                        <div key={category} className="flex items-center space-x-2">
                          <Checkbox
                            id={category}
                            checked={filters.categories?.includes(category) || false}
                            onCheckedChange={(checked) => 
                              handleCategoryChange(category, checked as boolean)
                            }
                          />
                          <Label 
                            htmlFor={category} 
                            className="text-sm font-normal cursor-pointer flex-1"
                          >
                            {category}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Top Customers Button */}
              <Button 
                variant="outline" 
                onClick={onShowTopCustomers}
                className="h-8 flex items-center gap-1 text-xs px-2 flex-1"
              >
                <Crown className="h-3 w-3 text-yellow-500" />
                Top Customers
              </Button>

              {/* Customer Directory Button */}
              <Button 
                variant="outline" 
                onClick={onShowCustomerList}
                className="h-8 flex items-center gap-1 text-xs px-2 flex-1"
              >
                <Users className="h-3 w-3 text-blue-500" />
                Customer Directory
              </Button>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <div className="flex justify-center">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearFilters}
                  className="h-7 px-2 text-slate-600 hover:text-slate-900 text-xs"
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear Filters
                </Button>
              </div>
            )}

            {/* Custom Date Range for Mobile */}
            {filters.duration === 'custom' && (
              <div className="flex gap-2 items-center">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex-1 h-8 text-left font-normal text-xs"
                    >
                      {startDate ? format(startDate, 'MMM dd') : <span>Start Date</span>}
                      <CalendarIcon className="ml-auto h-3 w-3 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={handleStartDateChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex-1 h-8 text-left font-normal text-xs"
                    >
                      {endDate ? format(endDate, 'MMM dd') : <span>End Date</span>}
                      <CalendarIcon className="ml-auto h-3 w-3 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={handleEndDateChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>
        ) : (
          /* Desktop Layout - Horizontal Layout for All Filters */
          <div className="flex items-center gap-3 flex-wrap">
            {/* Duration Filter */}
            <div className="flex items-center gap-2">
              <Label className="text-slate-600 whitespace-nowrap text-sm">Duration</Label>
              <Select value={filters.duration} onValueChange={handleDurationChange}>
                <SelectTrigger className="h-9 w-[140px]">
                  <SelectValue />
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

            {/* Transaction Type Filter */}
            <div className="flex items-center gap-2">
              <Label className="text-slate-600 whitespace-nowrap text-sm">Transaction</Label>
              <Select value={filters.type} onValueChange={handleTypeChange}>
                <SelectTrigger className="h-9 w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="cash-in">Cash In</SelectItem>
                  <SelectItem value="cash-out">Cash Out</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Categories Filter */}
            <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className="h-9 flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Categories
                  {filters.categories && filters.categories.length > 0 && (
                    <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">
                      {filters.categories.length}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0">
                <div className="p-4">
                  <h4 className="font-medium text-sm mb-3">Filter by Categories</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {categories.map((category) => (
                      <div key={category} className="flex items-center space-x-2">
                        <Checkbox
                          id={category}
                          checked={filters.categories?.includes(category) || false}
                          onCheckedChange={(checked) => 
                            handleCategoryChange(category, checked as boolean)
                          }
                        />
                        <Label 
                          htmlFor={category} 
                          className="text-sm font-normal cursor-pointer flex-1"
                        >
                          {category}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Top Customers Button */}
            <Button 
              variant="outline" 
              onClick={onShowTopCustomers}
              className="h-9 flex items-center gap-2"
            >
              <Crown className="h-4 w-4 text-yellow-500" />
              Top Customers
            </Button>

            {/* Customer Directory Button */}
            <Button 
              variant="outline" 
              onClick={onShowCustomerList}
              className="h-9 flex items-center gap-2"
            >
              <Users className="h-4 w-4 text-blue-500" />
              Customer Directory
            </Button>

            {isAdmin && (
              <Button 
                variant="outline" 
                className="h-9 flex items-center gap-2"
              >
                <MessageSquare className="h-4 w-4 text-green-500" />
                Messages
              </Button>
            )}

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearFilters}
                className="h-9 px-3 text-slate-600 hover:text-slate-900"
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}

            {/* Custom Date Range */}
            {filters.duration === 'custom' && (
              <div className="flex gap-2 items-center ml-4">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-[140px] h-9 text-left font-normal"
                    >
                      {startDate ? format(startDate, 'PPP') : <span>Start Date</span>}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={handleStartDateChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-[140px] h-9 text-left font-normal"
                    >
                      {endDate ? format(endDate, 'PPP') : <span>End Date</span>}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={handleEndDateChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
