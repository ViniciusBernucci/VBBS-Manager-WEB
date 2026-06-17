import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { SkeletonModule } from 'primeng/skeleton';
import { DashboardService } from '../../core/services/dashboard.service';
import { DashboardOverviewResponse } from '../../shared/models/dashboard.models';
import { MONTH_NAMES } from '../../shared/models/financial.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ButtonModule, ChartModule, SkeletonModule],
  template: `
    <div class="page">
      <div class="dash-header">
        <h2 class="page-title">Overview</h2>
        <div class="month-nav">
          <p-button icon="pi pi-chevron-left" [text]="true" (onClick)="prevMonth()" [disabled]="loading()" />
          <span class="month-label">{{ monthLabel() }}</span>
          <p-button icon="pi pi-chevron-right" [text]="true" (onClick)="nextMonth()" [disabled]="loading()" />
        </div>
      </div>

      @if (loading()) {
        <div class="kpi-grid">
          @for (i of [1,2,3,4]; track i) {
            <div class="kpi-card">
              <p-skeleton width="6rem" height="0.875rem" styleClass="mb-2" />
              <p-skeleton width="9rem" height="1.75rem" />
            </div>
          }
        </div>
        <div class="chart-card">
          <p-skeleton width="100%" height="260px" />
        </div>
      } @else if (data(); as d) {
        @if (!d.hasData) {
          <div class="empty-state">
            <i class="pi pi-chart-line"></i>
            <p>Nenhum dado registrado para {{ monthLabel() }}.</p>
            <p class="hint">Sincronize os dados de tráfego e vendas ou cadastre lançamentos no Financeiro.</p>
          </div>
        } @else {
          <div class="kpi-grid">
            <div class="kpi-card">
              <span class="kpi-label">Receita</span>
              <span class="kpi-value" [class.off-target]="d.targetGrossRevenue > 0 && d.grossRevenue < d.targetGrossRevenue">{{ brl(d.grossRevenue) }}</span>
              @if (d.targetGrossRevenue > 0) {
                <span class="kpi-note">meta {{ brl(d.targetGrossRevenue) }}</span>
              }
            </div>
            <div class="kpi-card" [class.positive]="d.operationalProfit > 0" [class.negative]="d.operationalProfit < 0">
              <span class="kpi-label">Lucro Operacional</span>
              <span class="kpi-value" [class.off-target]="d.operationalProfit < 0">{{ brl(d.operationalProfit) }}</span>
              <span class="kpi-note">{{ d.marginPercentage.toFixed(1) }}% do faturamento</span>
            </div>
            <div class="kpi-card">
              <span class="kpi-label">Total de Vendas</span>
              <span class="kpi-value" [class.off-target]="d.targetMonthlySales > 0 && d.totalSales < d.targetMonthlySales">{{ d.totalSales }}</span>
              @if (d.targetMonthlySales > 0) {
                <span class="kpi-note">meta {{ d.targetMonthlySales }}</span>
              } @else {
                <span class="kpi-note">no mês</span>
              }
            </div>
            <div [ngClass]="['kpi-card', cpaClass(d.cpa, d.targetCpa)]">
              <span class="kpi-label">Custo por Resultado</span>
              <span class="kpi-value" [class.off-target]="d.targetCpa > 0 && d.cpa > d.targetCpa">{{ d.cpa > 0 ? brl(d.cpa) : '—' }}</span>
              @if (d.targetCpa > 0) {
                <span class="kpi-note">meta {{ brl(d.targetCpa) }}</span>
              } @else {
                <span class="kpi-note">CPA médio Meta Ads</span>
              }
            </div>
          </div>

          <div class="chart-card">
            <div class="chart-title">Evolução semanal</div>
            <div class="chart-container">
              @if (chartData(); as chart) {
                <p-chart type="line" [data]="chart" [options]="chartOptions" height="260" />
              }
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .page { padding: 0; }

    .dash-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    .page-title {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--p-text-color);
    }

    .month-nav {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .month-label {
      font-size: 0.9375rem;
      font-weight: 600;
      color: var(--p-text-color);
      min-width: 9rem;
      text-align: center;
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    @media (max-width: 900px) {
      .kpi-grid { grid-template-columns: repeat(2, 1fr); }
    }

    @media (max-width: 480px) {
      .kpi-grid { grid-template-columns: 1fr; }
    }

    .kpi-card {
      background: var(--p-surface-card);
      border: 1px solid var(--p-surface-border);
      border-radius: 0.75rem;
      padding: 1.25rem 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      transition: border-color 0.2s;
    }

    .kpi-card.positive { border-left: 3px solid #3ECFA0; }
    .kpi-card.negative { border-left: 3px solid #E8604C; }
    .kpi-card.cpa-green { border-left: 3px solid #3ECFA0; }
    .kpi-card.cpa-yellow { border-left: 3px solid #E8C96A; }
    .kpi-card.cpa-red { border-left: 3px solid #E8604C; }

    .kpi-label {
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--p-text-muted-color);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .kpi-value {
      font-size: 1.625rem;
      font-weight: 700;
      color: var(--p-text-color);
      line-height: 1.2;
    }

    .kpi-value--neutral {
      color: var(--p-text-color);
    }

    .kpi-note {
      font-size: 0.75rem;
      color: var(--p-text-muted-color);
    }

    .chart-card {
      background: var(--p-surface-card);
      border: 1px solid var(--p-surface-border);
      border-radius: 0.75rem;
      padding: 1.25rem 1.5rem;
    }

    .chart-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--p-text-muted-color);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: 1rem;
    }

    .chart-container {
      height: 260px;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      gap: 0.75rem;
      color: var(--p-text-muted-color);
    }

    .empty-state i { font-size: 2.5rem; }
    .empty-state p { margin: 0; font-size: 1rem; }
    .empty-state .hint { font-size: 0.8125rem; text-align: center; max-width: 28rem; }

    .off-target { color: #E8604C !important; }
  `],
})
export class DashboardComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);

  readonly loading = signal(false);
  readonly data = signal<DashboardOverviewResponse | null>(null);

  private viewDate = new Date();
  readonly year = signal(this.viewDate.getFullYear());
  readonly month = signal(this.viewDate.getMonth() + 1);
  readonly monthLabel = computed(() => `${MONTH_NAMES[this.month() - 1]} ${this.year()}`);

  readonly chartData = computed(() => {
    const weeks = this.data()?.weeklyEvolution ?? [];
    if (!weeks.length) return null;
    return {
      labels: weeks.map((w) => w.label),
      datasets: [
        {
          label: 'Receita',
          data: weeks.map((w) => w.revenue),
          borderColor: '#3ECFA0',
          backgroundColor: 'rgba(62,207,160,0.08)',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          borderWidth: 2,
        },
        {
          label: 'Tráfego',
          data: weeks.map((w) => w.adSpend),
          borderColor: '#E8604C',
          backgroundColor: 'rgba(232,96,76,0.06)',
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          borderWidth: 1.5,
        },
        {
          label: 'Margem',
          data: weeks.map((w) => w.margin),
          borderColor: '#5B9EF5',
          backgroundColor: 'rgba(91,158,245,0.06)',
          fill: false,
          tension: 0.4,
          pointRadius: 3,
          borderWidth: 2,
          borderDash: [4, 3],
        },
      ],
    };
  });

  readonly chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' as const, labels: { boxWidth: 10, padding: 16, color: '#8C93A8' } },
      tooltip: {
        callbacks: {
          label: (ctx: { dataset: { label?: string }; parsed: { y: number } }) => {
            const val = ctx.parsed.y.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            return `${ctx.dataset.label}: ${val}`;
          },
        },
      },
    },
    scales: {
      y: {
        ticks: { callback: (v: number | string) => `R$${(Number(v) / 1000).toFixed(0)}k`, color: '#545C73' },
        grid: { color: 'rgba(255,255,255,0.04)' },
      },
      x: { grid: { display: false }, ticks: { color: '#545C73' } },
    },
  };

  ngOnInit() {
    this.load();
  }

  prevMonth() {
    const d = new Date(this.year(), this.month() - 2, 1);
    this.year.set(d.getFullYear());
    this.month.set(d.getMonth() + 1);
    this.load();
  }

  nextMonth() {
    const d = new Date(this.year(), this.month(), 1);
    this.year.set(d.getFullYear());
    this.month.set(d.getMonth() + 1);
    this.load();
  }

  cpaClass(cpa: number, target: number): string {
    if (cpa <= 0) return '';
    const warn = target > 0 ? target * 1.2 : 70;
    if (cpa <= target) return 'cpa-green';
    if (cpa <= warn) return 'cpa-yellow';
    return 'cpa-red';
  }

  brl(value: number): string {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  private load() {
    this.loading.set(true);
    this.dashboardService.getOverview(this.year(), this.month()).subscribe({
      next: (res) => { this.data.set(res); this.loading.set(false); },
      error: () => { this.loading.set(false); },
    });
  }
}
