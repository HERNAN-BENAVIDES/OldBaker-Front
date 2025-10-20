import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../auth/services/auth.service';

export interface ProveedorApi {
  idProveedor: number;
  nombre: string;
  telefono: string;
  email: string;
  numeroCuenta: string;
}

@Injectable({ providedIn: 'root' })
export class ProveedoresService {
  private baseUrl = `${environment.apiUrl}/api/admin/proveedores`;

  constructor(private http: HttpClient, private auth: AuthService) {}

  private authHeaders(): HttpHeaders {
    const token = this.auth.getToken() || '';
    // token puede venir con prefijo 'Bearer '
    const jwt = token.replace(/^Bearer\s+/i, '').trim();
    return new HttpHeaders({ Authorization: `Bearer ${jwt}` });
  }

  list(): Observable<ProveedorApi[]> {
    return this.http.get<ProveedorApi[]>(this.baseUrl, { headers: this.authHeaders() });
  }

  get(id: number): Observable<ProveedorApi> {
    return this.http.get<ProveedorApi>(`${this.baseUrl}/${id}`, { headers: this.authHeaders() });
  }

  create(payload: { nombre: string; telefono: string; email: string; numeroCuenta: string }): Observable<ProveedorApi> {
    return this.http.post<ProveedorApi>(this.baseUrl, payload, { headers: this.authHeaders() });
  }

  update(id: number, payload: { nombre?: string; telefono?: string; email?: string; numeroCuenta?: string }): Observable<ProveedorApi> {
    return this.http.put<ProveedorApi>(`${this.baseUrl}/${id}`, payload, { headers: this.authHeaders() });
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`, { headers: this.authHeaders() });
  }
}
