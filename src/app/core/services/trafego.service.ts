import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { TrafficOverviewResponse, TrafficSyncRequest, TrafficSyncResponse } from '../../shared/models/trafego.models';

@Injectable({ providedIn: 'root' })
export class TrafegoService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/traffic`;

  getOverview(since: string, until: string, campaignIds?: string[]) {
    let url = `${this.base}/overview?since=${since}&until=${until}`;
    if (campaignIds?.length) {
      url += campaignIds.map(id => `&campaignIds=${encodeURIComponent(id)}`).join('');
    }
    return this.http.get<TrafficOverviewResponse>(url);
  }

  syncTrafficData(year: number, month: number) {
    const body: TrafficSyncRequest = { year, month };
    return this.http.post<TrafficSyncResponse>(`${this.base}/sync`, body);
  }
}
