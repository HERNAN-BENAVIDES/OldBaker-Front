import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-oauth-callback',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './oauth-callback.html',
  styleUrls: ['./oauth-callback.css']
})
export class OauthCallback implements OnInit {
  message = 'Procesando autenticación...';

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    // Primero revisar el parámetro 'data' que viene codificado por el backend
    const dataParam = this.route.snapshot.queryParamMap.get('data') || this.route.snapshot.fragment;
    if (dataParam) {
      let decoded: any = null;
      try {
        const jsonStr = decodeURIComponent(dataParam);
        decoded = JSON.parse(jsonStr);
      } catch (e) {
        // no es un JSON codificado; intentar parsear directamente si es posible
        try {
          decoded = JSON.parse(dataParam);
        } catch (e) {
          decoded = null;
        }
      }

      if (decoded) {
        // Intentar extraer usuario y token según varias formas posibles
        const user = decoded?.data?.data ?? decoded?.data ?? decoded?.user ?? decoded?.usuario ?? null;
        const token = decoded?.token ?? decoded?.accessToken ?? decoded?.data?.token ?? null;

        if (user && (user.verificado === false || user['verificado'] === 'false')) {
          const userId = user?.id ?? null;
          if (userId) {
            try { sessionStorage.setItem('oauth_user_id', String(userId)); } catch (e) {}
            this.router.navigate(['/verify']);
            return;
          }
        }

        if (token) {
          // Guardar token y redirigir a landing
          try { localStorage.setItem('auth_token', token); } catch (e) {}
          this.router.navigate(['/']);
          return;
        }

        // Si el usuario viene verificado o no hay token, pero hay usuario con verificado true -> home
        if (user && (user.verificado === true || user['verificado'] === 'true')) {
          this.router.navigate(['/']);
          return;
        }
      }
    }

    // Si no llega 'data', también intentar leer un query param simple 'id' en caso de que el backend lo envie
    const idParam = this.route.snapshot.queryParamMap.get('id') || this.route.snapshot.fragment?.match(/id=(\d+)/)?.[1];
    const userId = idParam ? Number(idParam) : null;

    if (userId) {
      try { sessionStorage.setItem('oauth_user_id', String(userId)); } catch (e) {}
      this.router.navigate(['/verify']);
      return;
    }

    // Si no hay id ni data usable, mostrar mensaje y volver al inicio en 3s
    this.message = 'No se recibió información de usuario válida. Redirigiendo al inicio...';
    setTimeout(() => this.router.navigate(['/']), 3000);
  }
}
