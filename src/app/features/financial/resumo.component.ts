import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { finalize } from 'rxjs';
import { FinancialService } from '../../core/services/financial.service';
import { DailySalesOverviewResponse } from '../../shared/models/financial.models';

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
  selector: 'app-resumo',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    ChartModule,
    DatePickerModule,
    DialogModule,
    SelectModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './resumo.component.html',
  styleUrl: './resumo.component.scss',
})
export class ResumoComponent implements OnInit {
  private readonly financialService = inject(FinancialService);
  private readonly messageService = inject(MessageService);

  readonly dateRanges: DateRangeOption[] = [
    { label: 'Mês atual', value: 'current_month' },
    { label: 'Últimos 7 dias', value: '7d' },
    { label: 'Últimos 14 dias', value: '14d' },
    { label: 'Últimos 30 dias', value: '30d' },
    { label: 'Personalizado', value: 'custom' },
  ];

  readonly selectedRange = signal('current_month');
  customDateRange: Date[] | null = null;

  readonly isCustomRange = computed(() => this.selectedRange() === 'custom');

  get selectedRangeValue(): string { return this.selectedRange(); }
  set selectedRangeValue(v: string) {
    this.selectedRange.set(v);
    if (v !== 'custom') this.loadData();
  }

  readonly loading = signal(false);
  readonly data = signal<DailySalesOverviewResponse | null>(null);

  readonly _syncDialogVisible = signal(false);
  get syncDialogVisible(): boolean { return this._syncDialogVisible(); }
  set syncDialogVisible(v: boolean) { this._syncDialogVisible.set(v); }
  readonly syncing = signal(false);
  readonly syncMonths = signal<MonthOption[]>([]);
  readonly selectedSyncMonth = signal<MonthOption | null>(null);

  get syncMonthValue(): MonthOption | null { return this.selectedSyncMonth(); }
  set syncMonthValue(v: MonthOption | null) { this.selectedSyncMonth.set(v); }

  readonly dailyChartData = computed(() => {
    const d = this.data();
    if (!d?.hasData || !d.dailyStats.length) return null;
    return {
      labels: d.dailyStats.map(s => this.formatDateLabel(s.date)),
      datasets: [
        {
          label: 'Faturamento bruto (R$)',
          data: d.dailyStats.map(s => s.grossRevenue),
          borderColor: '#3ECFA0',
          backgroundColor: 'rgba(62,207,160,0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          borderWidth: 2,
          yAxisID: 'y',
        },
        {
          label: 'Receita líquida (R$)',
          data: d.dailyStats.map(s => s.netRevenue),
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
          label: 'Vendas',
          data: d.dailyStats.map(s => s.totalSales),
          borderColor: '#F5904A',
          backgroundColor: 'rgba(245,144,74,0.1)',
          fill: false,
          tension: 0.4,
          pointRadius: 4,
          borderWidth: 2,
          yAxisID: 'y1',
        },
      ],
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

  ngOnInit() {
    this.buildSyncMonths();
    this.loadData();
  }

  loadData() {
    const { since, until } = this.resolveDateRange();
    this.loading.set(true);
    this.financialService.getDailySales(since, until).pipe(
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: res => this.data.set(res),
      error: () => this.messageService.add({
        severity: 'error', summary: 'Erro', detail: 'Falha ao carregar dados de vendas.'
      }),
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
    this.financialService.syncDailySales(selected.year, selected.month).pipe(
      finalize(() => this.syncing.set(false))
    ).subscribe({
      next: res => {
        this._syncDialogVisible.set(false);
        this.messageService.add({ severity: 'success', summary: 'Sincronizado', detail: res.message });
        this.loadData();
      },
      error: err => {
        const msg = err?.error?.error ?? 'Não foi possível sincronizar com a Hotmart.';
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: msg });
      },
    });
  }

  private resolveDateRange(): { since: string; until: string } {
    const today = new Date();
    const range = this.selectedRange();

    if (range === 'current_month') {
      const first = new Date(today.getFullYear(), today.getMonth(), 1);
      return { since: this.fmtLocal(first), until: this.fmtLocal(today) };
    }

    if (range === 'custom' && this.customDateRange?.length === 2 && this.customDateRange[1]) {
      return { since: this.fmtLocal(this.customDateRange[0]), until: this.fmtLocal(this.customDateRange[1]) };
    }

    const days = range === '14d' ? 14 : range === '30d' ? 30 : 7;
    const since = new Date(today); since.setDate(since.getDate() - days + 1);
    return { since: this.fmtLocal(since), until: this.fmtLocal(today) };
  }

  // Usa partes locais do Date para evitar que toISOString() converta para UTC e desvie o dia
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

  formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }
}
