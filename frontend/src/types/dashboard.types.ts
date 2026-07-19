export interface DashboardSummary {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  pendingPayments: number;
}

export interface ChartDataPoint {
  month: string;
  revenue: number;
  expense: number;
}

export interface TopClient {
  clientId: number;
  clientName: string;
  totalRevenue: number;
}

export interface AiInsightsResponse {
  insights: string;
}
