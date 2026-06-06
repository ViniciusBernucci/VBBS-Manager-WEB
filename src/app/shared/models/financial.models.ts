export type TransactionType = 'Income' | 'Expense';

export type CashFlowCategory =
  | 'HotmartPix'
  | 'HotmartCard'
  | 'OtherIncome'
  | 'MetaAds'
  | 'Taxes'
  | 'Tools'
  | 'OtherExpense';

export interface CashFlowTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: CashFlowCategory;
  categoryLabel: string;
  isFixed: boolean;
  isPaid: boolean;
  paymentId: string | null;
}

export interface FixedExpense {
  id: string;
  name: string;
  amount: number;
  category: CashFlowCategory;
  categoryLabel: string;
  isActive: boolean;
}

export interface SaveFixedExpenseRequest {
  name: string;
  amount: number;
  category: CashFlowCategory;
}

export interface MonthlyFixedExpense {
  fixedExpenseId: string;
  name: string;
  budgetedAmount: number;
  category: CashFlowCategory;
  categoryLabel: string;
  isPaid: boolean;
  paymentId: string | null;
  paidAmount: number | null;
  paidDate: string | null;
}

export interface PayFixedExpenseRequest {
  year: number;
  month: number;
  amount: number;
  date: string;
}

export interface CashFlowConfigDto {
  initialYear: number;
  initialMonth: number;
  initialBalance: number;
}

export interface CashFlowResponse {
  year: number;
  month: number;
  isConfigured: boolean;
  openingBalance: number;
  totalIncome: number;
  totalExpense: number;
  closingBalance: number;
  transactions: CashFlowTransaction[];
  config: CashFlowConfigDto | null;
}

export interface SetCashFlowConfigRequest {
  initialYear: number;
  initialMonth: number;
  initialBalance: number;
}

export interface CreateTransactionRequest {
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: CashFlowCategory;
  fixedExpenseId?: string;
}

export interface UpdateTransactionRequest {
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: CashFlowCategory;
}

export const INCOME_CATEGORIES: { label: string; value: CashFlowCategory }[] = [
  { label: 'Vendas Hotmart (Pix)', value: 'HotmartPix' },
  { label: 'Vendas Hotmart (Cartão)', value: 'HotmartCard' },
  { label: 'Outras Entradas', value: 'OtherIncome' },
];

export const EXPENSE_CATEGORIES: { label: string; value: CashFlowCategory }[] = [
  { label: 'Meta Ads', value: 'MetaAds' },
  { label: 'Impostos', value: 'Taxes' },
  { label: 'Ferramentas / SaaS', value: 'Tools' },
  { label: 'Outras Saídas', value: 'OtherExpense' },
];

export interface DailySalesResponse {
  date: string;
  totalSales: number;
  grossRevenue: number;
  netRevenue: number;
  hotmartFeeAmount: number;
  lastSyncedAt: string;
}

export const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export type DreLineKind = 'income' | 'deduction' | 'expense' | 'subtotal' | 'total' | 'section';

export interface DreLine {
  key: string;
  label: string;
  amount: number;
  kind: DreLineKind;
  percentOfGross: number | null;
  isEstimated: boolean;
}

export interface DreSummary {
  grossRevenue: number;
  netRevenue: number;
  operationalProfit: number;
  marginPercentage: number;
  monthProjection: number;
}

export interface DreDataPoint {
  date: string;
  revenue: number;
  adSpend: number;
  margin: number;
}

export interface DreResponse {
  year: number;
  month: number;
  hasData: boolean;
  summary: DreSummary;
  lines: DreLine[];
  weeklyEvolution: DreDataPoint[];
}
