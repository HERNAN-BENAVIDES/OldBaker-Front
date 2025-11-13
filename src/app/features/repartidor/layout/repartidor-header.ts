import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';
import { NotificationService } from '../../../shared/notification/notification.service';

@Component({
  selector: 'app-repartidor-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="rep-header">
      <a routerLink="/repartidor" class="brand">OldBaker · Repartos</a>
      <div class="right">
        <div class="avatar" [title]="userName">
          {{ avatarInitial }}
        </div>
        <button class="btn-logout" type="button" (click)="logout()">Cerrar sesión</button>
      </div>
    </header>
  `,
  styles: [`
    .rep-header { display:flex; align-items:center; justify-content:space-between; padding:18px 20px; background:#2563eb; color:#fff; }
    .brand { color:#fff; text-decoration:none; font-weight:700; font-size:1.05rem; }
    .right { display:flex; align-items:center; gap:12px; }
    .avatar { width:36px; height:36px; border-radius:50%; background:#60a5fa; color:#0f172a; display:flex; align-items:center; justify-content:center; font-weight:700; }
    .btn-logout { background:#ef4444; color:#fff; border:none; padding:8px 12px; border-radius:8px; cursor:pointer; font-weight:600; }
    .btn-logout:hover { background:#dc2626; }
  `]
})
export class RepartidorHeader {
  userName = '';
  avatarInitial = '';
  constructor(private auth: AuthService, private router: Router, private notifications: NotificationService) {
    const u = this.auth.getCurrentUser();
    const name = u?.nombre || u?.name || u?.email || '';
    this.userName = name;
    this.avatarInitial = String(name).trim().charAt(0).toUpperCase();
  }

  logout() {
    this.notifications.showConfirm('¿Deseas cerrar sesión?', () => {
      try { this.auth.logout(); } catch {}
      this.notifications.showSuccess('Sesión cerrada');
      try { this.router.navigate(['/workers/auth/login']); } catch {}
    });
  }
}
