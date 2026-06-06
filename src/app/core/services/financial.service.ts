import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import {
  CashFlowResponse,
  CreateTransactionRequest,
  DailySalesResponse,
  DreResponse,
  FixedExpense,
  MonthlyFixedExpense,
  PayFixedExpenseRequest,
  SaveFixedExpenseRequest,
  SetCashFlowConfigRequest,
  UpdateTransactionRequest,
} from '../../shared/models/financial.models';

@Injectable({ providedIn: 'root' })
export class FinancialService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/financial/cash-flow`;

  getCashFlow(year: number, month: number) {
    return this.http.get<CashFlowResponse>(`${this.base}?year=${year}&month=${month}`);
  }

  setConfig(request: SetCashFlowConfigRequest) {
    return this.http.put<void>(`${this.base}/config`, request);
  }

  createTransaction(request: CreateTransactionRequest) {
    return this.http.post<{ id: string }>(`${this.base}/transactions`, request);
  }

  updateTransaction(id: string, request: UpdateTransactionRequest) {
    return this.http.put<void>(`${this.base}/transactions/${id}`, request);
  }

  deleteTransaction(id: string) {
    return this.http.delete<void>(`${this.base}/transactions/${id}`);
  }

  listFixedExpenses() {
    return this.http.get<FixedExpense[]>(`${environment.apiUrl}/financial/fixed-expenses`);
  }

  createFixedExpense(request: SaveFixedExpenseRequest) {
    return this.http.post<{ id: string }>(`${environment.apiUrl}/financial/fixed-expenses`, request);
  }

  updateFixedExpense(id: string, request: SaveFixedExpenseRequest) {
    return this.http.put<void>(`${environment.apiUrl}/financial/fixed-expenses/${id}`, request);
  }

  toggleFixedExpense(id: string) {
    return this.http.patch<void>(`${environment.apiUrl}/financial/fixed-expenses/${id}/toggle`, {});
  }

  deleteFixedExpense(id: string) {
    return this.http.delete<void>(`${environment.apiUrl}/financial/fixed-expenses/${id}`);
  }

  getMonthlyStatus(year: number, month: number) {
    return this.http.get<MonthlyFixedExpense[]>(
      `${environment.apiUrl}/financial/fixed-expenses/monthly-status?year=${year}&month=${month}`
    );
  }

  payFixedExpense(id: string, request: PayFixedExpenseRequest) {
    return this.http.post<{ paymentId: string }>(
      `${environment.apiUrl}/financial/fixed-expenses/${id}/pay`, request
    );
  }

  unpayFixedExpense(paymentId: string) {
    return this.http.delete<void>(
      `${environment.apiUrl}/financial/fixed-expenses/payments/${paymentId}`
    );
  }

  getDre(year: number, month: number) {
    return this.http.get<DreResponse>(
      `${environment.apiUrl}/financial/dre?year=${year}&month=${month}`
    );
  }

  getDailySales() {
    return this.http.get<DailySalesResponse | null>(
      `${environment.apiUrl}/financial/daily-sales`
    );
  }

  syncDailySales() {
    return this.http.post<DailySalesResponse>(
      `${environment.apiUrl}/financial/daily-sales/sync`, {}
    );
  }
}
