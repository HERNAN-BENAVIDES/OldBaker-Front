import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuxiliarGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    // Verificar autenticación
    if (!this.auth.isTokenValid() && !this.auth.isLoggedIn()) {
      const encoded = encodeURIComponent(state.url || '/');
      return this.router.createUrlTree(['/auth/worker/login'], { queryParams: { returnUrl: encoded } });
    }

    // Verificar rol de auxiliar
    const user = this.auth.getCurrentUser();
    const rolRaw = user?.rol || user?.role || '';
    const userRole = String(rolRaw ?? '').toUpperCase();

    if (userRole === 'AUXILIAR') {
      return true;
    }

    // No es auxiliar, redirigir según su rol
    if (userRole === 'ADMIN' || userRole === 'ADMINISTRADOR') {
      return this.router.createUrlTree(['/admin']);
    } else {
      return this.router.createUrlTree(['/']);
    }
  }
}

