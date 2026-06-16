import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/login.component').then((m) => m.LoginComponent),
      },
    ],
  },
  {
    path: '',
    loadComponent: () =>
      import('./layout/shell/shell.component').then((m) => m.ShellComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent
          ),
      },
      {
        path: 'planning',
        loadComponent: () =>
          import('./features/planning/planning.component').then(
            (m) => m.PlanningComponent
          ),
      },
      {
        path: 'financial',
        loadComponent: () =>
          import('./features/financial/financial.component').then(
            (m) => m.FinancialComponent
          ),
        children: [
          { path: '', redirectTo: 'resumo', pathMatch: 'full' },
          {
            path: 'resumo',
            loadComponent: () =>
              import('./features/financial/resumo.component').then(
                (m) => m.ResumoComponent
              ),
          },
          {
            path: 'dre',
            loadComponent: () =>
              import('./features/financial/dre.component').then(
                (m) => m.DreComponent
              ),
          },
          {
            path: 'cash-flow',
            loadComponent: () =>
              import('./features/financial/cash-flow.component').then(
                (m) => m.CashFlowComponent
              ),
          },
          {
            path: 'contas-a-pagar',
            loadComponent: () =>
              import('./features/financial/contas-a-pagar.component').then(
                (m) => m.ContasAPagarComponent
              ),
          },
          {
            path: 'configuracoes',
            loadComponent: () =>
              import('./features/financial/financial-config.component').then(
                (m) => m.FinancialConfigComponent
              ),
          },
        ],
      },
      {
        path: 'trafego',
        loadComponent: () =>
          import('./features/trafego/trafego.component').then(
            (m) => m.TrafegoComponent
          ),
        children: [
          { path: '', redirectTo: 'resumo', pathMatch: 'full' },
          {
            path: 'resumo',
            loadComponent: () =>
              import('./features/trafego/resumo.component').then(
                (m) => m.TrafegoResumoComponent
              ),
          },
        ],
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
