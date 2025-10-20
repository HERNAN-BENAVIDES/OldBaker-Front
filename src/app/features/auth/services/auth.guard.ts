import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { NotificationService } from '../../../shared/notification/notification.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private auth: AuthService,
    private router: Router,
    private notifications: NotificationService
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    // Si no está autenticado o el token no es válido
    if (!this.auth.isLoggedIn() || !this.auth.isTokenValid()) {
      // limpiar estado local por seguridad
      try { this.auth.clearLocalAuth(); } catch (e) {}

      // Redirigir al login correcto: rutas de trabajadores usan 'auth/worker/login'
      const url = state.url || '';
      const loginRoute = url.startsWith('/admin') || url.startsWith('/auxiliar') || url.startsWith('/auth/worker')
        ? '/auth/worker/login'
        : '/login';

      // Añadir query param para informar de sesión expirada si el token fue inválido
      const queryParams = { sessionExpired: 'true' };
      this.router.navigate([loginRoute], { queryParams });
      return false;
    }

    // Usuario autenticado: comprobar rol si se definió en la ruta
  const allowedRoles: string[] | undefined = (route.data && (route.data as any)['roles']) as string[] | undefined;
    if (allowedRoles && allowedRoles.length > 0) {
      const user = this.auth.getCurrentUser();
      const rolRaw = user?.rol || user?.role || '';
      const userRole = String(rolRaw ?? '').toUpperCase();

      const normalizedAllowed = allowedRoles.map(r => String(r).toUpperCase());

      if (!normalizedAllowed.includes(userRole)) {
        // Usuario no autorizado para esta ruta
        this.notifications.showError('No tienes permisos para acceder a esta sección.');

        // Redirigir según el rol actual del usuario
        if (userRole === 'ADMINISTRADOR') {
          this.router.navigate(['/admin']);
        } else if (userRole === 'AUXILIAR') {
          this.router.navigate(['/auxiliar']);
        } else {
          // Si no es ninguno de los roles esperados, pedir re-login en la ruta pública de login
          this.router.navigate(['/']);
        }

        return false;
      }
    }

    return true;
  }
}
