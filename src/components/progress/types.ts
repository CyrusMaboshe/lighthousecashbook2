import { Transaction } from '@/hooks/useTransactions';

export interface ProgressVisualizationProps {
  transactions: Transaction[];
  userContext?: any; // Optional user context for multi-tenant systems
}

export interface ProcessedDataItem {
  name: string;
  fullName: string;
  cashIn: number;
  cashOut: number;
  netBalance: number;
  transactions: number;
  compareCashIn?: number;
  compareCashOut?: number;
  compareNetBalance?: number;
}

export type ViewType = 'monthly' | 'weekly' | 'daily';

export interface ChartConfig {
  [key: string]: {
    label: string;
    color: string;
  };
}

export interface NetBalanceChartProps {
  data: ProcessedDataItem[];
  chartConfig: ChartConfig;
  comparisonMode: boolean;
  viewType: ViewType;
}
