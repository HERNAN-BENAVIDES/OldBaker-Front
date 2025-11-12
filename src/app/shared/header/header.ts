import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Observable, Subscription, filter } from 'rxjs';
import { AuthService } from '../../features/auth/services/auth.service';
import { NotificationService } from '../notification/notification.service';
import { ShoppingCartService } from '../shopping-cart/shopping-cart.service';
import { ShoppingCart } from 'lucide-angular';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './header.html',
  styleUrls: ['./header.css']
})
export class Header implements OnInit, OnDestroy {
  isAuthenticated$!: Observable<boolean>;
  currentUser$!: Observable<any>;
  showMenu = false;
  isAuthRoute = false;
  cartCount = 0;
  readonly ShoppingCart = ShoppingCart;

  private userSub: Subscription | null = null;
  private routeSub: Subscription | null = null;
  private cartSub: Subscription | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private notifications: NotificationService,
    private cartService: ShoppingCartService
  ) {
    this.isAuthenticated$ = this.authService.isAuthenticated$;
    this.currentUser$ = this.authService.currentUser$;
  }

  ngOnInit(): void {
    // Suscripción a cambios de usuario: cerrar menú y forzar actualización cuando el usuario sea null
    this.userSub = this.currentUser$.subscribe((user) => {
      if (!user) {
        // Si el usuario fue limpiado (logout o token inválido), cerrar menú inmediatamente
        this.showMenu = false;
      }
    });

    // Suscripción al carrito para contador
    this.cartSub = this.cartService.cartItems$.subscribe(items => {
      this.cartCount = items.reduce((acc, it) => acc + (it.quantity || 0), 0);
    });

    // Detectar si estamos en una ruta de autenticación para ocultar el menú de usuario
    const compute = (url: string) => {
      this.isAuthRoute = this.isOnAuthRoute(url);
      if (this.isAuthRoute) {
        this.showMenu = false;
      }
    };
    compute(this.router.url || '');
    this.routeSub = this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe((e: any) => {
      compute(e.urlAfterRedirects || e.url || '');

      // Extra guard: si tras una navegación estamos en una ruta de login y hay usuario en memoria pero el token es inválido,
      // limpiar el estado para evitar inconsistencias (protege contra casos donde localStorage esté corrupto)
      try {
        if (this.isAuthRoute && !this.authService.isTokenValid()) {
          this.authService.clearLocalAuth();
        }
      } catch (e) {
        // ignore
      }
    });
  }

  ngOnDestroy(): void {
    this.userSub?.unsubscribe();
    this.userSub = null;
    this.routeSub?.unsubscribe();
    this.routeSub = null;
    this.cartSub?.unsubscribe();
    this.cartSub = null;
  }

  private isOnAuthRoute(url: string): boolean {
    const u = (url || '').toLowerCase();
    return u.startsWith('/login')
      || u.startsWith('/register')
      || u.startsWith('/auth/worker/login')
      || u.startsWith('/forgot-password')
      || u.startsWith('/reset-password')
      || u.startsWith('/code-password')
      || u.startsWith('/oauth-callback');
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
      '¿Deseas cerrar sesión?',
      () => {
        const currentUser = this.authService.getCurrentUser();
        const email = currentUser?.email ?? null;
        const token = this.authService.getToken();

        if (email && token) {
          this.authService.logoutRequest({ email, token }).subscribe({
            next: (res: any) => {
              try { this.notifications.showSuccess(res?.mensaje ?? 'Sesión cerrada'); } catch {}
              try { this.authService.clearLocalAuth(); } catch {}
              try { this.router.navigate(['/']); } catch {}
            },
            error: (err: any) => {
              const serverMsg = err?.error?.mensaje ?? err?.error?.message ?? err?.message ?? 'Error al cerrar sesión';
              try { this.notifications.showError(serverMsg); } catch {}
              try { this.authService.clearLocalAuth(); } catch {}
              try { this.router.navigate(['/']); } catch {}
            }
          });
        } else {
          try { this.authService.clearLocalAuth(); } catch {}
          try { this.notifications.showSuccess('Sesión cerrada'); } catch {}
          try { this.router.navigate(['/']); } catch {}
        }
      },
      () => {}
    );
  }
}
