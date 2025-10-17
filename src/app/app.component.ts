import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AccessibilityService } from './shared/accessibility/accessibility.service';
import { AccessibilityPanelComponent } from './shared/accessibility/accessibility-panel.component';
import { ShoppingCartComponent } from './shared/shopping-cart/shopping-cart.component';
import { AuthService } from './features/auth/services/auth.service';
import { Header } from './shared/header/header';
import { Footer } from './shared/footer/footer';
import { NotificationComponent } from './shared/notification/notification';
import { interval, Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, AccessibilityPanelComponent, ShoppingCartComponent, Header, Footer, NotificationComponent],
  template: `
    <app-header *ngIf="showClientHeader"></app-header>
    <main class="main-content">
      <router-outlet></router-outlet>
    </main>
    <app-footer *ngIf="showClientFooter"></app-footer>
    <app-accessibility-panel></app-accessibility-panel>
    <app-shopping-cart *ngIf="showCart"></app-shopping-cart>
    <app-notification></app-notification>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }
    .main-content {
      flex: 1;
      width: 100%;
    }
  `]
})
export class AppComponent implements OnInit, OnDestroy {
  private tokenCheckSubscription?: Subscription;
  private routerSubscription?: Subscription;
  showCart = true;
  showClientHeader = true;
  showClientFooter = true;

  constructor(
    private accessibilityService: AccessibilityService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    // Inicializar configuración de accesibilidad guardada
    this.accessibilityService.init();

    // Verificar el token al iniciar
    this.checkTokenValidity();

    // Verificar el token cada 5 minutos
    this.tokenCheckSubscription = interval(5 * 60 * 1000).subscribe(() => {
      this.checkTokenValidity();
    });

    // Escuchar cambios de ruta para mostrar/ocultar el carrito, header y footer
    this.updateCartVisibility(this.router.url);
    this.updateHeaderFooterVisibility(this.router.url);
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.updateCartVisibility(event.url);
        this.updateHeaderFooterVisibility(event.url);
      });
  }

  ngOnDestroy() {
    if (this.tokenCheckSubscription) {
      this.tokenCheckSubscription.unsubscribe();
    }
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  private updateCartVisibility(url: string) {
    // Ocultar el carrito en rutas de auxiliar, admin y worker-login
    const hideCartRoutes = ['/auxiliar', '/admin', '/auth/worker/login'];
    this.showCart = !hideCartRoutes.some(route => url.startsWith(route));
  }

  private updateHeaderFooterVisibility(url: string) {
    // Ocultar header y footer en rutas de workers (auxiliar, admin y worker-login)
    const workerRoutes = ['/auxiliar', '/admin', '/auth/worker/login'];
    const isWorkerRoute = workerRoutes.some(route => url.startsWith(route));

    this.showClientHeader = !isWorkerRoute;
    this.showClientFooter = !isWorkerRoute;
  }

  private checkTokenValidity() {
    const token = this.authService.getToken();

    if (token && !this.authService.isTokenValid()) {
      console.warn('[AppComponent] Token expirado detectado al verificar. Cerrando sesión...');
      this.authService.clearLocalAuth();

      // Solo redirigir si no estamos ya en login o register
      const currentUrl = this.router.url;
      if (!currentUrl.includes('/login') && !currentUrl.includes('/register')) {
        this.router.navigate(['/login'], {
          queryParams: { sessionExpired: 'true' }
        });
      }
    } else if (token) {
      // Mostrar tiempo restante en consola para debug
      const timeRemaining = this.authService.getTokenTimeRemaining();
      const minutesRemaining = Math.floor(timeRemaining / 60000);
      console.log(`[AppComponent] Token válido. Tiempo restante: ${minutesRemaining} minutos`);
    }
  }
}
