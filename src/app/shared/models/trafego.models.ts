export interface TrafficKpis {
  totalSpend: number;
  totalConversions: number;
  cpa: number;
  avgFrequency: number;
  avgCtr: number;
  avgCpm: number;
}

export interface DailyStatPoint {
  date: string;
  spend: number;
  conversions: number;
  revenue: number;
}

export interface AdInsightRow {
  adId: string;
  adName: string;
  adSetName: string;
  campaignName: string;
  spend: number;
  conversions: number;
  cpa: number;
  ctr: number;
  cpm: number;
  frequency: number;
  status: 'green' | 'yellow' | 'red' | 'gray' | 'no_result';
}

export interface AdSetInsightRow {
  adSetId: string;
  adSetName: string;
  campaignName: string;
  spend: number;
  conversions: number;
  cpa: number;
  ctr: number;
  cpm: number;
  frequency: number;
}

export interface CampaignInsightRow {
  campaignId: string;
  campaignName: string;
  spend: number;
  conversions: number;
  cpa: number;
  ctr: number;
  cpm: number;
  frequency: number;
}

export interface TrafficOverviewResponse {
  since: string;
  until: string;
  hasData: boolean;
  kpis: TrafficKpis;
  dailyStats: DailyStatPoint[];
  ads: AdInsightRow[];
  adSets: AdSetInsightRow[];
  campaigns: CampaignInsightRow[];
}

export interface TrafficSyncRequest {
  year: number;
  month: number;
}

export interface TrafficSyncResponse {
  campaigns: number;
  adSets: number;
  ads: number;
  since: string;
  until: string;
  message: string;
}
