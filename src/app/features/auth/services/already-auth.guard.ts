import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AlreadyAuthGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    // Si no hay token válido, permitir acceso a páginas de autenticación
    if (!this.auth.isTokenValid()) {
      return true;
    }

    // Usuario autenticado con token válido: redirigir a su destino
    const role = this.auth.getRole();
    if (role === 'ADMINISTRADOR' || role === 'ADMIN') {
      return this.router.createUrlTree(['/admin']);
    }
    if (role === 'AUXILIAR') {
      return this.router.createUrlTree(['/auxiliar']);
    }
    // Cliente u otro: ir a Home
    return this.router.createUrlTree(['/']);
  }
}

