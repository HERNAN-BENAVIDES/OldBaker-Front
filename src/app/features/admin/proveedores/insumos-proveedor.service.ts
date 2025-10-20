import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../auth/services/auth.service';

export interface InsumoProveedorResponse {
  id: number;
  nombre: string;
  descripcion: string;
  costoUnitario: number;
  fechaVencimiento?: string; // ISO date
  cantidadDisponible: number;
  idProveedor: number;
}

export interface InsumoProveedorRequest {
  nombre: string;
  descripcion: string;
  costoUnitario: number;
  fechaVencimiento?: string; // ISO date
  cantidadDisponible: number;
  idProveedor: number;
}

@Injectable({ providedIn: 'root' })
export class InsumosProveedorService {
  private baseUrl = `${environment.apiUrl}/api/insumos-proveedor`;

  constructor(private http: HttpClient, private auth: AuthService) {}

  private headers(): HttpHeaders {
    const token = this.auth.getToken() || '';
    const jwt = token.replace(/^Bearer\s+/i, '').trim();
    return new HttpHeaders({ Authorization: `Bearer ${jwt}` });
  }

  list(params?: { page?: number; size?: number; search?: string }): Observable<InsumoProveedorResponse[]> {
    let httpParams = new HttpParams();
    if (params?.page != null) httpParams = httpParams.set('page', String(params.page));
    if (params?.size != null) httpParams = httpParams.set('size', String(params.size));
    if (params?.search) httpParams = httpParams.set('search', params.search);
    return this.http.get<InsumoProveedorResponse[]>(this.baseUrl, { headers: this.headers(), params: httpParams });
  }

  paginated(page: number, size: number, search?: string): Observable<any> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('size', String(size))
      .set('search', search || '');
    return this.http.get<any>(`${this.baseUrl}/paginado`, { headers: this.headers(), params });
  }

  // Lista insumos por proveedor usando el endpoint específico
  listByProveedor(idProveedor: number): Observable<InsumoProveedorResponse[]> {
    return this.http.get<InsumoProveedorResponse[]>(`${this.baseUrl}/proveedor/${idProveedor}`, { headers: this.headers() });
  }

  create(payload: InsumoProveedorRequest): Observable<InsumoProveedorResponse> {
    return this.http.post<InsumoProveedorResponse>(this.baseUrl, payload, { headers: this.headers() });
  }

  update(id: number, payload: Partial<InsumoProveedorRequest>): Observable<InsumoProveedorResponse> {
    return this.http.put<InsumoProveedorResponse>(`${this.baseUrl}/${id}`, payload, { headers: this.headers() });
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`, { headers: this.headers() });
  }
}
