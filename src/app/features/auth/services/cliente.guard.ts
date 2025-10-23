import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ClienteGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    // Si el token no es válido, limpiar y redirigir a login de clientes
    if (!this.auth.isTokenValid()) {
      try { this.auth.clearLocalAuth(); } catch {}
      const encoded = encodeURIComponent(state.url || '/');
      return this.router.createUrlTree(['/login'], { queryParams: { returnUrl: encoded } });
    }

    // Verificar rol
    const userRole = this.auth.getRole();

    if (userRole === 'CLIENTE' || !userRole) {
      return true;
    }

    // Es admin o auxiliar, redirigir a su dashboard correspondiente
    if (userRole === 'ADMIN' || userRole === 'ADMINISTRADOR') {
      return this.router.createUrlTree(['/admin']);
    } else if (userRole === 'AUXILIAR') {
      return this.router.createUrlTree(['/auxiliar']);
    }

    return this.router.createUrlTree(['/']);
  }
}
