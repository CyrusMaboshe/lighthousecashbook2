
import React, { forwardRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { NetBalanceChartProps } from './types';
import { cn } from '@/lib/utils';

interface ExtendedNetBalanceChartProps extends NetBalanceChartProps {
  lightTheme?: boolean;
  fullScreen?: boolean;
  selectedYear?: number;
  selectedMonth?: number;
  compareYear?: number;
  compareMonth?: number;
  compareViewType?: string;
}

export const NetBalanceChart = forwardRef<HTMLDivElement, ExtendedNetBalanceChartProps>(({
  data,
  chartConfig,
  comparisonMode,
  viewType,
  lightTheme = false,
  fullScreen = false,
}, ref) => {
  const getChartTitle = () => {
    switch (viewType) {
      case 'daily': return 'Net Balance Trend – Daily View';
      case 'weekly': return 'Net Balance Trend – Weekly View';
      default: return 'Net Balance Trend – Monthly View';
    }
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
            <AreaChart data={data} margin={{ top: 20, right: 30, left: 40, bottom: 20 }}>
              <defs>
                <linearGradient id="netBalanceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.01} />
                </linearGradient>
                {comparisonMode && (
                  <linearGradient id="compareNetBalanceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                )}
              </defs>
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
              <Area
                type="monotone"
                dataKey="netBalance"
                stroke="#3b82f6"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#netBalanceGradient)"
                name="Net Balance"
              />
              {comparisonMode && (
                <Area
                  type="monotone"
                  dataKey="compareNetBalance"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  fillOpacity={1}
                  fill="url(#compareNetBalanceGradient)"
                  name="Prev Net Balance"
                />
              )}
            </AreaChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
});

NetBalanceChart.displayName = 'NetBalanceChart';
