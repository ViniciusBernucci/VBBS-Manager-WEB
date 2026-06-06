import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';

interface Campaign {
  label: string;
  value: string;
}

interface DateRangeOption {
  label: string;
  value: string;
}

interface CreativeMetric {
  name: string;
  spend: number;
  cpa: number;
  ctr: number;
  cpm: number;
  frequency: number;
  conversions: number;
  status: 'green' | 'yellow' | 'red';
}

interface KpiCard {
  label: string;
  value: string;
  previous: string;
  delta: string;
  trendGood: boolean;
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
    SelectModule,
    TableModule,
    TagModule,
    TooltipModule,
  ],
  templateUrl: './resumo.component.html',
  styleUrl: './resumo.component.scss',
})
export class TrafegoResumoComponent {
  readonly campaigns: Campaign[] = [
    { label: 'Todas as campanhas', value: 'all' },
    { label: 'Reaper Iniciantes - Conversão', value: 'camp-1' },
    { label: 'Reaper Avançado - Escala', value: 'camp-2' },
    { label: 'Retargeting - 7 dias', value: 'camp-3' },
    { label: 'LAL Compradores - 2%', value: 'camp-4' },
  ];

  readonly dateRanges: DateRangeOption[] = [
    { label: 'Hoje', value: 'today' },
    { label: 'Ontem', value: 'yesterday' },
    { label: 'Últimos 7 dias', value: '7d' },
    { label: 'Últimos 30 dias', value: '30d' },
    { label: 'Personalizado', value: 'custom' },
  ];

  readonly selectedCampaign = signal('all');
  readonly selectedRange = signal('7d');
  customDateRange: Date[] | null = null;

  readonly isCustomRange = computed(() => this.selectedRange() === 'custom');

  get selectedCampaignValue(): string { return this.selectedCampaign(); }
  set selectedCampaignValue(v: string) { this.selectedCampaign.set(v); }

  get selectedRangeValue(): string { return this.selectedRange(); }
  set selectedRangeValue(v: string) { this.selectedRange.set(v); }

  readonly kpis = computed<KpiCard[]>(() => {
    const range = this.selectedRange();

    if (range === 'today' || range === 'yesterday') {
      return [
        { label: 'CPA', value: 'R$ 42,14', previous: 'R$ 48,60', delta: '-13,2%', trendGood: true },
        { label: 'Vendas no período', value: '7', previous: '5', delta: '+40,0%', trendGood: true },
        { label: 'Frequência média', value: '2,6', previous: '2,4', delta: '+8,3%', trendGood: false },
        { label: 'CTR médio', value: '1,54%', previous: '1,28%', delta: '+20,3%', trendGood: true },
        { label: 'CPM', value: 'R$ 17,80', previous: 'R$ 16,40', delta: '+8,5%', trendGood: false },
      ];
    }

    if (range === '30d') {
      return [
        { label: 'CPA', value: 'R$ 47,30', previous: 'R$ 54,20', delta: '-12,7%', trendGood: true },
        { label: 'Vendas no período', value: '198', previous: '172', delta: '+15,1%', trendGood: true },
        { label: 'Frequência média', value: '3,1', previous: '2,7', delta: '+14,8%', trendGood: false },
        { label: 'CTR médio', value: '1,38%', previous: '1,21%', delta: '+14,0%', trendGood: true },
        { label: 'CPM', value: 'R$ 19,20', previous: 'R$ 17,60', delta: '+9,1%', trendGood: false },
      ];
    }

    return [
      { label: 'CPA', value: 'R$ 45,20', previous: 'R$ 52,10', delta: '-13,2%', trendGood: true },
      { label: 'Vendas no período', value: '47', previous: '39', delta: '+20,5%', trendGood: true },
      { label: 'Frequência média', value: '2,8', previous: '2,4', delta: '+16,7%', trendGood: false },
      { label: 'CTR médio', value: '1,42%', previous: '1,18%', delta: '+20,3%', trendGood: true },
      { label: 'CPM', value: 'R$ 18,50', previous: 'R$ 16,80', delta: '+10,1%', trendGood: false },
    ];
  });

  readonly creatives: CreativeMetric[] = [
    { name: 'Beat Drop - Hook',   spend: 580, cpa: 38.67, ctr: 1.82, cpm: 17.2, frequency: 2.1, conversions: 15, status: 'green' },
    { name: 'Tutorial Rápido',    spend: 420, cpa: 42.00, ctr: 1.54, cpm: 18.5, frequency: 2.3, conversions: 10, status: 'green' },
    { name: 'Depoimento Aluno',   spend: 310, cpa: 51.67, ctr: 1.23, cpm: 19.8, frequency: 3.1, conversions:  6, status: 'yellow' },
    { name: 'Antes e Depois',     spend: 280, cpa: 56.00, ctr: 0.98, cpm: 21.4, frequency: 3.8, conversions:  5, status: 'yellow' },
    { name: 'Oferta Direta',      spend: 190, cpa: 63.33, ctr: 0.76, cpm: 24.6, frequency: 4.2, conversions:  3, status: 'red' },
  ];

  readonly totalSpend = this.creatives.reduce((s, c) => s + c.spend, 0);
  readonly totalConversions = this.creatives.reduce((s, c) => s + c.conversions, 0);

  readonly dailyChartData = {
    labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
    datasets: [
      {
        label: 'Gasto (R$)',
        data: [280, 320, 290, 310, 330, 350, 295],
        borderColor: '#E8604C',
        backgroundColor: 'rgba(232,96,76,0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        borderWidth: 2,
        yAxisID: 'y',
      },
      {
        label: 'Vendas',
        data: [5, 6, 6, 7, 7, 8, 7],
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

  readonly ctrChartData = {
    labels: ['Beat Drop - Hook', 'Tutorial Rápido', 'Depoimento Aluno', 'Antes e Depois', 'Oferta Direta'],
    datasets: [
      {
        label: 'CTR (%)',
        data: [1.82, 1.54, 1.23, 0.98, 0.76],
        backgroundColor: [
          'rgba(62,207,160,0.7)',
          'rgba(62,207,160,0.7)',
          'rgba(245,144,74,0.7)',
          'rgba(245,144,74,0.7)',
          'rgba(232,96,76,0.7)',
        ],
        borderColor: ['#3ECFA0', '#3ECFA0', '#F5904A', '#F5904A', '#E8604C'],
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  readonly dailyChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index' as const, intersect: false },
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { boxWidth: 10, padding: 16, color: '#8C93A8' },
      },
    },
    scales: {
      y: {
        type: 'linear' as const,
        position: 'left' as const,
        ticks: { callback: (v: number | string) => `R$${v}`, color: '#545C73' },
        grid: { color: 'rgba(255,255,255,0.04)' },
      },
      y1: {
        type: 'linear' as const,
        position: 'right' as const,
        grid: { display: false },
        ticks: { color: '#545C73', stepSize: 1 },
      },
      x: { grid: { display: false }, ticks: { color: '#545C73' } },
    },
  };

  readonly ctrChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: { parsed: { x: number } }) => `CTR: ${ctx.parsed.x.toFixed(2)}%`,
        },
      },
    },
    scales: {
      x: {
        ticks: { callback: (v: number | string) => `${v}%`, color: '#545C73' },
        grid: { color: 'rgba(255,255,255,0.04)' },
      },
      y: {
        grid: { display: false },
        ticks: { color: '#8C93A8', font: { size: 11 } },
      },
    },
  };

  readonly statusConfig: { [key: string]: { label: string; severity: 'success' | 'warn' | 'danger' } } = {
    green:  { label: 'Bom',     severity: 'success' },
    yellow: { label: 'Atenção', severity: 'warn' },
    red:    { label: 'Crítico', severity: 'danger' },
  };

  brl(value: number): string {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  trendClass(kpi: KpiCard): string {
    const isPositive = kpi.delta.startsWith('+');
    return (kpi.trendGood && isPositive) || (!kpi.trendGood && !isPositive) ? 'positive' : 'negative';
  }

  trendIcon(kpi: KpiCard): string {
    return kpi.delta.startsWith('+') ? 'pi pi-arrow-up' : 'pi pi-arrow-down';
  }
}
