import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly baseUrl = 'https://localhost:8443/api/auth';
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
    return this.http.post(`${this.baseUrl}/register`, payload);
  }

  verifyCode(param: { id: number; codigo: any }):Observable<any> {
    return this.http.post(`${this.baseUrl}/verify`, param);
  }

  login(payload: { email: string; password: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/login`, payload);
  }

  // Permite que otros componentes notifiquen el usuario autenticado
  setUser(user: any) {
    try { localStorage.setItem('auth_user', JSON.stringify(user)); } catch (e) {}
    this.currentUserSubj.next(user);
  }

  logout() {
    try { localStorage.removeItem('auth_user'); } catch (e) {}
    try { localStorage.removeItem('auth_token'); } catch (e) {}
    try { localStorage.removeItem('refresh_token'); } catch (e) {}
    this.currentUserSubj.next(null);
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
        localStorage.setItem('auth_token', `${tokenType} ${accessToken}`);
      }
      if (refreshToken) {
        localStorage.setItem('refresh_token', refreshToken);
      }
      if (usuario) {
        localStorage.setItem('auth_user', JSON.stringify(usuario));
        this.currentUserSubj.next(usuario);
      }
    } catch (e) {
      console.warn('No se pudo guardar auth en localStorage', e);
    }
  }
}
