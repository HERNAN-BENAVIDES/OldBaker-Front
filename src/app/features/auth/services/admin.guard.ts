import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    // Si el token no es válido, limpiar y redirigir a login de funcionarios
    if (!this.auth.isTokenValid()) {
      try { this.auth.clearLocalAuth(); } catch {}
      const encoded = encodeURIComponent(state.url || '/');
      return this.router.createUrlTree(['/auth/worker/login'], { queryParams: { returnUrl: encoded } });
    }

    // Verificar rol de administrador
    const userRole = this.auth.getRole();
    if (userRole === 'ADMIN' || userRole === 'ADMINISTRADOR') {
      return true;
    }

    // No es administrador, redirigir según su rol
    if (userRole === 'AUXILIAR') {
      return this.router.createUrlTree(['/auxiliar']);
    } else {
      return this.router.createUrlTree(['/']);
    }
  }
}
