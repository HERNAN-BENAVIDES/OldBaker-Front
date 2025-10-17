import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Observable, Subscription } from 'rxjs';
import { AuthService } from '../../features/auth/services/auth.service';
import { NotificationService } from '../notification/notification.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.html',
  styleUrls: ['./header.css']
})
export class Header implements OnInit, OnDestroy {
  isAuthenticated$!: Observable<boolean>;
  currentUser$!: Observable<any>;
  showMenu = false;

  private userSub: Subscription | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private notifications: NotificationService
  ) {
    this.isAuthenticated$ = this.authService.isAuthenticated$;
    this.currentUser$ = this.authService.currentUser$;
  }

  ngOnInit(): void {
    // subscribir para debug: ver si currentUser cambia cuando se hace logout
    this.userSub = this.currentUser$.subscribe(u => {
    });
  }

  ngOnDestroy(): void {
    this.userSub?.unsubscribe();
    this.userSub = null;
  }

  toggleMenu(e?: Event) {
    if (e) { e.stopPropagation(); }
    this.showMenu = !this.showMenu;
  }

  closeMenu() {
    this.showMenu = false;
  }

  logoutMenu() {
    this.showMenu = false;
    this.logout();
  }

  avatarInitial(user: any): string {
    if (!user) return '';
    const name = user.nombre ?? user.name ?? user.email ?? '';
    return String(name).trim().charAt(0).toUpperCase() || '';
  }

  logout() {
    // Usar el servicio de notificaciones para confirmar antes de hacer logout
    this.notifications.showConfirm(
      '¿Está seguro de que desea cerrar sesión?',
      () => {
        // Usuario confirmó: realizar la petición de logout a backend con token en Bearer y cuerpo
        const currentUser = this.authService.getCurrentUser();
        const email = currentUser?.email ?? null;
        const token = this.authService.getToken();

        if (email && token) {
          this.authService.logoutRequest({ email, token }).subscribe({
            next: (res: any) => {
              try { this.notifications.showSuccess(res?.mensaje ?? 'Logout exitoso'); } catch (e) {}
              try { this.authService.clearLocalAuth(); } catch (e) {}
              try { this.router.navigate(['/']); } catch (e) {}
            },
            error: (err: any) => {
              const serverMsg = err?.error?.mensaje ?? err?.error?.message ?? err?.message ?? 'Error al cerrar sesión';
              try { this.notifications.showError(serverMsg); } catch (e) {}
              // Aun así limpiar local para evitar estar en estado inconsistente
              try { this.authService.clearLocalAuth(); } catch (e) {}
              try { this.router.navigate(['/']); } catch (e) {}
            }
          });
        } else {
          // Fallback local
          try { this.authService.clearLocalAuth(); } catch (e) {}
          try { this.notifications.showSuccess('Sesión cerrada'); } catch (e) {}
          try { this.router.navigate(['/']); } catch (e) {}
        }
      },
      () => {
        // Canceló: nada
      }
    );
  }
}
