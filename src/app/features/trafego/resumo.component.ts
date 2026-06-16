import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { TrafegoService } from '../../core/services/trafego.service';
import { AdInsightRow, TrafficOverviewResponse } from '../../shared/models/trafego.models';

interface CampaignOption {
  label: string;
  value: string;
}

interface DateRangeOption {
  label: string;
  value: string;
}

interface MonthOption {
  label: string;
  year: number;
  month: number;
}

@Component({
  selector: 'app-trafego-resumo',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    ChartModule,
    DatePickerModule,
    DialogModule,
    MultiSelectModule,
    SelectModule,
    TableModule,
    TagModule,
    ToastModule,
    TooltipModule,
  ],
  providers: [MessageService],
  templateUrl: './resumo.component.html',
  styleUrl: './resumo.component.scss',
})
export class TrafegoResumoComponent implements OnInit {
  private readonly trafegoService = inject(TrafegoService);
  private readonly messageService = inject(MessageService);

  readonly dateRanges: DateRangeOption[] = [
    { label: 'Hoje', value: 'today' },
    { label: 'Ontem', value: 'yesterday' },
    { label: 'Últimos 7 dias', value: '7d' },
    { label: 'Últimos 14 dias', value: '14d' },
    { label: 'Últimos 20 dias', value: '20d' },
    { label: 'Últimos 30 dias', value: '30d' },
    { label: 'Personalizado', value: 'custom' },
  ];

  readonly selectedRange = signal('7d');
  customDateRange: Date[] | null = null;

  readonly isCustomRange = computed(() => this.selectedRange() === 'custom');

  get selectedRangeValue(): string { return this.selectedRange(); }
  set selectedRangeValue(v: string) {
    this.selectedRange.set(v);
    this.selectedCampaignIds.set([]);
    this.availableCampaigns.set([]);
    if (v !== 'custom') this.loadData();
  }

  // Estado de dados
  readonly loading = signal(false);
  readonly data = signal<TrafficOverviewResponse | null>(null);

  // Filtro de campanhas
  readonly availableCampaigns = signal<CampaignOption[]>([]);
  readonly selectedCampaignIds = signal<string[]>([]);

  get selectedCampaignIdsValue(): string[] { return this.selectedCampaignIds(); }
  set selectedCampaignIdsValue(v: string[]) {
    this.selectedCampaignIds.set(v);
    this.loadData();
  }

  // Estado do diálogo de sync
  readonly _syncDialogVisible = signal(false);
  get syncDialogVisible(): boolean { return this._syncDialogVisible(); }
  set syncDialogVisible(v: boolean) { this._syncDialogVisible.set(v); }
  readonly syncing = signal(false);
  readonly syncMonths = signal<MonthOption[]>([]);
  readonly selectedSyncMonth = signal<MonthOption | null>(null);

  get syncMonthValue(): MonthOption | null { return this.selectedSyncMonth(); }
  set syncMonthValue(v: MonthOption | null) { this.selectedSyncMonth.set(v); }

  // KPIs derivados dos dados reais
  readonly kpis = computed(() => {
    const d = this.data();
    if (!d?.hasData) return null;
    return d.kpis;
  });

  // Dados para os gráficos
  readonly dailyChartData = computed(() => {
    const d = this.data();
    if (!d?.hasData || !d.dailyStats.length) return null;
    return {
      labels: d.dailyStats.map(s => this.formatDateLabel(s.date)),
      datasets: [
        {
          label: 'Gasto (R$)',
          data: d.dailyStats.map(s => s.spend),
          borderColor: '#E8604C',
          backgroundColor: 'rgba(232,96,76,0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          borderWidth: 2,
          yAxisID: 'y',
        },
        {
          label: 'Receita (R$)',
          data: d.dailyStats.map(s => s.revenue),
          borderColor: '#5B9BD5',
          backgroundColor: 'rgba(91,155,213,0.08)',
          fill: false,
          tension: 0.4,
          pointRadius: 4,
          borderWidth: 2,
          borderDash: [5, 3],
          yAxisID: 'y',
        },
        {
          label: 'Resultados',
          data: d.dailyStats.map(s => s.conversions),
          borderColor: '#3ECFA0',
          backgroundColor: 'rgba(62,207,160,0.1)',
          fill: false,
          tension: 0.4,
          pointRadius: 4,
          borderWidth: 2,
          yAxisID: 'y1',
        },
      ],
    };
  });

  readonly ctrChartData = computed(() => {
    const d = this.data();
    if (!d?.hasData || !d.ads.length) return null;
    const top = d.ads.slice(0, 8);
    const colors = top.map(a =>
      a.status === 'green'     ? 'rgba(62,207,160,0.7)'  :
      a.status === 'yellow'    ? 'rgba(245,144,74,0.7)'  :
      a.status === 'no_result' ? 'rgba(232,96,76,0.5)'   :
      a.status === 'gray'      ? 'rgba(140,147,168,0.4)' :
                                 'rgba(232,96,76,0.7)'
    );
    const borders = top.map(a =>
      a.status === 'green'     ? '#3ECFA0' :
      a.status === 'yellow'    ? '#F5904A' :
      a.status === 'no_result' ? '#E8604C' :
      a.status === 'gray'      ? '#8C93A8' :
                                 '#E8604C'
    );
    return {
      labels: top.map(a => a.adName),
      datasets: [{
        label: 'CTR (%)',
        data: top.map(a => a.ctr),
        backgroundColor: colors,
        borderColor: borders,
        borderWidth: 1,
        borderRadius: 4,
      }],
    };
  });

  readonly dailyChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index' as const, intersect: false },
    plugins: {
      legend: { position: 'bottom' as const, labels: { boxWidth: 10, padding: 16, color: '#8C93A8' } },
    },
    scales: {
      y:  { type: 'linear' as const, position: 'left'  as const, ticks: { callback: (v: number | string) => `R$${v}`, color: '#545C73' }, grid: { color: 'rgba(255,255,255,0.04)' } },
      y1: { type: 'linear' as const, position: 'right' as const, grid: { display: false }, ticks: { color: '#545C73', stepSize: 1 } },
      x:  { grid: { display: false }, ticks: { color: '#545C73' } },
    },
  };

  readonly ctrChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (ctx: { parsed: { x: number } }) => `CTR: ${ctx.parsed.x.toFixed(2)}%` } },
    },
    scales: {
      x: { ticks: { callback: (v: number | string) => `${v}%`, color: '#545C73' }, grid: { color: 'rgba(255,255,255,0.04)' } },
      y: { grid: { display: false }, ticks: { color: '#8C93A8', font: { size: 11 } } },
    },
  };

  readonly statusConfig: Record<string, { label: string; severity: 'success' | 'warn' | 'danger' | 'secondary' }> = {
    green:     { label: 'Bom',       severity: 'success' },
    yellow:    { label: 'Atenção',   severity: 'warn' },
    red:       { label: 'Crítico',   severity: 'danger' },
    no_result: { label: 'Pausar',    severity: 'danger' },
    gray:      { label: 'Sem dados', severity: 'secondary' },
  };

  ngOnInit() {
    this.buildSyncMonths();
    this.loadData();
  }

  loadData() {
    const { since, until } = this.resolveDateRange();
    const campaignIds = this.selectedCampaignIds();
    this.loading.set(true);
    this.trafegoService.getOverview(since, until, campaignIds.length ? campaignIds : undefined).subscribe({
      next: res => {
        this.data.set(res);
        this.loading.set(false);
        // Atualiza o dropdown só quando não há filtro de campanha ativo
        if (!campaignIds.length && res.campaigns.length) {
          this.availableCampaigns.set(
            res.campaigns.map(c => ({ label: c.campaignName, value: c.campaignId }))
          );
        }
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao carregar dados de tráfego.' });
      },
    });
  }

  applyCustomRange() {
    if (this.customDateRange?.length === 2 && this.customDateRange[1]) {
      this.loadData();
    }
  }

  openSyncDialog() {
    this._syncDialogVisible.set(true);
  }

  closeSyncDialog() {
    this._syncDialogVisible.set(false);
  }

  confirmSync() {
    const selected = this.selectedSyncMonth();
    if (!selected) return;

    this.syncing.set(true);
    this.trafegoService.syncTrafficData(selected.year, selected.month).subscribe({
      next: res => {
        this.syncing.set(false);
        this._syncDialogVisible.set(false);
        this.messageService.add({ severity: 'success', summary: 'Sincronizado', detail: res.message });
        this.loadData();
      },
      error: () => {
        this.syncing.set(false);
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha na sincronização. Tente novamente.' });
      },
    });
  }

  // --- Helpers ---

  private resolveDateRange(): { since: string; until: string } {
    const today = new Date();
    const range = this.selectedRange();

    if (range === 'today')     return { since: this.fmtLocal(today), until: this.fmtLocal(today) };
    if (range === 'yesterday') { const y = new Date(today); y.setDate(y.getDate() - 1); return { since: this.fmtLocal(y), until: this.fmtLocal(y) }; }
    if (range === 'custom' && this.customDateRange?.length === 2 && this.customDateRange[1]) {
      return { since: this.fmtLocal(this.customDateRange[0]), until: this.fmtLocal(this.customDateRange[1]) };
    }

    const days = range === '14d' ? 14 : range === '20d' ? 20 : range === '30d' ? 30 : 7;
    const since = new Date(today); since.setDate(since.getDate() - days + 1);
    return { since: this.fmtLocal(since), until: this.fmtLocal(today) };
  }

  private fmtLocal(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private buildSyncMonths() {
    const months: MonthOption[] = [];
    const now = new Date();
    const labels = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ label: `${labels[d.getMonth()]} ${d.getFullYear()}`, year: d.getFullYear(), month: d.getMonth() + 1 });
    }
    this.syncMonths.set(months);
    this.selectedSyncMonth.set(months[0]);
  }

  private formatDateLabel(dateStr: string): string {
    const [, m, d] = dateStr.split('-');
    return `${d}/${m}`;
  }

  brl(value: number): string {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  totalSpend(ads: AdInsightRow[]): number {
    return ads.reduce((s, a) => s + a.spend, 0);
  }

  totalConversions(ads: AdInsightRow[]): number {
    return ads.reduce((s, a) => s + a.conversions, 0);
  }
}
