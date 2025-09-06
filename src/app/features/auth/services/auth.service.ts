import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import {environment} from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly baseUrl = `${environment.apiUrl}/api`;
  private currentUserSubj = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubj.asObservable();
  public isAuthenticated$ = this.currentUser$.pipe(map(u => !!u));

  constructor(private http: HttpClient) {
    // Inicializar estado desde localStorage si existe
    try {
      const raw = localStorage.getItem('auth_user');
      if (raw) {
        const user = JSON.parse(raw);
        this.currentUserSubj.next(user);
      }
    } catch (e) {
      // ignore
    }
  }

  register(payload: { nombre: string; email: string; password: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/register`, payload);
  }

  // Cambiado para aceptar el payload { idUsuario: string; codigo: string }
  verifyCode(param: { idUsuario: string; codigo: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/verify`, param);
  }

  login(payload: { email: string; password: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/login`, payload);
  }

  // Permite que otros componentes notifiquen el usuario autenticado
  setUser(user: any): void {
    try { localStorage.setItem('auth_user', JSON.stringify(user)); } catch (e) {}
    this.currentUserSubj.next(user);
  }

  // logout: llama al backend y solo tras respuesta exitosa limpia el storage y emite null
  logout(): void {
    let email: string | null = null;
    try {
      const raw = localStorage.getItem('auth_user');
      if (raw) {
        const u = JSON.parse(raw);
        email = u?.email ?? null;
      }
    } catch (e) { email = null; }

    let token: string | null = null;
    try {
      const rawToken = localStorage.getItem('auth_token');
      if (rawToken) { token = String(rawToken).trim(); }
    } catch (e) { token = null; }

    if (email && token) {
      this.logoutRequest({ email, token }).subscribe({
        next: (res) => {
          console.log('[AuthService] logoutRequest success', res);
          try { localStorage.removeItem('auth_user'); } catch (e) {}
          try { localStorage.removeItem('auth_token'); } catch (e) {}
          try { localStorage.removeItem('refresh_token'); } catch (e) {}
          try { sessionStorage.removeItem('oauth_user_id'); } catch (e) {}
          this.currentUserSubj.next(null);
        },
        error: (err) => {
          console.warn('[AuthService] logoutRequest failed, storage not cleared', err);
        }
      });
    } else {
      // fallback: limpiar localmente
      try { localStorage.removeItem('auth_user'); } catch (e) {}
      try { localStorage.removeItem('auth_token'); } catch (e) {}
      try { localStorage.removeItem('refresh_token'); } catch (e) {}
      try { sessionStorage.removeItem('oauth_user_id'); } catch (e) {}
      this.currentUserSubj.next(null);
    }
  }

  // Centraliza el guardado de tokens y usuario a partir de la respuesta del backend
  saveAuthResponse(res: any): void {
    if (!res) { return; }
    const data = res.data ?? {};
    const accessToken = data.accessToken ?? null;
    const refreshToken = data.refreshToken ?? null;
    const tokenType = data.tokenType ?? 'Bearer';
    const usuario = data.usuario ?? null;

    try {
      if (accessToken) {
        try { localStorage.setItem('auth_token', `${tokenType} ${accessToken}`); } catch (e) {}
      }
      if (refreshToken) {
        try { localStorage.setItem('refresh_token', refreshToken); } catch (e) {}
      }
      if (usuario) {
        try { localStorage.setItem('auth_user', JSON.stringify(usuario)); } catch (e) {}
        this.currentUserSubj.next(usuario);
      }
    } catch (e) {
      console.warn('No se pudo guardar auth en localStorage', e);
    }
  }

  // enviar logout al servidor. Header Authorization: Bearer <jwt>, body: { email, token: <jwt> }
  logoutRequest(payload: { email: string; token: string }): Observable<any> {
    const raw = String(payload.token ?? '').trim();
    const jwt = raw.replace(/^Bearer\s+/i, '');
    const headers = new HttpHeaders({ Authorization: `Bearer ${jwt}` });
    const body = { email: payload.email, token: jwt };
    return this.http.post(`${this.baseUrl}/user/logout`, body, { headers });  }

  // Obtener token sincronamente (puede incluir prefijo 'Bearer ')
  getToken(): string | null {
    try { return localStorage.getItem('auth_token'); } catch (e) { return null; }
  }

  // Obtener usuario actual sincronamente
  getCurrentUser(): any {
    return this.currentUserSubj.value;
  }

  // Limpiar solo datos locales de autenticación y notificar suscriptores
  clearLocalAuth(): void {
    try { localStorage.removeItem('auth_user'); } catch (e) {}
    try { localStorage.removeItem('auth_token'); } catch (e) {}
    try { localStorage.removeItem('refresh_token'); } catch (e) {}
    try { sessionStorage.removeItem('oauth_user_id'); } catch (e) {}
    this.currentUserSubj.next(null);
  }

  // Solicita recuperación de contraseña
  requestPasswordReset(email: string): Observable<any> {
    // Enviar el email como texto plano, no como JSON
    return this.http.post(`${this.baseUrl}/auth/forgot`, email, {
      headers: new HttpHeaders({ 'Content-Type': 'text/plain' })
    });
  }

  // Verificar código de restablecimiento: enviar código como texto plano
  verifyResetCode(code: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/reset/verify`, code, {
      headers: new HttpHeaders({ 'Content-Type': 'text/plain' })
    });
  }

  // Ejecutar el restablecimiento de contraseña. Body: { token, password }
  resetPassword(token: string, password: string): Observable<any> {
    const body = { token, password };
    return this.http.post(`${this.baseUrl}/auth/reset`, body);
  }
}
