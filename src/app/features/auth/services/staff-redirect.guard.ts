import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class StaffRedirectGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    // Si no hay token válido, limpiar y permitir Home
    if (!this.auth.isTokenValid()) {
      try { this.auth.clearLocalAuth(); } catch {}
      return true;
    }

    // Token válido: si el usuario es ADMIN o AUXILIAR, redirigir a su dashboard y bloquear Home
    const role = this.auth.getRole(); // normalizado en mayúsculas

    if (role === 'ADMINISTRADOR' || role === 'ADMIN') {
      return this.router.createUrlTree(['/admin']);
    }
    if (role === 'AUXILIAR') {
      return this.router.createUrlTree(['/auxiliar']);
    }

    // CLIENTE u otro: permitir Home
    return true;
  }
}
