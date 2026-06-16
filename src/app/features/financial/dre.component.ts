import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { FinancialService } from '../../core/services/financial.service';
import { DreLine, DreResponse, MONTH_NAMES } from '../../shared/models/financial.models';

@Component({
  selector: 'app-dre',
  standalone: true,
  imports: [CommonModule, ButtonModule, ChartModule, TagModule, ToastModule],
  providers: [MessageService],
  templateUrl: './dre.component.html',
  styleUrl: './dre.component.scss',
})
export class DreComponent implements OnInit {
  private readonly financialService = inject(FinancialService);
  private readonly messageService = inject(MessageService);

  readonly loading = signal(false);
  readonly dre = signal<DreResponse | null>(null);

  private viewDate = new Date();
  readonly year = signal(this.viewDate.getFullYear());
  readonly month = signal(this.viewDate.getMonth() + 1);
  readonly monthLabel = computed(
    () => `${MONTH_NAMES[this.month() - 1]} ${this.year()}`
  );

  readonly summary = computed(() => this.dre()?.summary ?? null);

  readonly lineChartData = computed(() => {
    const weeks = this.dre()?.weeklyEvolution ?? [];
    if (!weeks.length) return null;
    return {
      labels: weeks.map((_, i) => `Sem. ${String(i + 1).padStart(2, '0')}`),
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

  readonly donutChartData = computed(() => {
    const d = this.dre();
    if (!d?.hasData) return null;

    const gross = d.summary.grossRevenue;
    if (gross <= 0) return null;

    const adSpend = this.sumLines(['ad-spend', 'meta-tax']);
    const platform = this.sumLines(['hotmart-fee', 'installment-fee']);
    const taxes = this.sumLines(['federal-tax', 'refund']);
    const fixed = this.sumLines(['tools', 'other-expense', 'config-fixed']);
    const profit = Math.max(d.summary.operationalProfit, 0);

    return {
      labels: ['Tráfego', 'Plataforma', 'Impostos', 'Fixos', 'Lucro'],
      datasets: [{
        data: [adSpend, platform, taxes, fixed, profit],
        backgroundColor: ['#E8604C', '#F5904A', '#E8C96A', '#5B9EF5', '#3ECFA0'],
        borderWidth: 0,
        hoverOffset: 6,
      }],
    };
  });

  readonly lineChartOptions = {
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

  readonly donutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' as const, labels: { boxWidth: 10, padding: 12, color: '#8C93A8' } },
    },
    cutout: '62%',
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

  rowClass(line: DreLine): string {
    if (line.kind === 'section') return 'dre-section';
    if (line.kind === 'subtotal') return 'dre-subtotal';
    if (line.kind === 'total' && line.key === 'gross') return 'dre-total-top';
    if (line.kind === 'total') return 'dre-total';
    return '';
  }

  brl(value: number): string {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  pct(value: number | null | undefined): string {
    if (value == null) return '—';
    return `${value.toFixed(1)}%`;
  }

  private load() {
    this.loading.set(true);
    this.financialService.getDre(this.year(), this.month()).subscribe({
      next: (res) => { this.dre.set(res); this.loading.set(false); },
      error: () => {
        this.loading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível carregar o DRE.' });
      },
    });
  }

  private sumLines(keys: string[]): number {
    return (this.dre()?.lines ?? [])
      .filter((l) => keys.includes(l.key))
      .reduce((s, l) => s + Math.abs(l.amount), 0);
  }

}
