import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, PercentPipe } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { DividerModule } from 'primeng/divider';
import { DrawerModule } from 'primeng/drawer';
import { InputNumberModule } from 'primeng/inputnumber';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { PlanningService } from '../../core/services/planning.service';
import {
  DreResult,
  FinancialConfig,
  GoalCategory,
  PlanningGoal,
  UpdateFinancialConfigRequest,
  UpdatePlanningGoalItem,
} from '../../shared/models/planning.models';

@Component({
  selector: 'app-planning',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CardModule,
    ChartModule,
    DividerModule,
    DrawerModule,
    InputNumberModule,
    TabsModule,
    TagModule,
    ToastModule,
  ],
  providers: [MessageService, CurrencyPipe, PercentPipe],
  templateUrl: './planning.component.html',
  styleUrl: './planning.component.scss',
})
export class PlanningComponent implements OnInit {
  private readonly planningService = inject(PlanningService);
  private readonly messageService = inject(MessageService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly drawerVisible = signal(false);

  readonly goals = signal<PlanningGoal[]>([]);
  readonly financialConfig = signal<FinancialConfig | null>(null);

  // Drawer edit state (flat copies for editing)
  readonly editGoals = signal<UpdatePlanningGoalItem[]>([]);
  readonly editConfig = signal<UpdateFinancialConfigRequest>({
    monthlyGrossRevenue: 12370,
    monthlyAdSpend: 8000,
    hotmartFeePercent: 0.09,
    installmentFeePercent: 0.0219,
    installmentSalesPercent: 0.33,
    federalTaxPercent: 0.06,
    refundRatePercent: 0.01,
    metaAdsTaxPercent: 0.1,
    accountingCost: 400,
    invoicingCost: 250,
    manychatCost: 448,
    hotmartPlayerCost: 69,
  });

  readonly goalsByCategory = computed(() => {
    const map = new Map<GoalCategory, PlanningGoal[]>();
    for (const g of this.goals()) {
      const list = map.get(g.category) ?? [];
      list.push(g);
      map.set(g.category, list);
    }
    return map;
  });

  readonly dre = computed<DreResult | null>(() => {
    const cfg = this.financialConfig();
    if (!cfg) return null;
    return this.computeDre(cfg);
  });

  readonly overviewChartData = computed(() => ({
    labels: ['S1','S2','S3','S4','S5','S6','S7','S8','S9','S10','S11','S12'],
    datasets: [
      {
        label: 'Otimista',
        data: [500,900,1400,2100,2800,3600,4500,5500,6500,7200,7900,8400],
        borderColor: '#9B7FE8', backgroundColor: 'rgba(155,127,232,0.06)',
        fill: true, tension: 0.4, pointRadius: 3, borderWidth: 1.5,
        borderDash: [4, 3],
      },
      {
        label: 'Realista',
        data: [400,600,850,1200,1600,2100,2600,3500,4100,4800,5500,5800],
        borderColor: '#3ECFA0', backgroundColor: 'rgba(62,207,160,0.08)',
        fill: true, tension: 0.4, pointRadius: 4, borderWidth: 2.5,
      },
      {
        label: 'Conservador',
        data: [300,450,650,900,1100,1400,1800,2200,2600,2900,3100,3200],
        borderColor: '#5B9EF5', backgroundColor: 'rgba(91,158,245,0.06)',
        fill: true, tension: 0.4, pointRadius: 3, borderWidth: 1.5,
        borderDash: [4, 3],
      },
    ],
  }));

  readonly cenariosChartData = computed(() => ({
    labels: ['Mês 1', 'Mês 2', 'Mês 3'],
    datasets: [
      {
        label: 'Conservador',
        data: [900, 2000, 3200],
        backgroundColor: 'rgba(91,158,245,0.6)', borderColor: '#5B9EF5',
        borderWidth: 1.5, borderRadius: 6,
      },
      {
        label: 'Realista',
        data: [1200, 3100, 5800],
        backgroundColor: 'rgba(62,207,160,0.6)', borderColor: '#3ECFA0',
        borderWidth: 1.5, borderRadius: 6,
      },
      {
        label: 'Otimista',
        data: [1600, 4200, 8400],
        backgroundColor: 'rgba(155,127,232,0.6)', borderColor: '#9B7FE8',
        borderWidth: 1.5, borderRadius: 6,
      },
    ],
  }));

  readonly dreChartData = computed(() => {
    const d = this.dre();
    if (!d) return null;
    return {
      labels: [
        `Tráfego + imp. (${this.pct(d.adSpendWithTax / d.grossRevenue)})`,
        `Taxa Hotmart + antec. (${this.pct(d.hotmartFee / d.grossRevenue)})`,
        `Impostos (${this.pct(d.federalTax / d.grossRevenue)})`,
        `Fixos (${this.pct(d.fixedCosts / d.grossRevenue)})`,
        `Lucro (${this.pct(d.operationalProfit / d.grossRevenue)})`,
        `Reembolsos (${this.pct(d.refundCost / d.grossRevenue)})`,
      ],
      datasets: [{
        data: [
          d.adSpendWithTax, d.hotmartFee + d.installmentFee,
          d.federalTax, d.fixedCosts,
          Math.max(d.operationalProfit, 0), d.refundCost,
        ],
        backgroundColor: ['#E8604C','#F5904A','#E8C96A','#5B9EF5','#3ECFA0','#9B7FE8'],
        borderWidth: 0, hoverOffset: 6,
      }],
    };
  });

  readonly lineChartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { boxWidth: 10, padding: 16, color: '#8C93A8' } },
      tooltip: { callbacks: { label: (c: any) => `${c.dataset.label}: R$ ${c.parsed.y.toLocaleString('pt-BR')}` } },
    },
    scales: {
      y: { ticks: { callback: (v: any) => `R$${(v/1000).toFixed(0)}k`, color: '#545C73' }, grid: { color: 'rgba(255,255,255,0.04)' } },
      x: { grid: { display: false }, ticks: { color: '#545C73' } },
    },
  };

  readonly barChartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { boxWidth: 10, padding: 16, color: '#8C93A8' } },
      tooltip: { callbacks: { label: (c: any) => `${c.dataset.label}: R$ ${c.parsed.y.toLocaleString('pt-BR')}` } },
    },
    scales: {
      y: { ticks: { callback: (v: any) => `R$${(v/1000).toFixed(0)}k`, color: '#545C73' }, grid: { color: 'rgba(255,255,255,0.04)' } },
      x: { grid: { display: false }, ticks: { color: '#545C73' } },
    },
  };

  readonly donutChartOptions = {
    responsive: true, maintainAspectRatio: false, cutout: '68%',
    plugins: {
      legend: { position: 'right', labels: { boxWidth: 10, padding: 10, color: '#8C93A8' } },
      tooltip: { callbacks: { label: (c: any) => ` R$ ${c.raw.toLocaleString('pt-BR')}` } },
    },
  };

  ngOnInit() {
    this.loadData();
  }

  private loadData() {
    this.loading.set(true);

    this.planningService.getGoals().subscribe({
      next: (res) => this.goals.set(res.goals),
      error: () => this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível carregar as metas.' }),
    });

    this.planningService.getFinancialConfig().subscribe({
      next: (cfg) => {
        this.financialConfig.set(cfg);
        this.editConfig.set({ ...cfg });
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível carregar a config financeira.' });
      },
    });
  }

  openDrawer() {
    this.editGoals.set(
      this.goals().map((g) => ({ id: g.id, targetValue: g.targetValue, currentValue: g.currentValue }))
    );
    const cfg = this.financialConfig();
    if (cfg) this.editConfig.set({ ...cfg });
    this.drawerVisible.set(true);
  }

  saveChanges() {
    this.saving.set(true);

    const goalsReq = { goals: this.editGoals() };
    const cfgReq = this.editConfig();

    this.planningService.updateGoals(goalsReq).subscribe({
      next: () => {
        this.planningService.updateFinancialConfig(cfgReq).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Salvo', detail: 'Metas atualizadas com sucesso.' });
            this.drawerVisible.set(false);
            this.saving.set(false);
            this.loadData();
          },
          error: () => {
            this.saving.set(false);
            this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao salvar configuração financeira.' });
          },
        });
      },
      error: () => {
        this.saving.set(false);
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao salvar metas.' });
      },
    });
  }

  getGoalEditItem(goalId: string): UpdatePlanningGoalItem | undefined {
    return this.editGoals().find((g) => g.id === goalId);
  }

  updateGoalTarget(goalId: string, value: number) {
    this.editGoals.update((goals) =>
      goals.map((g) => (g.id === goalId ? { ...g, targetValue: value } : g))
    );
  }

  updateGoalCurrent(goalId: string, value: number | undefined) {
    this.editGoals.update((goals) =>
      goals.map((g) => (g.id === goalId ? { ...g, currentValue: value } : g))
    );
  }

  updateConfigField(field: keyof UpdateFinancialConfigRequest, value: number) {
    this.editConfig.update((cfg) => ({ ...cfg, [field]: value }));
  }

  goalStatus(goal: PlanningGoal): 'success' | 'danger' | 'warn' {
    if (goal.currentValue === undefined || goal.currentValue === null) return 'warn';
    const ok = goal.comparisonType === 'GreaterThan'
      ? goal.currentValue >= goal.targetValue
      : goal.currentValue <= goal.targetValue;
    return ok ? 'success' : 'danger';
  }

  goalStatusLabel(goal: PlanningGoal): string {
    const status = this.goalStatus(goal);
    if (status === 'warn') return 'Sem dados';
    return status === 'success' ? 'OK' : 'Alerta';
  }

  formatValue(value: number | undefined, unit: string): string {
    if (value === undefined || value === null) return '—';
    if (unit === 'BRL') return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (unit === 'percent') return `${value}%`;
    if (unit === 'multiplier') return `${value}x`;
    return value.toString();
  }

  categoryLabel(cat: GoalCategory): string {
    const labels: Record<GoalCategory, string> = {
      WeeklyAlert: 'Métricas de Alerta — verificar toda sexta-feira',
      DailyTraffic: 'Métricas de Tráfego — verificar diariamente',
      WeeklyFinancial: 'Métricas Financeiras — verificar semanalmente',
      MonthlyGrowth: 'Métricas de Crescimento — verificar mensalmente',
    };
    return labels[cat];
  }

  private computeDre(cfg: FinancialConfig): DreResult {
    const gross = cfg.monthlyGrossRevenue;
    const hotmartFee = gross * cfg.hotmartFeePercent;
    const installmentFee = gross * cfg.installmentSalesPercent * cfg.installmentFeePercent;
    const federalTax = gross * cfg.federalTaxPercent;
    const refundCost = gross * cfg.refundRatePercent;
    const netRevenue = gross - hotmartFee - installmentFee - federalTax - refundCost;
    const adSpend = cfg.monthlyAdSpend;
    const metaAdsTax = adSpend * cfg.metaAdsTaxPercent;
    const adSpendWithTax = adSpend + metaAdsTax;
    const marginAfterTraffic = netRevenue - adSpendWithTax;
    const fixedCosts = cfg.accountingCost + cfg.invoicingCost + cfg.manychatCost + cfg.hotmartPlayerCost;
    const operationalProfit = marginAfterTraffic - fixedCosts;
    const marginPercent = gross > 0 ? (operationalProfit / gross) * 100 : 0;

    return {
      grossRevenue: gross, hotmartFee, installmentFee, federalTax,
      refundCost, netRevenue, adSpendWithTax, marginAfterTraffic,
      fixedCosts, operationalProfit, marginPercent,
      rows: [],
    };
  }

  private pct(val: number): string {
    return `${(val * 100).toFixed(1)}%`;
  }

  brl(val: number): string {
    return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  safe(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  readonly categoryOrder: GoalCategory[] = ['WeeklyAlert', 'DailyTraffic', 'WeeklyFinancial', 'MonthlyGrowth'];

  // ─── Static planning data ─────────────────────────────────────────────────

  readonly phase1Weeks = [
    { num: 1, title: 'Reestruturar campanhas + ativar 3º bump', milestone: false,
      metrics: [{label:'Tráfego/semana',value:'R$1.750',color:'orange'},{label:'Meta vendas',value:'≥ 47/sem',color:''},{label:'Ticket esperado',value:'~R$59',color:'green'}],
      actions:['Dividir em 3 campanhas: público frio (50%), remarketing (33%), laboratório (17%)','<strong>Ativar "Mixagem de Voz" (R$29,90) como 3º order bump</strong>','Pausar criativos com CPA > R$55. Manter apenas os 2-3 melhores','Separar remarketing em 3: checkout, 75% vídeo, engajamento'],
      reserve:'Reserva: ~R$700'},
    { num: 2, title: 'Teste de preço R$79,90 + novos criativos', milestone: false,
      metrics: [{label:'Tráfego/semana',value:'R$1.750',color:'orange'},{label:'CPA alvo',value:'< R$45',color:'green'},{label:'Criativos no lab',value:'2 novos',color:'purple'}],
      actions:['<strong>Teste A/B 50/50:</strong> página R$69,90 vs R$79,90','Gravar 2 criativos novos: ângulo "dor técnica" + ângulo "tutorial gratuito"','Publicar no laboratório a R$25/dia cada','Verificar Hotmart Recomenda e Cross Sell'],
      reserve:'Reserva: ~R$1.400'},
    { num: 3, title: 'Isca digital no ar + avaliar teste de preço', milestone: false,
      metrics: [{label:'Tráfego isca',value:'15% budget',color:'purple'},{label:'CPL meta',value:'R$3-8',color:'green'},{label:'Criativos vivos',value:'6-8',color:'green'}],
      actions:['<strong>Publicar ebook "Segredos da Mixagem" como isca gratuita</strong> com página de captura','Configurar sequência básica de 3 emails','Avaliar A/B de preço: se R$79,90 manteve volume, adotar','Promover criativos vencedores do lab para campanha 1'],
      reserve:'Reserva: ~R$1.400'},
    { num: 4, title: 'Sequência completa de 7 emails + balanço do mês 1', milestone: false,
      metrics: [{label:'Vendas email',value:'3-5 vendas',color:'green'},{label:'CPA geral meta',value:'< R$42',color:'green'},{label:'Ticket médio',value:'~R$60',color:'green'}],
      actions:['Expandir para 7 emails: cases, objeções, urgência, última chance','Primeiras vendas por email — <strong>CAC zero</strong>','Balanço: ticket ≥ R$60 e CPA ≤ R$42 → começando a acumular margem'],
      reserve:'Reserva: ~R$1.200'},
  ];

  readonly phase2Weeks = [
    { num: 5, title: 'Parar de antecipar o cartão — Pix já cobre o tráfego', milestone: false,
      metrics: [{label:'Pix semanal',value:'~R$1.750',color:'green'},{label:'Tráfego semanal',value:'R$1.750',color:'orange'},{label:'Ticket estimado',value:'~R$63',color:'green'}],
      actions:['Com ticket a R$63 e CPA ~R$40, lucro por venda começa a aparecer','<strong>Testar parar de antecipar:</strong> se o Pix semanal cobre o gasto, cartão fica acumulando','Escalar criativos vencedores: +20% de budget nos campeões'],
      reserve:'Reserva: ~R$2.400'},
    { num: 6, title: 'Cartão D+30 começa a cair + criar downsell Guia dos Plugins', milestone: false,
      metrics: [{label:'Cartão D+30/sem',value:'~R$580',color:'green'},{label:'Vendas email',value:'5-8/sem',color:'green'},{label:'% orgânico',value:'~10%',color:'green'}],
      actions:['Cartão das semanas 1-5 começa a cair sem taxa de 2,19%','<strong>Criar "Guia dos Plugins" (R$19,90) como downsell</strong>','Conteúdo orgânico: 3 posts/semana no Instagram'],
      reserve:'Reserva: ~R$3.800'},
    { num: 7, title: 'Publicar downsell + ticket sobe para ~R$68', milestone: false,
      metrics: [{label:'Ticket médio',value:'~R$68',color:'green'},{label:'Vendas p/ R$10k',value:'148/mês',color:'green'},{label:'CPA meta',value:'R$38',color:'green'}],
      actions:['Com ticket R$68: apenas 148 vendas/mês para bater R$10k','<strong>Ativar downsell "Guia dos Plugins"</strong> na página de obrigado','Continuar acumulando cartão D+30 sem antecipar'],
      reserve:'Reserva: ~R$5.200'},
    { num: 8, title: 'Marco: antecipação eliminada + margem real', milestone: true,
      metrics: [{label:'Reserva de caixa',value:'~R$6.500',color:'purple'},{label:'Lucro/mês',value:'~R$3.500',color:'green'},{label:'Margem',value:'~22%',color:'green'}],
      actions:['R$6.500 de reserva = 3,7 semanas de tráfego como colchão','Email gerando ~15-20 vendas/mês extras — R$1.000-1.400 sem custo de aquisição','<strong>Negociar taxa com Hotmart</strong> usando proposta da Green: pedir 7-7,5%'],
      reserve:'🏆 Ciclo de antecipação ELIMINADO'},
  ];

  readonly phase3Weeks = [
    { num: 9, title: 'Escalar tráfego para R$8.500/mês com caixa próprio', milestone: false,
      metrics: [{label:'Tráfego/semana',value:'R$2.125',color:'purple'},{label:'Fat. estimado',value:'~R$17k',color:'green'},{label:'Lucro/mês',value:'~R$4.500',color:'green'}],
      actions:['<strong>Aumentar tráfego em 20% — pago com caixa próprio, zero antecipação</strong>','Começar gravação de "Home Studio ao Spotify" (high ticket R$197)','Lista de leads com 300-500 pessoas. Nutrição por email ativa'],
      reserve:'Reserva: ~R$7.800'},
    { num: 10, title: 'Upsell do ebook + avaliar ROI do Manychat AI', milestone: false,
      metrics: [{label:'Produtos ativos',value:'+2 novos',color:'green'},{label:'Ticket médio',value:'~R$72',color:'green'},{label:'Email vendas',value:'20-25/mês',color:'green'}],
      actions:['<strong>Lançar "Guia dos Plugins em Vídeo" (R$47)</strong> como upsell do ebook','Avaliar Manychat AI (R$299/mês): se gera < 6 vendas/mês, cancelar','Orgânico começa a gerar 3-5 vendas/mês'],
      reserve:'Reserva: ~R$9.200'},
    { num: 11, title: 'Escalar para R$10.000/mês de tráfego', milestone: false,
      metrics: [{label:'Tráfego/semana',value:'R$2.500',color:'purple'},{label:'Fat. bruto/mês',value:'~R$19k',color:'green'},{label:'Lucro/mês',value:'~R$5.800',color:'green'}],
      actions:['ROAS consistente ≥ 2.0x por 2 semanas → escalar tráfego para R$10k/mês','~290 vendas tráfego + ~25 email/orgânico = ~315 vendas totais'],
      reserve:'Reserva: ~R$10.500'},
    { num: 12, title: 'Operação estável — base para R$15-30k', milestone: true,
      metrics: [{label:'Reserva',value:'R$12k+',color:'purple'},{label:'Lucro/mês',value:'R$5.800+',color:'green'},{label:'Margem',value:'~28%',color:'green'}],
      actions:['3 fontes de receita: tráfego (80%), email (12%), orgânico (8%)','Esteira: 1 isca + produto principal + 3 bumps + 1 upsell + 1 downsell + produto por email','<strong>Pronto para Horizonte 2: "Home Studio ao Spotify" + escala para R$15-20k de lucro</strong>'],
      reserve:'🏆 Base sólida para escalar com segurança'},
  ];

  readonly products = [
    {name:'Ebook Segredos da Mixagem',type:'Isca digital',price:'Grátis',status:'Ativo',statusClass:'status-active',impact:'Captura leads → sequência de emails → vendas com CAC zero',when:'Ativar: semana 3'},
    {name:'Reaper Total',type:'Produto carro-chefe',price:'R$79,90',status:'Principal',statusClass:'status-active',impact:'Teste de preço na S2. +R$10/venda se mantiver conversão',when:'Teste: semana 2'},
    {name:'Super Pack de Loops',type:'Order Bump 1',price:'R$29,90',status:'Ativo',statusClass:'status-active',impact:'+R$7,47/venda (25% conversão). Manter',when:'Já ativo'},
    {name:'Masterização in the Box',type:'Order Bump 2',price:'R$39,90',status:'Ativo',statusClass:'status-active',impact:'+R$9,97/venda (25% conversão). Manter',when:'Já ativo'},
    {name:'Segredos da Mixagem de Voz',type:'Order Bump 3 — NOVO',price:'R$29,90',status:'Novo bump',statusClass:'status-test',impact:'+R$5,98/venda (20% conversão estimada)',when:'Ativar: semana 1'},
    {name:'Up the Mix — Curso Mixagem',type:'Upsell principal',price:'R$97,00',status:'Ativo',statusClass:'status-active',impact:'+R$14,55/venda (15% conversão). Manter',when:'Já ativo'},
    {name:'O Guia dos Plugins (ebook)',type:'Downsell — NOVO',price:'R$19,90',status:'Criar',statusClass:'status-plan',impact:'+R$1,99/venda (10% dos que recusaram upsell)',when:'Criar: semana 6-7'},
    {name:'Guia dos Plugins em Vídeo',type:'Upsell do ebook — NOVO',price:'R$47,00',status:'Criar',statusClass:'status-plan',impact:'Venda por email para quem baixou ebook. 30% conversão',when:'Criar: semana 10'},
    {name:'Home Studio ao Spotify',type:'High ticket — futuro',price:'R$197',status:'Produzir',statusClass:'status-future',impact:'Produto de escala. 5% conversão. Lançar no mês 4-6',when:'Lançar: mês 4-6'},
  ];

  readonly trafficPhases = [
    { title: '<span style="color:#E8604C"><i class="pi pi-wrench"></i></span> Fase 1 — Otimização (S1-S4) · R$7.000/mês', allocs: [
      {label:'Semana 1-2',total:'R$1.750/sem',segments:[{label:'Frio',pct:50,color:'#F5904A',value:'R$880'},{label:'Rmkt',pct:33,color:'#3ECFA0',value:'R$570'},{label:'Lab',pct:17,color:'#9B7FE8',value:'R$300'}]},
      {label:'Semana 3-4',total:'R$1.750/sem',segments:[{label:'Frio',pct:52,color:'#F5904A',value:'R$910'},{label:'Rmkt',pct:30,color:'#3ECFA0',value:'R$530'},{label:'Lab',pct:18,color:'#9B7FE8',value:'R$310'}]},
    ]},
    { title: '<span style="color:#3ECFA0"><i class="pi pi-leaf"></i></span> Fase 2 — Margem cresce (S5-S8) · R$7.000-8.000/mês', allocs: [
      {label:'Semana 5-6',total:'R$1.775/sem',segments:[{label:'Frio',pct:56,color:'#F5904A',value:'R$985'},{label:'Rmkt',pct:30,color:'#3ECFA0',value:'R$535'},{label:'Lab',pct:14,color:'#9B7FE8',value:'R$255'}]},
      {label:'Semana 7-8',total:'R$1.885/sem',segments:[{label:'Frio',pct:57,color:'#F5904A',value:'R$1.075'},{label:'Rmkt',pct:29,color:'#3ECFA0',value:'R$547'},{label:'Lab',pct:14,color:'#9B7FE8',value:'R$263'}]},
    ]},
    { title: '<span style="color:#9B7FE8"><i class="pi pi-send"></i></span> Fase 3 — Escala (S9-S12) · R$8.500-10.000/mês', allocs: [
      {label:'Semana 9-10',total:'R$2.188/sem',segments:[{label:'Frio',pct:60,color:'#F5904A',value:'R$1.313'},{label:'Rmkt',pct:27,color:'#3ECFA0',value:'R$591'},{label:'Lab',pct:13,color:'#9B7FE8',value:'R$284'}]},
      {label:'Semana 11-12',total:'R$2.500/sem',segments:[{label:'Frio',pct:60,color:'#F5904A',value:'R$1.500'},{label:'Rmkt',pct:25,color:'#3ECFA0',value:'R$625'},{label:'Lab',pct:15,color:'#9B7FE8',value:'R$375'}]},
    ]},
  ];

  readonly creativeAngles = [
    {tag:'Ângulo 1 — Resultado Rápido',hook:'"Do zero à primeira música em X dias"',pain:'Ataca a ansiedade do iniciante que acha que vai demorar anos.',color:'#F5904A',formats:'<strong>Formatos:</strong><br>▶ Screencast acelerado: beat do zero no Reaper (30-60s)<br>▶ Reels: tela vazia → música tocando em 15s<br>▶ Imagem: print do projeto + "fiz em 7 dias"'},
    {tag:'Ângulo 2 — Economia',hook:'"DAW profissional por R$60 vs Pro Tools R$2.500/ano"',pain:'Ataca o medo de gastar demais. Reaper é a escolha inteligente.',color:'#3ECFA0',formats:'<strong>Formatos:</strong><br>▶ Carrossel: comparativo visual de DAWs<br>▶ Vídeo: "por que eu troquei FL Studio pelo Reaper"<br>▶ Imagem: tabela lado a lado com preços'},
    {tag:'Ângulo 3 — Prova Social',hook:'"X alunos já produziram suas primeiras músicas"',pain:'Ataca a insegurança com curso online.',color:'#9B7FE8',formats:'<strong>Formatos:</strong><br>▶ Vídeo: compilação de depoimentos (30-90s)<br>▶ Carrossel: prints de comentários<br>▶ UGC: aluno mostrando antes/depois'},
    {tag:'Ângulo 4 — Dor Técnica',hook:'"Sua mix está soando abafada? O problema é esse..."',pain:'Ataca a frustração técnica. Fix imediato e identificável.',color:'#5B9EF5',formats:'<strong>Formatos:</strong><br>▶ Screencast: mostra o problema e o fix em tempo real<br>▶ Antes/depois: áudio abafado → áudio limpo<br>▶ Imagem: espectro antes/depois com EQ'},
    {tag:'Ângulo 5 — Aspiracional',hook:'"Produtores iniciantes que hoje vivem de música"',pain:'Ataca o sonho de viver de música.',color:'#E87FB8',formats:'<strong>Formatos:</strong><br>▶ Storytelling (1-2min): "trabalhava em X, hoje produzo para Y"<br>▶ Home studio simples → resultados profissionais<br>▶ Imagem: setup + números de streams'},
    {tag:'Ângulo 6 — Tutorial / Curiosidade',hook:'"3 plugins gratuitos que mudam tudo na sua mix"',pain:'Entrega valor real no criativo, vende no CTA.',color:'#545C73',formats:'<strong>Formatos:</strong><br>▶ Tutorial curto (60-90s): ensina 1 técnica, CTA no final<br>▶ Carrossel: "5 erros que todo iniciante comete"<br>▶ Vídeo nativo: parece post orgânico, não anúncio'},
  ];

  readonly scenarios = [
    { label:'Conservador · crescimento 15-20%', profit:'R$3.200', color:'#5B9EF5',
      rows:[{label:'Faturamento bruto',value:'R$14.500'},{label:'Ticket médio',value:'R$62'},{label:'CPA médio',value:'R$42'},{label:'Margem líquida',value:'22%'}]},
    { label:'Realista · crescimento 30-40%', profit:'R$5.800', color:'#3ECFA0',
      rows:[{label:'Faturamento bruto',value:'R$19.500'},{label:'Ticket médio',value:'R$68'},{label:'CPA médio',value:'R$38'},{label:'Margem líquida',value:'28%'}]},
    { label:'Otimista · crescimento 50%+', profit:'R$8.400', color:'#9B7FE8',
      rows:[{label:'Faturamento bruto',value:'R$24.500'},{label:'Ticket médio',value:'R$75'},{label:'CPA médio',value:'R$35'},{label:'Margem líquida',value:'32%'}]},
  ];

  readonly goldenRules = [
    {title:'Regra 1 — Piso Hotmart: R$10k/mês',icon:'pi pi-lock',color:'#E8604C',text:'Se o faturamento ameaçar cair abaixo de R$10k, não corte tráfego. Reative criativos antigos, aumente budget do remarketing, envie email promocional. A taxa de 9% é valiosa demais.'},
    {title:'Regra 2 — Nunca mais antecipar',icon:'pi pi-ban',color:'#F5904A',text:'A partir da semana 5, zero antecipação. Se precisar antecipar, é sinal de que a reserva está baixa — reduza o tráfego em 10% até recompor.'},
    {title:'Regra 3 — Tráfego ≤ 50% da receita',icon:'pi pi-balance-scale',color:'#E8C96A',text:'Tráfego + imposto Meta nunca deve ultrapassar 50% do faturamento bruto. Hoje está em 71% — meta é chegar a 45-50% até a semana 8.'},
    {title:'Regra 4 — Só escalar com ROAS ≥ 2.0x',icon:'pi pi-chart-line',color:'#9B7FE8',text:'Aumentar tráfego além do nível atual só quando o ROAS bruto estiver acima de 2.0x por 2 semanas consecutivas. Otimize primeiro, escale depois.'},
    {title:'Regra 5 — Lab nunca abaixo de 13%',icon:'pi pi-flask',color:'#5B9EF5',text:'A campanha de laboratório deve receber no mínimo 13% do budget sempre. Parar de testar é a principal causa de fadiga e CPA crescente.'},
    {title:'Regra 6 — Reserva mínima: 4 semanas',icon:'pi pi-piggy-bank',color:'#3ECFA0',text:'A reserva de caixa deve ser sempre ≥ 4 semanas de investimento em tráfego. Se cair abaixo: cortar tráfego em 15% imediatamente até recompor.'},
  ];
}
