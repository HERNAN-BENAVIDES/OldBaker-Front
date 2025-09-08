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
    const currentUser = this.authService.getCurrentUser();
    const email = currentUser?.email ?? null;
    const token = this.authService.getToken();

    if (email && token) {
      this.authService.logoutRequest({ email, token }).subscribe({
        next: (res: any) => {
          // success
          try { this.notifications.showSuccess(res?.mensaje ?? 'Logout exitoso'); } catch (e) { /* ignore */ }
          try { this.authService.clearLocalAuth(); } catch (e) { /* ignore */ }
          try { this.router.navigate(['/']); } catch (e) { /* ignore */ }
        },
        error: (err: any) => {
          const serverMsg = err?.error?.mensaje ?? err?.error?.message ?? err?.message ?? 'Error al cerrar sesión';
          try { this.notifications.showError(serverMsg); } catch (e) { /* ignore */ }
          console.warn('[Header] logoutRequest error', err);
        }
      });
    } else {
      // fallback local
      try { this.authService.clearLocalAuth(); } catch (e) { /* ignore */ }
      try { this.notifications.showSuccess('Sesión cerrada'); } catch (e) { /* ignore */ }
      try { this.router.navigate(['/']); } catch (e) { /* ignore */ }
    }
  }
}
