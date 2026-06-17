import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { DashboardOverviewResponse } from '../../shared/models/dashboard.models';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);

  getOverview(year: number, month: number) {
    return this.http.get<DashboardOverviewResponse>(
      `${environment.apiUrl}/dashboard/overview?year=${year}&month=${month}`
    );
  }
}
