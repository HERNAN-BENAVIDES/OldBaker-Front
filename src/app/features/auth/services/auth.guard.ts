import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    const requiredRoles: string[] | undefined = route.data?.['roles'];

    // Si no hay token válido, limpiar sesión y redirigir a la pantalla de login correspondiente
    const tokenValid = this.auth.isTokenValid();
    if (!tokenValid) {
      try { this.auth.clearLocalAuth(); } catch {}
      const encoded = encodeURIComponent(state.url || '/');
      // Si la ruta requiere rol de trabajador, mandar a login de trabajadores; si no, a login de clientes
      const needsWorker = (requiredRoles || []).some(r => ['ADMIN', 'ADMINISTRADOR', 'AUXILIAR'].includes(String(r).toUpperCase()));
      return this.router.createUrlTree(needsWorker ? ['/auth/worker/login'] : ['/login'], { queryParams: { returnUrl: encoded } });
    }

    // Usuario autenticado: si no hay roles requeridos, permitir
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Validar rol actual contra los requeridos
    const userRole = this.auth.getRole(); // ya viene normalizado en mayúsculas
    const normalizedRequired = requiredRoles.map(r => String(r).toUpperCase());

    if (normalizedRequired.includes(userRole)) {
      return true;
    }

    // Rol no autorizado: redirigir a su dashboard acorde a su rol actual
    if (userRole === 'ADMINISTRADOR' || userRole === 'ADMIN') {
      return this.router.createUrlTree(['/admin']);
    }
    if (userRole === 'AUXILIAR') {
      return this.router.createUrlTree(['/auxiliar']);
    }
    if (userRole === 'REPARTIDOR') {
      return this.router.createUrlTree(['/repartidor']);
    }
    // Cliente u otro: enviar a home
    return this.router.createUrlTree(['/']);
  }
}
