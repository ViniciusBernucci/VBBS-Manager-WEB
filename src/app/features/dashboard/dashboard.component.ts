import { Component } from '@angular/core';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CardModule],
  template: `
    <div class="dashboard">
      <h2 class="page-title">Overview</h2>
      <p-card>
        <p>Dashboard em construção — Fase 2.</p>
      </p-card>
    </div>
  `,
  styles: [`
    .page-title {
      margin: 0 0 1.5rem;
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--p-text-color);
    }
  `],
})
export class DashboardComponent {}
