import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { DrawerModule } from 'primeng/drawer';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { FinancialService } from '../../core/services/financial.service';
import {
  CashFlowCategory,
  CashFlowResponse,
  CashFlowTransaction,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  MONTH_NAMES,
  TransactionType,
} from '../../shared/models/financial.models';

interface TransactionForm {
  date: Date;
  description: string;
  amount: number;
  type: TransactionType;
  category: CashFlowCategory;
  fixedExpenseId: string | null;
}

@Component({
  selector: 'app-cash-flow',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CardModule,
    DatePickerModule,
    DialogModule,
    DrawerModule,
    InputNumberModule,
    InputTextModule,
    SelectModule,
    SelectButtonModule,
    TableModule,
    TagModule,
    ToastModule,
    TooltipModule,
  ],
  providers: [MessageService],
  templateUrl: './cash-flow.component.html',
  styleUrl: './cash-flow.component.scss',
})
export class CashFlowComponent implements OnInit {
  private readonly financialService = inject(FinancialService);
  private readonly messageService = inject(MessageService);

  readonly loading = signal(false);
  readonly saving = signal(false);

  // Current month being viewed
  private viewDate = new Date();
  readonly year = signal(this.viewDate.getFullYear());
  readonly month = signal(this.viewDate.getMonth() + 1);

  readonly monthLabel = computed(
    () => `${MONTH_NAMES[this.month() - 1]} ${this.year()}`
  );

  readonly cashFlow = signal<CashFlowResponse | null>(null);

  readonly incomeTransactions = computed(() =>
    (this.cashFlow()?.transactions ?? []).filter((t) => t.type === 'Income')
  );

  readonly expenseTransactions = computed(() =>
    (this.cashFlow()?.transactions ?? []).filter((t) => t.type === 'Expense')
  );

  // Setup dialog (first time use)
  readonly setupVisible = signal(false);
  setupYear = new Date().getFullYear();
  setupMonth = new Date().getMonth() + 1;
  setupBalance = 0;

  readonly monthOptions = MONTH_NAMES.map((name, i) => ({ label: name, value: i + 1 }));

  // Transaction drawer
  readonly drawerVisible = signal(false);
  editingId = signal<string | null>(null);

  readonly drawerTitle = computed(() =>
    this.editingId() ? 'Editar Lançamento' : 'Novo Lançamento'
  );

  form: TransactionForm = this.emptyForm();
  readonly formType = signal<TransactionType>('Income');

  readonly typeOptions = [
    { label: 'Entrada', value: 'Income' },
    { label: 'Saída', value: 'Expense' },
  ];

  readonly categoryOptions = computed(() =>
    this.formType() === 'Income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
  );

  readonly unpaidFixedOptions = computed(() =>
    (this.cashFlow()?.transactions ?? [])
      .filter((t) => t.isFixed && !t.isPaid)
      .map((t) => ({ label: t.description, value: t.id }))
  );

  ngOnInit() {
    this.load();
  }

  private load() {
    this.loading.set(true);
    this.financialService.getCashFlow(this.year(), this.month()).subscribe({
      next: (res) => {
        this.cashFlow.set(res);
        this.loading.set(false);
        if (!res.isConfigured) this.setupVisible.set(true);
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível carregar o fluxo de caixa.' });
      },
    });
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

  openEditConfig() {
    const cfg = this.cashFlow()?.config;
    if (cfg) {
      this.setupYear = cfg.initialYear;
      this.setupMonth = cfg.initialMonth;
      this.setupBalance = cfg.initialBalance;
    }
    this.setupVisible.set(true);
  }

  saveSetup() {
    this.saving.set(true);
    this.financialService
      .setConfig({ initialYear: this.setupYear, initialMonth: this.setupMonth, initialBalance: this.setupBalance })
      .subscribe({
        next: () => {
          this.setupVisible.set(false);
          this.saving.set(false);
          this.load();
        },
        error: () => {
          this.saving.set(false);
          this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível salvar a configuração.' });
        },
      });
  }

  openCreate() {
    this.editingId.set(null);
    this.form = this.emptyForm();
    this.formType.set('Income');
    this.drawerVisible.set(true);
  }

  openPayFromCashFlow(t: CashFlowTransaction) {
    // Pre-fill drawer as an expense linked to the fixed expense
    this.editingId.set(null);
    this.form = {
      date: new Date(),
      description: t.description,
      amount: t.amount,
      type: 'Expense',
      category: t.category,
      fixedExpenseId: t.id,  // id is the fixedExpense id for fixed transactions
    };
    this.formType.set('Expense');
    this.drawerVisible.set(true);
  }

  openEdit(transaction: CashFlowTransaction) {
    this.editingId.set(transaction.id);
    this.form = {
      date: this.parseDate(transaction.date),
      description: transaction.description,
      amount: transaction.amount,
      type: transaction.type,
      category: transaction.category,
      fixedExpenseId: null,
    };
    this.formType.set(transaction.type);
    this.drawerVisible.set(true);
  }

  onTypeChange() {
    this.formType.set(this.form.type);
    const cats = this.formType() === 'Income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    this.form.category = cats[0].value;
  }

  saveTransaction() {
    if (!this.form.description || !this.form.amount || !this.form.date) {
      this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Preencha todos os campos.' });
      return;
    }

    this.saving.set(true);
    const request = {
      date: this.toIsoDate(this.form.date),
      description: this.form.description,
      amount: this.form.amount,
      type: this.form.type,
      category: this.form.category,
      ...(this.form.fixedExpenseId ? { fixedExpenseId: this.form.fixedExpenseId } : {}),
    };

    const id = this.editingId();

    const onSuccess = () => {
      this.drawerVisible.set(false);
      this.saving.set(false);
      this.load();
      this.messageService.add({
        severity: 'success',
        summary: 'Salvo',
        detail: id ? 'Lançamento atualizado.' : 'Lançamento criado.',
      });
    };

    const onError = () => {
      this.saving.set(false);
      this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível salvar o lançamento.' });
    };

    if (id) {
      this.financialService.updateTransaction(id, request).subscribe({ next: onSuccess, error: onError });
    } else {
      this.financialService.createTransaction(request).subscribe({ next: onSuccess, error: onError });
    }
  }

  deleteTransaction(id: string) {
    if (!confirm('Remover este lançamento?')) return;
    this.financialService.deleteTransaction(id).subscribe({
      next: () => {
        this.load();
        this.messageService.add({ severity: 'success', summary: 'Removido', detail: 'Lançamento excluído.' });
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível excluir o lançamento.' });
      },
    });
  }

  brl(value: number): string {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  formatDate(iso: string): string {
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  }

  isPositiveBalance(value: number): boolean {
    return value >= 0;
  }

  private emptyForm(): TransactionForm {
    return {
      date: new Date(),
      description: '',
      amount: 0,
      type: 'Income',
      category: 'HotmartPix',
      fixedExpenseId: null,
    };
  }

  private toIsoDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private parseDate(iso: string): Date {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
}
