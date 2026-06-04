import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../core/services/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ButtonModule],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent {
  private readonly authService = inject(AuthService);

  readonly sidebarCollapsed = signal(false);

  readonly navItems: NavItem[] = [
    { label: 'Overview', icon: 'pi pi-home', route: '/dashboard' },
    { label: 'Financeiro', icon: 'pi pi-wallet', route: '/financial' },
    { label: 'Criativos', icon: 'pi pi-image', route: '/creatives' },
    { label: 'Funil', icon: 'pi pi-filter', route: '/funnel' },
    { label: 'Alertas', icon: 'pi pi-bell', route: '/alerts' },
  ];

  toggleSidebar() {
    this.sidebarCollapsed.update((v) => !v);
  }

  logout() {
    this.authService.logout();
  }
}
