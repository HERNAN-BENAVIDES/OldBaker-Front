import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import {environment} from '../../../../environments/environment';
import { ShoppingCartService } from '../../../shared/shopping-cart/shopping-cart.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly baseUrl = `${environment.apiUrl}/api`;
  private currentUserSubj = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubj.asObservable();
  public isAuthenticated$ = this.currentUser$.pipe(map(u => !!u));

  constructor(
    private http: HttpClient,
    private shoppingCartService: ShoppingCartService
  ) {
    // Inicializar estado desde localStorage si existe y el token es válido
    this.initializeAuthState();
  }

  /**
   * Inicializa el estado de autenticación verificando la validez del token
   */
  private initializeAuthState(): void {
    try {
      const token = localStorage.getItem('auth_token');
      const raw = localStorage.getItem('auth_user');

      if (token && raw) {
        // Verificar si el token está vencido
        if (this.isTokenExpired(token)) {
          console.warn('[AuthService] Token expirado. Limpiando sesión...');
          this.clearLocalAuth();
        } else {
          // Token válido, restaurar usuario
          const user = JSON.parse(raw);
          this.currentUserSubj.next(user);
        }
      }
    } catch (e) {
      console.error('[AuthService] Error al inicializar estado de autenticación:', e);
      this.clearLocalAuth();
    }
  }

  /**
   * Decodifica un JWT sin verificar la firma
   * @param token JWT token (puede incluir el prefijo 'Bearer ')
   * @returns Payload decodificado o null si hay error
   */
  private decodeToken(token: string): any {
    try {
      // Remover prefijo 'Bearer ' si existe
      const jwt = token.replace(/^Bearer\s+/i, '').trim();

      // Un JWT tiene 3 partes separadas por puntos: header.payload.signature
      const parts = jwt.split('.');
      if (parts.length !== 3) {
        console.warn('[AuthService] Token JWT inválido');
        return null;
      }

      // Decodificar el payload (segunda parte)
      const payload = parts[1];
      const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decoded);
    } catch (e) {
      console.error('[AuthService] Error al decodificar token:', e);
      return null;
    }
  }

  /**
   * Verifica si un token JWT está vencido
   * @param token JWT token
   * @returns true si está vencido, false si aún es válido
   */
  private isTokenExpired(token: string): boolean {
    const payload = this.decodeToken(token);
    if (!payload || !payload.exp) {
      // Si no tiene exp, consideramos que está vencido por seguridad
      return true;
    }

    // exp está en segundos, Date.now() en milisegundos
    const expirationDate = payload.exp * 1000;
    const now = Date.now();

    // Agregar un margen de 60 segundos para evitar problemas de sincronización
    const isExpired = now >= (expirationDate - 60000);

    if (isExpired) {
      console.warn('[AuthService] Token vencido. Exp:', new Date(expirationDate), 'Now:', new Date(now));
    }

    return isExpired;
  }

  /**
   * Verifica si el token actual es válido
   * @returns true si el token existe y no está vencido
   */
  public isTokenValid(): boolean {
    const token = this.getToken();
    if (!token) return false;
    return !this.isTokenExpired(token);
  }

  /**
   * Obtiene el tiempo restante del token en milisegundos
   * @returns Tiempo restante o 0 si está vencido o no existe
   */
  public getTokenTimeRemaining(): number {
    const token = this.getToken();
    if (!token) return 0;

    const payload = this.decodeToken(token);
    if (!payload || !payload.exp) return 0;

    const expirationDate = payload.exp * 1000;
    const now = Date.now();
    const remaining = expirationDate - now;

    return remaining > 0 ? remaining : 0;
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

  workerLogin(payload: { email: string; password: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/worker/login`, payload);
  }

  setSession(data: any) {
    // Almacenar el token de acceso y el tipo de token en localStorage
    try {
      localStorage.setItem('auth_token', `${data.tokenType} ${data.accessToken}`);
      localStorage.setItem('refresh_token', data.refreshToken);
    } catch (e) {
      console.error('[AuthService] Error al guardar tokens en localStorage:', e);
    }

    // Actualizar el observable de usuario/logueo
    this.currentUserSubj.next(data.usuario);
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
          this.clearAuthAndCart();
        },
        error: (err) => {
          console.warn('[AuthService] logoutRequest failed, clearing local data anyway', err);
          this.clearAuthAndCart();
        }
      });
    } else {
      // fallback: limpiar localmente
      this.clearAuthAndCart();
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
    try {
      return localStorage.getItem('auth_token');
    } catch (e) {
      console.error('[AuthService] Error al obtener el token de localStorage:', e);
      return null;
    }
  }

  // Obtener usuario actual sincronamente
  getCurrentUser(): any {
    return this.currentUserSubj.value;
  }

  // Limpiar solo datos locales de autenticación y notificar suscriptores
  clearLocalAuth(): void {
    this.clearAuthAndCart();
  }

  // Método centralizado para limpiar autenticación y carrito
  private clearAuthAndCart(): void {
    try { localStorage.removeItem('auth_user'); } catch (e) {}
    try { localStorage.removeItem('auth_token'); } catch (e) {}
    try { localStorage.removeItem('refresh_token'); } catch (e) {}
    try { sessionStorage.removeItem('oauth_user_id'); } catch (e) {}

    // Limpiar el carrito de compras
    this.shoppingCartService.clearCart();

    this.currentUserSubj.next(null);
  }

  /**
   * Actualiza el perfil del usuario en el backend y actualiza el estado local
   * Espera un payload parcial con las propiedades a actualizar (por ejemplo { nombre, direccion })
   */
  updateProfile(payload: any): Observable<any> {
    // Intenta usar el token en Authorization si existe
    const token = this.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token.replace(/^Bearer\s+/i, '')}` }) : undefined;
    return this.http.patch(`${this.baseUrl}/user/profile`, payload, headers ? { headers } : undefined).pipe(map((res: any) => {
      // si el backend devuelve el usuario actualizado en res.data.usuario o res.usuario
      const updated = (res && (res.data?.usuario || res.usuario)) || res;
      if (updated) {
        try { localStorage.setItem('auth_user', JSON.stringify(updated)); } catch (e) {}
        this.currentUserSubj.next(updated);
      }
      return res;
    }));
  }

  /**
   * Desactiva (o elimina) la cuenta del usuario. Endpoint: POST /user/{idUsuario}/deactivate
   * @param idUsuario ID del usuario a desactivar
   */
  deactivateAccount(idUsuario: number): Observable<any> {
    const token = this.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token.replace(/^Bearer\s+/i, '')}` }) : undefined;
    return this.http.post(`${this.baseUrl}/user/${idUsuario}/deactivate`, {}, headers ? { headers } : undefined).pipe(map((res: any) => {
      // después de una desactivación exitosa limpiamos el local
      try { localStorage.removeItem('auth_user'); } catch (e) {}
      try { localStorage.removeItem('auth_token'); } catch (e) {}
      try { localStorage.removeItem('refresh_token'); } catch (e) {}
      this.currentUserSubj.next(null);
      return res;
    }));
  }

  /**
   * Obtiene la dirección del usuario desde el backend
   * @param idUsuario ID del usuario
   */
  getDireccionUsuario(idUsuario: number): Observable<any> {
    const token = this.getToken();
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token.replace(/^Bearer\s+/i, '')}` }) : undefined;
    return this.http.get(`${this.baseUrl}/user/direccion?idUsuario=${idUsuario}`, headers ? { headers } : undefined);
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

  // Ejecutar el restablecimiento de contraseña. Ahora envía { email, newPassword } según solicitud
  resetPassword(email: string, newPassword: string): Observable<any> {
    const body = { email, newPassword };
    return this.http.post(`${this.baseUrl}/auth/reset`, body);
  }

  /**
   * Verifica si el usuario está autenticado
   */
  isLoggedIn(): boolean {
    return !!this.currentUserSubj.value;
  }
}
