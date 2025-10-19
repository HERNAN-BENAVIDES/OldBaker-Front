import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    // Excepción: permitir acceso a /mis-pedidos si viene desde MercadoPago (con status y external_reference)
    // Esto evita problemas de sesión perdida durante la redirección de pago
    if (state.url.includes('/mis-pedidos') &&
        (state.url.includes('status=') && state.url.includes('external_reference='))) {
      console.log('[AuthGuard] Permitiendo acceso temporal desde retorno de pago MercadoPago');
      return true;
    }

    // Preferir la verificación de token por seguridad
    try {
      if (this.auth.isTokenValid() || this.auth.isLoggedIn()) {
        return true;
      }
    } catch (e) {
      console.error('[AuthGuard] Error verificando auth', e);
    }

    // No autenticado: redirigir a login y pasar returnUrl (codificado para preservar querystring)
    const encoded = encodeURIComponent(state.url || '/');
    return this.router.createUrlTree(['/login'], { queryParams: { returnUrl: encoded } });
  }
}
