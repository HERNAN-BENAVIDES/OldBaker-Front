import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../auth/services/auth.service';

export interface DetalleProveedorPedidoResponse {
  id: number;
  cantidadInsumo: number;
  costoSubtotal: number;
  esDevuelto: boolean;
  insumo: any; // InsumoProveedorResponse shape
}

export interface PedidoInsumoResponse {
  id: number;
  nombre: string;
  descripcion?: string;
  costoTotal?: number;
  fechaPedido?: string; // ISO date
  estado?: string;
  pago?: any;
  detalles?: DetalleProveedorPedidoResponse[];
}

export interface PedidoInsumoRequest {
  nombre: string;
  descripcion?: string;
  fechaPedido?: string; // ISO date
  detalles: { insumoProveedorId: number; cantidadInsumo: number; precioUnitario: number }[];
}

@Injectable({ providedIn: 'root' })
export class PedidosService {
  // NOTE: asumo endpoint /api/admin/pedidos en el backend. Si es distinto, indícalo.
  private baseUrl = `${environment.apiUrl}/api/admin/pedidos-insumos`;

  constructor(private http: HttpClient, private auth: AuthService) {}

  private headers(): HttpHeaders {
    const token = this.auth.getToken() || '';
    const jwt = token.replace(/^Bearer\s+/i, '').trim();
    return new HttpHeaders({ Authorization: `Bearer ${jwt}` });
  }

  list(): Observable<PedidoInsumoResponse[]> {
    return this.http.get<PedidoInsumoResponse[]>(this.baseUrl, { headers: this.headers() });
  }

  get(id: number): Observable<PedidoInsumoResponse> {
    return this.http.get<PedidoInsumoResponse>(`${this.baseUrl}/${id}`, { headers: this.headers() });
  }

  create(payload: PedidoInsumoRequest): Observable<PedidoInsumoResponse> {
    return this.http.post<PedidoInsumoResponse>(this.baseUrl, payload, { headers: this.headers() });
  }

  update(id: number, payload: Partial<PedidoInsumoRequest>): Observable<PedidoInsumoResponse> {
    return this.http.put<PedidoInsumoResponse>(`${this.baseUrl}/${id}`, payload, { headers: this.headers() });
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`, { headers: this.headers() });
  }

  // PUT /api/admin/pedidos-insumos/{id}/aprobar
  aprobar(id: number): Observable<PedidoInsumoResponse> {
    return this.http.put<PedidoInsumoResponse>(`${this.baseUrl}/${id}/aprobar`, {}, { headers: this.headers() });
  }

  // PUT /api/admin/pedidos-insumos/{id}/pagar
  pagar(id: number): Observable<PedidoInsumoResponse> {
    return this.http.put<PedidoInsumoResponse>(`${this.baseUrl}/${id}/pagar`, {}, { headers: this.headers() });
  }

  // GET /api/admin/pedidos-insumos/{id}/proveedor
  getProveedor(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${id}/proveedor`, { headers: this.headers() });
  }

  // POST /api/admin/pedidos-insumos/{id}/devoluciones
  crearDevolucion(id: number, payload: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/${id}/devoluciones`, payload, { headers: this.headers() });
  }

  // PATCH /api/admin/pedidos-insumos/{id}/devolver - Marcar detalle como devuelto
  marcarDetalleComoDevuelto(id: number): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/${id}/devolver`, {}, { headers: this.headers() });
  }
}
