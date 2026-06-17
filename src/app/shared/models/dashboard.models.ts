export interface DashboardWeekPoint {
  label: string;
  revenue: number;
  adSpend: number;
  margin: number;
}

export interface DashboardOverviewResponse {
  year: number;
  month: number;
  hasData: boolean;
  grossRevenue: number;
  operationalProfit: number;
  marginPercentage: number;
  totalSales: number;
  adSpend: number;
  cpa: number;
  targetGrossRevenue: number;
  targetMonthlySales: number;
  targetCpa: number;
  weeklyEvolution: DashboardWeekPoint[];
}
