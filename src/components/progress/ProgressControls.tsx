
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Filter, ArrowUpDown } from 'lucide-react';
import { ViewType } from './types';
import { cn } from '@/lib/utils';

interface ProgressControlsProps {
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  selectedMonth: number;
  setSelectedMonth: (month: number) => void;
  viewType: ViewType;
  setViewType: (viewType: ViewType) => void;
  comparisonMode: boolean;
  setComparisonMode: (mode: boolean) => void;
  compareYear: number;
  setCompareYear: (year: number) => void;
  compareMonth: number;
  setCompareMonth: (month: number) => void;
  compareViewType: ViewType;
  setCompareViewType: (viewType: ViewType) => void;
  primaryDate?: Date;
  setPrimaryDate?: (date: Date | undefined) => void;
  compareDate?: Date;
  setCompareDate?: (date: Date | undefined) => void;
  lightTheme?: boolean;
}

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const generateYearOptions = () => {
  const years = [];
  years.push({ value: "0", label: "All Years" });
  for (let year = 2020; year <= 2050; year++) {
    years.push({ value: year.toString(), label: year.toString() });
  }
  return years;
};

export function ProgressControls({
  selectedYear,
  setSelectedYear,
  selectedMonth,
  setSelectedMonth,
  viewType,
  setViewType,
  comparisonMode,
  setComparisonMode,
  compareYear,
  setCompareYear,
  compareMonth,
  setCompareMonth,
  compareViewType,
  setCompareViewType,
  primaryDate,
  setPrimaryDate,
  compareDate,
  setCompareDate,
}: ProgressControlsProps) {
  const yearOptions = generateYearOptions();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-slate-500" />
          <h4 className="text-lg font-bold text-slate-900">Analysis Filters</h4>
        </div>
        <div className="flex items-center space-x-2">
          <Label htmlFor="comparison-mode" className="text-sm font-medium text-slate-700">Comparison Mode</Label>
          <Switch
            id="comparison-mode"
            checked={comparisonMode}
            onCheckedChange={setComparisonMode}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Primary Period</h5>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500">Year</label>
              <Select value={selectedYear.toString()} onValueChange={(val) => setSelectedYear(parseInt(val))}>
                <SelectTrigger className="h-10 bg-white border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map(y => <SelectItem key={y.value} value={y.value}>{y.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500">View</label>
              <Select value={viewType} onValueChange={(val: any) => setViewType(val)}>
                <SelectTrigger className="h-10 bg-white border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  {selectedYear !== 0 && <SelectItem value="daily">Daily</SelectItem>}
                </SelectContent>
              </Select>
            </div>
          </div>
          {viewType === 'daily' && selectedYear !== 0 && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500">Month</label>
              <Select value={selectedMonth.toString()} onValueChange={(val) => setSelectedMonth(parseInt(val))}>
                <SelectTrigger className="h-10 bg-white border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((m, i) => <SelectItem key={i} value={i.toString()}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {comparisonMode && (
          <div className="space-y-4 p-4 bg-blue-50/50 rounded-lg border border-blue-100">
            <h5 className="text-xs font-bold text-blue-400 uppercase tracking-wider">Comparison Period</h5>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-blue-600">Year</label>
                <Select value={compareYear.toString()} onValueChange={(val) => setCompareYear(parseInt(val))}>
                  <SelectTrigger className="h-10 bg-white border-blue-100 text-blue-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map(y => <SelectItem key={y.value} value={y.value}>{y.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-blue-600">View</label>
                <Select value={compareViewType} onValueChange={(val: any) => setCompareViewType(val)}>
                  <SelectTrigger className="h-10 bg-white border-blue-100 text-blue-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    {compareYear !== 0 && <SelectItem value="daily">Daily</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
