import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-oauth-callback',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './oauth-callback.html',
  styleUrls: ['./oauth-callback.css']
})
export class OauthCallback implements OnInit {
  message = 'Procesando autenticación...';

  constructor(private route: ActivatedRoute, private router: Router, private authService: AuthService) {}

  ngOnInit(): void {
    const rawParam = this.route.snapshot.queryParamMap.get('data') || this.route.snapshot.fragment;

    if (rawParam) {
      let decoded: any;
      try {
        const jsonStr = decodeURIComponent(rawParam);
        decoded = JSON.parse(jsonStr);
      } catch {
        try { decoded = JSON.parse(rawParam as string); } catch { decoded = null; }
      }

      if (decoded) {
        // Caso 1: backend envía estructura estándar con 'success' y 'data'
        if (decoded.success && decoded.data) {
          try {
            this.authService.saveAuthResponse(decoded);
          } catch {}
          this.navigateByRole(decoded.data?.usuario?.rol);
          return;
        }

        // Caso 2: backend envía directamente { accessToken, refreshToken, tokenType?, usuario }
        const accessToken = decoded?.accessToken ?? decoded?.data?.accessToken ?? null;
        const refreshToken = decoded?.refreshToken ?? decoded?.data?.refreshToken ?? null;
        const tokenType = decoded?.tokenType ?? decoded?.data?.tokenType ?? 'Bearer';
        const usuario = decoded?.usuario ?? decoded?.data?.usuario ?? decoded?.user ?? null;

        if (accessToken && usuario) {
          const normalized = { data: { accessToken, refreshToken, tokenType, usuario } };
          try {
            this.authService.saveAuthResponse(normalized);
          } catch {}
          this.navigateByRole(usuario?.rol);
          return;
        }

        // Caso 3: sólo llegó token suelto (degradado)
        const token = decoded?.token ?? decoded?.data?.token ?? null;
        if (token) {
          try { localStorage.setItem('auth_token', token); } catch {}
          this.navigateByRole(null);
          return;
        }
      }
    }

    // Fallback: intentar leer 'id' para verificación manual
    const idParam = this.route.snapshot.queryParamMap.get('id') || this.route.snapshot.fragment?.match(/id=(\d+)/)?.[1];
    const userId = idParam ? Number(idParam) : null;

    if (userId) {
      try { sessionStorage.setItem('oauth_user_id', String(userId)); } catch {}
      this.router.navigate(['/verify']);
      return;
    }

    this.message = 'No se recibió información de usuario válida. Redirigiendo al inicio...';
    setTimeout(() => this.router.navigate(['/']), 3000);
  }

  private navigateByRole(role: string | null | undefined) {
    const r = String(role || '').toUpperCase();
    if (r === 'ADMINISTRADOR' || r === 'ADMIN') {
      this.router.navigate(['/admin']);
    } else if (r === 'AUXILIAR') {
      this.router.navigate(['/auxiliar']);
    } else {
      this.router.navigate(['/']);
    }
  }
}
