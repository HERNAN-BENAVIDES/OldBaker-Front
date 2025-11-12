import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../auth/services/auth.service';

export interface ReporteProveedorRequest {
  detalleId?: number | null;
  razon: string;
  idProveedor?: number | null;
}

export interface ReporteProveedorResponse {
  idDevolucion: number;
  razon: string;
  esDevolucion: boolean;
  fechaDevolucion: string;
  idProveedor?: number | null;
  detalleId?: number | null;
  insumoNombre?: string | null;
  cantidadDevuelta?: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class ReportesProveedorService {
  private baseUrl = `${environment.apiUrl}/api/reportes-proveedor`;

  constructor(private http: HttpClient, private auth: AuthService) {}

  private headers(): HttpHeaders {
    const token = this.auth.getToken() || '';
    const jwt = token.replace(/^Bearer\s+/i, '').trim();
    return new HttpHeaders({ Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' });
  }

  /**
   * Obtener todos los reportes
   */
  list(): Observable<ReporteProveedorResponse[]> {
    return this.http.get<ReporteProveedorResponse[]>(this.baseUrl, { headers: this.headers() });
  }

  /**
   * Obtener un reporte por ID
   */
  get(id: number): Observable<ReporteProveedorResponse> {
    return this.http.get<ReporteProveedorResponse>(`${this.baseUrl}/${id}`, { headers: this.headers() });
  }

  /**
   * Crear un nuevo reporte
   */
  create(payload: ReporteProveedorRequest): Observable<ReporteProveedorResponse> {
    return this.http.post<ReporteProveedorResponse>(this.baseUrl, payload, { headers: this.headers() });
  }

  /**
   * Eliminar un reporte (solo si no es de devolución)
   */
  delete(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`, { headers: this.headers() });
  }
}