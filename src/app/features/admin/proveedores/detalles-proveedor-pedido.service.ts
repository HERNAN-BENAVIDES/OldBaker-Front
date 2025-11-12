import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../auth/services/auth.service';

export interface DetalleProveedorPedido {
  id: number;
  cantidadInsumo: number;
  costoSubtotal: number;
  esDevuelto: boolean;
  insumoProveedorId: number;
  pedidoId: number;
  // Campos adicionales para mostrar en la UI
  nombreInsumo?: string;
  nombreProveedor?: string;
  fechaPedido?: string;
  estadoPedido?: string;
}

export interface DetalleProveedorPedidoRequest {
  cantidadInsumo: number;
  costoSubtotal: number;
  insumoProveedorId: number;
}

@Injectable({ providedIn: 'root' })
export class DetallesProveedorPedidoService {
  private baseUrl = `${environment.apiUrl}/api/detalles-proveedor-pedido`;

  constructor(private http: HttpClient, private auth: AuthService) {}

  private headers(): HttpHeaders {
    const token = this.auth.getToken() || '';
    const jwt = token.replace(/^Bearer\s+/i, '').trim();
    return new HttpHeaders({ Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' });
  }

  // GET /api/detalles-proveedor-pedido - Lista todos los detalles
  list(): Observable<DetalleProveedorPedido[]> {
    return this.http.get<DetalleProveedorPedido[]>(this.baseUrl, { headers: this.headers() });
  }

  // GET /api/detalles-proveedor-pedido/{id} - Obtiene un detalle específico
  get(id: number): Observable<DetalleProveedorPedido> {
    return this.http.get<DetalleProveedorPedido>(`${this.baseUrl}/${id}`, { headers: this.headers() });
  }

  // GET /api/detalles-proveedor-pedido/pedido/{idPedido} - Lista detalles de un pedido
  getByPedido(idPedido: number): Observable<DetalleProveedorPedido[]> {
    return this.http.get<DetalleProveedorPedido[]>(`${this.baseUrl}/pedido/${idPedido}`, { headers: this.headers() });
  }

  // GET /api/detalles-proveedor-pedido/insumo/{idInsumo} - Lista detalles de un insumo
  getByInsumo(idInsumo: number): Observable<DetalleProveedorPedido[]> {
    return this.http.get<DetalleProveedorPedido[]>(`${this.baseUrl}/insumo/${idInsumo}`, { headers: this.headers() });
  }

  // POST /api/detalles-proveedor-pedido/pedido/{idPedido} - Crear detalle para un pedido
  createForPedido(idPedido: number, payload: DetalleProveedorPedidoRequest): Observable<DetalleProveedorPedido> {
    return this.http.post<DetalleProveedorPedido>(`${this.baseUrl}/pedido/${idPedido}`, payload, { headers: this.headers() });
  }

  // PUT /api/detalles-proveedor-pedido/{id} - Actualizar un detalle
  update(id: number, payload: Partial<DetalleProveedorPedidoRequest>): Observable<DetalleProveedorPedido> {
    return this.http.put<DetalleProveedorPedido>(`${this.baseUrl}/${id}`, payload, { headers: this.headers() });
  }

  // DELETE /api/detalles-proveedor-pedido/{id} - Eliminar un detalle
  delete(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`, { headers: this.headers() });
  }

  // PATCH /api/detalles-proveedor-pedido/{id}/devolver - Marcar como devuelto
  marcarComoDevuelto(id: number): Observable<DetalleProveedorPedido> {
    return this.http.patch<DetalleProveedorPedido>(`${this.baseUrl}/${id}/devolver`, {}, { headers: this.headers() });
  }
}