import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { PlanningService } from '../../core/services/planning.service';
import { UpdateFinancialConfigRequest } from '../../shared/models/planning.models';

@Component({
  selector: 'app-financial-config',
  standalone: true,
  imports: [FormsModule, ButtonModule, CardModule, DividerModule, InputNumberModule, ToastModule],
  providers: [MessageService],
  templateUrl: './financial-config.component.html',
  styleUrl: './financial-config.component.scss',
})
export class FinancialConfigComponent implements OnInit {
  private readonly planningService = inject(PlanningService);
  private readonly messageService = inject(MessageService);

  readonly loading = signal(false);
  readonly saving = signal(false);

  readonly form = signal<UpdateFinancialConfigRequest>({
    monthlyGrossRevenue: 0,
    monthlyAdSpend: 0,
    hotmartFeePercent: 0.084,
    hotmartFixedFeePerTransaction: 0.54,
    installmentFeePercent: 0.0219,
    installmentSalesPercent: 0.33,
    federalTaxPercent: 0.06,
    refundRatePercent: 0.01,
    metaAdsTaxPercent: 0.10,
    accountingCost: 0,
    invoicingCost: 0,
    manychatCost: 0,
    hotmartPlayerCost: 0,
  });

  ngOnInit() {
    this.load();
  }

  private load() {
    this.loading.set(true);
    this.planningService.getFinancialConfig().subscribe({
      next: (cfg) => {
        this.form.set({ ...cfg });
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível carregar as configurações.' });
      },
    });
  }

  set(field: keyof UpdateFinancialConfigRequest, value: number) {
    this.form.update((f) => ({ ...f, [field]: value }));
  }

  save() {
    this.saving.set(true);
    this.planningService.updateFinancialConfig(this.form()).subscribe({
      next: () => {
        this.saving.set(false);
        this.messageService.add({ severity: 'success', summary: 'Salvo', detail: 'Configurações salvas com sucesso.' });
      },
      error: () => {
        this.saving.set(false);
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao salvar configurações.' });
      },
    });
  }
}
