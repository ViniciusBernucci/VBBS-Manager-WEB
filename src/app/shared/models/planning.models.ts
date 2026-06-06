export type GoalUnit = 'BRL' | 'percent' | 'count' | 'multiplier';
export type GoalCategory = 'WeeklyAlert' | 'DailyTraffic' | 'WeeklyFinancial' | 'MonthlyGrowth';
export type GoalComparison = 'GreaterThan' | 'LessThan';

export interface PlanningGoal {
  id: string;
  key: string;
  name: string;
  description?: string;
  targetValue: number;
  currentValue?: number;
  unit: GoalUnit;
  category: GoalCategory;
  comparisonType: GoalComparison;
  actionIfFailed?: string;
  sortOrder: number;
}

export interface PlanningGoalsListResponse {
  goals: PlanningGoal[];
}

export interface UpdatePlanningGoalItem {
  id: string;
  targetValue: number;
  currentValue?: number;
}

export interface UpdatePlanningGoalsRequest {
  goals: UpdatePlanningGoalItem[];
}

export interface FinancialConfig {
  id: string;
  monthlyGrossRevenue: number;
  monthlyAdSpend: number;
  hotmartFeePercent: number;
  installmentFeePercent: number;
  installmentSalesPercent: number;
  federalTaxPercent: number;
  refundRatePercent: number;
  metaAdsTaxPercent: number;
  accountingCost: number;
  invoicingCost: number;
  manychatCost: number;
  hotmartPlayerCost: number;
}

export interface UpdateFinancialConfigRequest {
  monthlyGrossRevenue: number;
  monthlyAdSpend: number;
  hotmartFeePercent: number;
  installmentFeePercent: number;
  installmentSalesPercent: number;
  federalTaxPercent: number;
  refundRatePercent: number;
  metaAdsTaxPercent: number;
  accountingCost: number;
  invoicingCost: number;
  manychatCost: number;
  hotmartPlayerCost: number;
}

export interface DreRow {
  label: string;
  value: number;
  isDeduction?: boolean;
  isSubtotal?: boolean;
  isTotal?: boolean;
  percentOfRevenue?: number;
}

export interface DreResult {
  grossRevenue: number;
  hotmartFee: number;
  installmentFee: number;
  federalTax: number;
  refundCost: number;
  netRevenue: number;
  adSpendWithTax: number;
  marginAfterTraffic: number;
  fixedCosts: number;
  operationalProfit: number;
  marginPercent: number;
  rows: DreRow[];
}
