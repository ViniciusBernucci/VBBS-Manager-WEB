import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import {
  FinancialConfig,
  PlanningGoalsListResponse,
  UpdateFinancialConfigRequest,
  UpdatePlanningGoalsRequest,
} from '../../shared/models/planning.models';

@Injectable({ providedIn: 'root' })
export class PlanningService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/planning`;

  getGoals() {
    return this.http.get<PlanningGoalsListResponse>(`${this.base}/goals`);
  }

  updateGoals(request: UpdatePlanningGoalsRequest) {
    return this.http.put<void>(`${this.base}/goals`, request);
  }

  getFinancialConfig() {
    return this.http.get<FinancialConfig>(`${this.base}/financial-config`);
  }

  updateFinancialConfig(request: UpdateFinancialConfigRequest) {
    return this.http.put<void>(`${this.base}/financial-config`, request);
  }
}
