import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../auth/services/auth.service';

export interface Insumo {
  id?: number;
  nombre: string;
  descripcion?: string;
  costoUnitario: number;
  cantidadActual: number;
}

export interface InsumoCreateRequest {
  nombre: string;
  descripcion?: string;
  costoUnitario: number;
  cantidadActual: number;
}

@Injectable({ providedIn: 'root' })
export class InsumosService {
  private baseUrl = `${environment.apiUrl}/api/admin/insumos`;

  constructor(private http: HttpClient, private auth: AuthService) {}

  private headers(): HttpHeaders {
    const token = this.auth.getToken() || '';
    const jwt = token.replace(/^Bearer\s+/i, '').trim();
    return new HttpHeaders({ Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' });
  }

  list(): Observable<Insumo[]> {
    return this.http.get<Insumo[]>(this.baseUrl, { headers: this.headers() });
  }

  get(id: number): Observable<Insumo> {
    return this.http.get<Insumo>(`${this.baseUrl}/${id}`, { headers: this.headers() });
  }

  create(payload: InsumoCreateRequest): Observable<Insumo> {
    return this.http.post<Insumo>(this.baseUrl, payload, { headers: this.headers() });
  }

  update(id: number, payload: Partial<InsumoCreateRequest>): Observable<Insumo> {
    return this.http.put<Insumo>(`${this.baseUrl}/${id}`, payload, { headers: this.headers() });
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`, { headers: this.headers() });
  }
}
