import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { FinancialService } from '../../core/services/financial.service';
import { DailySalesResponse } from '../../shared/models/financial.models';

@Component({
  selector: 'app-resumo',
  standalone: true,
  imports: [CommonModule, ButtonModule, ToastModule],
  providers: [MessageService],
  templateUrl: './resumo.component.html',
  styleUrl: './resumo.component.scss',
})
export class ResumoComponent implements OnInit {
  private readonly financialService = inject(FinancialService);
  private readonly messageService = inject(MessageService);

  readonly loading = signal(false);
  readonly syncing = signal(false);
  readonly data = signal<DailySalesResponse | null>(null);

  ngOnInit() {
    this.load();
  }

  sync() {
    this.syncing.set(true);
    this.financialService.syncDailySales().subscribe({
      next: (res) => {
        this.data.set(res);
        this.syncing.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Sincronizado',
          detail: `${res.totalSales} vendas carregadas da Hotmart.`,
        });
      },
      error: (err) => {
        this.syncing.set(false);
        const msg = err?.error?.error ?? 'Não foi possível sincronizar com a Hotmart.';
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: msg });
      },
    });
  }

  private load() {
    this.loading.set(true);
    this.financialService.getDailySales().subscribe({
      next: (res) => {
        this.data.set(res);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  brl(value: number): string {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  formatDate(iso: string): string {
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  }
}
