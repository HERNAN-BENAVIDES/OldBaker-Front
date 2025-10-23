import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuxiliarGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    // Si el token no es válido, limpiar y redirigir a login de funcionarios
    if (!this.auth.isTokenValid()) {
      try { this.auth.clearLocalAuth(); } catch {}
      const encoded = encodeURIComponent(state.url || '/');
      return this.router.createUrlTree(['/auth/worker/login'], { queryParams: { returnUrl: encoded } });
    }

    // Verificar rol de auxiliar
    const userRole = this.auth.getRole();
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
