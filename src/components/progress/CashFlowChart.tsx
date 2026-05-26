
import React, { forwardRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar, ResponsiveContainer } from 'recharts';
import { ProcessedDataItem, ViewType, ChartConfig } from './types';
import { cn } from '@/lib/utils';

interface CashFlowChartProps {
  data: ProcessedDataItem[];
  viewType: ViewType;
  selectedYear: number;
  selectedMonth: number;
  comparisonMode: boolean;
  compareYear: number;
  compareMonth: number;
  compareViewType: ViewType;
  chartConfig: ChartConfig;
  lightTheme?: boolean;
  fullScreen?: boolean;
}

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const CashFlowChart = forwardRef<HTMLDivElement, CashFlowChartProps>(({
  data,
  viewType,
  selectedYear,
  selectedMonth,
  comparisonMode,
  compareYear,
  compareMonth,
  compareViewType,
  chartConfig,
  lightTheme = false,
  fullScreen = false,
}, ref) => {
  const getChartTitle = () => {
    let title = `Cash Flow Trend - ${viewType === 'monthly' ? 'Monthly' : viewType === 'weekly' ? 'Weekly' : 'Daily'} View`;
    if (viewType === 'daily') {
      title += ` (${months[selectedMonth]} ${selectedYear})`;
    }
    if (comparisonMode) {
      title += ` vs ${compareViewType === 'daily' ? `${months[compareMonth]} ` : ''}${compareYear}`;
    }
    return title;
  };

  const axisStyle = {
    fill: '#64748b',
    fontSize: 12,
  };

  return (
    <Card
      className={cn(
        "border-none shadow-none bg-white",
        fullScreen ? "h-full w-full flex flex-col" : ""
      )}
      ref={ref}
    >
      <CardHeader className="px-0 py-4 bg-white shrink-0">
        <CardTitle className="text-xl font-bold text-slate-900">
          {getChartTitle()}
        </CardTitle>
      </CardHeader>

      <CardContent className={cn(
        "px-0 py-2 grow",
        fullScreen ? "h-full" : ""
      )}>
        <div className={cn(
          "w-full bg-white",
          fullScreen ? "h-full" : "h-[450px]"
        )}>
          <ChartContainer config={chartConfig} className="w-full h-full aspect-auto">
            {viewType === 'daily' ? (
              <BarChart data={data} margin={{ top: 20, right: 30, left: 40, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#94a3b8"
                  tick={axisStyle}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis
                  stroke="#94a3b8"
                  tick={axisStyle}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickFormatter={(value) => `ZMW ${value.toLocaleString()}`}
                />
                <ChartTooltip
                  cursor={{ fill: '#f1f5f9' }}
                  content={<ChartTooltipContent className="bg-white border-slate-200 text-slate-900 shadow-lg" />}
                />
                <ChartLegend content={<ChartLegendContent className="text-slate-600 font-medium" />} />
                <Bar dataKey="cashIn" fill="#10b981" radius={[4, 4, 0, 0]} name="Cash In" />
                <Bar dataKey="cashOut" fill="#ef4444" radius={[4, 4, 0, 0]} name="Cash Out" />
                {comparisonMode && (
                  <>
                    <Bar dataKey="compareCashIn" fill="#60a5fa" radius={[4, 4, 0, 0]} name="Prev Cash In" opacity={0.6} />
                    <Bar dataKey="compareCashOut" fill="#f87171" radius={[4, 4, 0, 0]} name="Prev Cash Out" opacity={0.6} />
                  </>
                )}
              </BarChart>
            ) : (
              <LineChart data={data} margin={{ top: 20, right: 30, left: 40, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#94a3b8"
                  tick={axisStyle}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis
                  stroke="#94a3b8"
                  tick={axisStyle}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickFormatter={(value) => `ZMW ${value.toLocaleString()}`}
                />
                <ChartTooltip
                  content={<ChartTooltipContent className="bg-white border-slate-200 text-slate-900 shadow-lg" />}
                />
                <ChartLegend content={<ChartLegendContent className="text-slate-600 font-medium" />} />
                <Line
                  type="monotone"
                  dataKey="cashIn"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ fill: "#10b981", r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Cash In"
                />
                <Line
                  type="monotone"
                  dataKey="cashOut"
                  stroke="#ef4444"
                  strokeWidth={3}
                  dot={{ fill: "#ef4444", r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Cash Out"
                />
                {comparisonMode && (
                  <>
                    <Line
                      type="monotone"
                      dataKey="compareCashIn"
                      stroke="#60a5fa"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ fill: "#60a5fa", r: 3 }}
                      name="Prev Cash In"
                    />
                    <Line
                      type="monotone"
                      dataKey="compareCashOut"
                      stroke="#f87171"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ fill: "#f87171", r: 3 }}
                      name="Prev Cash Out"
                    />
                  </>
                )}
              </LineChart>
            )}
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
});

CashFlowChart.displayName = 'CashFlowChart';
