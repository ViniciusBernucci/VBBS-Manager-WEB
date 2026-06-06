import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { DrawerModule } from 'primeng/drawer';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { FinancialService } from '../../core/services/financial.service';
import {
  CashFlowCategory,
  EXPENSE_CATEGORIES,
  FixedExpense,
  MONTH_NAMES,
  MonthlyFixedExpense,
} from '../../shared/models/financial.models';

@Component({
  selector: 'app-contas-a-pagar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    DatePickerModule,
    DialogModule,
    DrawerModule,
    InputNumberModule,
    InputTextModule,
    SelectModule,
    TableModule,
    Tabs, TabList, Tab, TabPanels, TabPanel,
    TagModule,
    ToastModule,
    TooltipModule,
  ],
  providers: [MessageService],
  templateUrl: './contas-a-pagar.component.html',
  styleUrl: './contas-a-pagar.component.scss',
})
export class ContasAPagarComponent implements OnInit {
  private readonly financialService = inject(FinancialService);
  private readonly messageService = inject(MessageService);

  // ── Cadastro ──────────────────────────────────────────────────────────────
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly expenses = signal<FixedExpense[]>([]);
  readonly drawerVisible = signal(false);
  readonly editingId = signal<string | null>(null);

  readonly drawerTitle = computed(() =>
    this.editingId() ? 'Editar Gasto Fixo' : 'Novo Gasto Fixo'
  );

  readonly totalActive = computed(() =>
    this.expenses().filter((e) => e.isActive).reduce((s, e) => s + e.amount, 0)
  );

  readonly categoryOptions = EXPENSE_CATEGORIES;
  readonly drawerStyle = { width: '400px' };
  form = { name: '', amount: 0, category: 'MetaAds' as CashFlowCategory };

  private reloadAfterHide = false;

  // ── Controle Mensal ───────────────────────────────────────────────────────
  readonly monthlyLoading = signal(false);
  readonly monthlyItems = signal<MonthlyFixedExpense[]>([]);

  private monthlyViewDate = new Date();
  readonly monthlyYear = signal(this.monthlyViewDate.getFullYear());
  readonly monthlyMonth = signal(this.monthlyViewDate.getMonth() + 1);
  readonly monthlyLabel = computed(
    () => `${MONTH_NAMES[this.monthlyMonth() - 1]} ${this.monthlyYear()}`
  );

  readonly paidCount = computed(() => this.monthlyItems().filter((i) => i.isPaid).length);
  readonly pendingCount = computed(() => this.monthlyItems().filter((i) => !i.isPaid).length);
  readonly totalPaid = computed(() =>
    this.monthlyItems().filter((i) => i.isPaid).reduce((s, i) => s + (i.paidAmount ?? i.budgetedAmount), 0)
  );
  readonly totalPending = computed(() =>
    this.monthlyItems().filter((i) => !i.isPaid).reduce((s, i) => s + i.budgetedAmount, 0)
  );

  // Pay dialog
  readonly payDialogVisible = signal(false);
  payingExpense = signal<MonthlyFixedExpense | null>(null);
  payForm = { amount: 0, date: new Date() };

  ngOnInit() {
    this.loadExpenses();
    this.loadMonthly();
  }

  // ── Cadastro methods ──────────────────────────────────────────────────────

  private loadExpenses() {
    this.loading.set(true);
    this.financialService.listFixedExpenses().subscribe({
      next: (res) => { this.expenses.set(res); this.loading.set(false); },
      error: () => {
        this.loading.set(false);
        this.toast('error', 'Não foi possível carregar os gastos fixos.');
      },
    });
  }

  openCreate() {
    this.editingId.set(null);
    this.form = { name: '', amount: 0, category: 'MetaAds' };
    this.drawerVisible.set(true);
  }

  openEdit(expense: FixedExpense) {
    this.editingId.set(expense.id);
    this.form = { name: expense.name, amount: expense.amount, category: expense.category };
    this.drawerVisible.set(true);
  }

  save() {
    if (!this.form.name || !this.form.amount) {
      this.toast('warn', 'Preencha nome e valor.');
      return;
    }
    this.saving.set(true);
    const id = this.editingId();
    const req = { name: this.form.name, amount: this.form.amount, category: this.form.category };

    const done = () => {
      this.saving.set(false);
      this.reloadAfterHide = true;
      this.drawerVisible.set(false);
    };
    const fail = () => { this.saving.set(false); this.toast('error', 'Não foi possível salvar.'); };

    if (id) {
      this.financialService.updateFixedExpense(id, req).subscribe({ next: done, error: fail });
    } else {
      this.financialService.createFixedExpense(req).subscribe({ next: done, error: fail });
    }
  }

  onDrawerHide() {
    if (this.reloadAfterHide) {
      this.reloadAfterHide = false;
      this.loadExpenses();
      this.loadMonthly();
    }
  }

  toggle(expense: FixedExpense) {
    this.financialService.toggleFixedExpense(expense.id).subscribe({
      next: () => { this.loadExpenses(); this.loadMonthly(); },
      error: () => this.toast('error', 'Não foi possível alterar o status.'),
    });
  }

  delete(id: string) {
    if (!confirm('Excluir este gasto fixo?')) return;
    this.financialService.deleteFixedExpense(id).subscribe({
      next: () => { this.loadExpenses(); this.loadMonthly(); this.toast('success', 'Gasto excluído.'); },
      error: () => this.toast('error', 'Não foi possível excluir.'),
    });
  }

  // ── Controle Mensal methods ───────────────────────────────────────────────

  private loadMonthly() {
    this.monthlyLoading.set(true);
    this.financialService.getMonthlyStatus(this.monthlyYear(), this.monthlyMonth()).subscribe({
      next: (res) => { this.monthlyItems.set(res); this.monthlyLoading.set(false); },
      error: () => { this.monthlyLoading.set(false); this.toast('error', 'Erro ao carregar controle mensal.'); },
    });
  }

  prevMonthly() {
    const d = new Date(this.monthlyYear(), this.monthlyMonth() - 2, 1);
    this.monthlyYear.set(d.getFullYear());
    this.monthlyMonth.set(d.getMonth() + 1);
    this.loadMonthly();
  }

  nextMonthly() {
    const d = new Date(this.monthlyYear(), this.monthlyMonth(), 1);
    this.monthlyYear.set(d.getFullYear());
    this.monthlyMonth.set(d.getMonth() + 1);
    this.loadMonthly();
  }

  openPayDialog(item: MonthlyFixedExpense) {
    this.payingExpense.set(item);
    this.payForm = { amount: item.budgetedAmount, date: new Date() };
    this.payDialogVisible.set(true);
  }

  confirmPay() {
    const item = this.payingExpense();
    if (!item) return;
    this.saving.set(true);
    this.financialService.payFixedExpense(item.fixedExpenseId, {
      year: this.monthlyYear(),
      month: this.monthlyMonth(),
      amount: this.payForm.amount,
      date: this.toIsoDate(this.payForm.date),
    }).subscribe({
      next: () => {
        this.payDialogVisible.set(false);
        this.saving.set(false);
        this.loadMonthly();
        this.toast('success', `${item.name} marcado como pago.`);
      },
      error: (err) => {
        this.saving.set(false);
        const msg = err?.error?.error ?? 'Erro ao registrar pagamento.';
        this.toast('error', msg);
      },
    });
  }

  unpay(item: MonthlyFixedExpense) {
    if (!item.paymentId) return;
    if (!confirm(`Desfazer pagamento de "${item.name}"? A transação do fluxo de caixa será removida.`)) return;
    this.financialService.unpayFixedExpense(item.paymentId).subscribe({
      next: () => { this.loadMonthly(); this.toast('success', 'Pagamento desfeito.'); },
      error: () => this.toast('error', 'Erro ao desfazer pagamento.'),
    });
  }

  // ── helpers ───────────────────────────────────────────────────────────────

  brl(value: number): string {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  formatDate(iso: string | null | undefined): string {
    if (!iso) return '—';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  }

  private toIsoDate(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  private toast(severity: string, detail: string) {
    this.messageService.add({ severity, summary: severity === 'success' ? 'Salvo' : severity === 'warn' ? 'Atenção' : 'Erro', detail });
  }
}
