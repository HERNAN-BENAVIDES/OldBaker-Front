import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Router } from '@angular/router';
import { AccessibilityService } from './shared/accessibility/accessibility.service';
import { AccessibilityPanelComponent } from './shared/accessibility/accessibility-panel.component';
import { ShoppingCartComponent } from './shared/shopping-cart/shopping-cart.component';
import { AuthService } from './features/auth/services/auth.service';
import { Header } from './shared/header/header';
import { Footer } from './shared/footer/footer';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, AccessibilityPanelComponent, ShoppingCartComponent, Header, Footer],
  template: `
    <app-header></app-header>
    <main class="main-content">
      <router-outlet></router-outlet>
    </main>
    <app-footer></app-footer>
    <app-accessibility-panel></app-accessibility-panel>
    <app-shopping-cart></app-shopping-cart>
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
  }

  ngOnDestroy() {
    if (this.tokenCheckSubscription) {
      this.tokenCheckSubscription.unsubscribe();
    }
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
