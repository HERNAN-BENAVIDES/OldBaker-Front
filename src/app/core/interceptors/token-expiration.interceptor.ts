import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../features/auth/services/auth.service';

export const tokenExpirationInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Verificar si el token está vencido antes de cada petición
  if (!authService.isTokenValid() && authService.getToken()) {
    console.warn('[TokenExpirationInterceptor] Token expirado detectado, limpiando sesión');
    authService.clearLocalAuth();
    router.navigate(['/login']);
  }

  return next(req);
};
