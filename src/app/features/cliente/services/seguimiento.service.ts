// src/app/features/services/seguimiento.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { OrdenCompra, OrderStatusResponse } from '../../shared/models/pedido.model';
import { AuthService } from 'src/app/features/auth/services/auth.service';

@Injectable({ providedIn: 'root' })
export class SeguimientoService {
  private readonly apiUrl = `${environment.apiUrl}/api/orders`;

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) {}

  /**
   * Obtiene los headers con el token de autenticación
   */
  private getHeaders(): { headers: HttpHeaders } {
    const token = this.auth.getToken();
    if (token) {
      const raw = String(token).replace(/^Bearer\s+/i, '').trim();
      return {
        headers: new HttpHeaders({ Authorization: `Bearer ${raw}` })
      };
    }
    return { headers: new HttpHeaders() };
  }

  /**
   * IMPORTANTE: Tu backend NO tiene endpoint /my-orders para clientes
   * Necesitarás crear este endpoint en el backend o usar el que ya tengas
   * Por ahora usaré /status para obtener pedidos individuales
   */
  
  /**
   * Obtiene el estado de un pedido por external reference
   * Usa tu endpoint existente: GET /api/orders/status?externalReference={ref}
   */
  obtenerEstadoPedido(externalReference: string): Observable<OrderStatusResponse> {
    return this.http.get<OrderStatusResponse>(
      `${this.apiUrl}/status`,
      {
        params: { externalReference },
        ...this.getHeaders()
      }
    );
  }

  /**
   * NOTA: Necesitas crear este endpoint en tu backend:
   * GET /api/orders/my-orders
   * 
   * Debe retornar todas las órdenes del usuario autenticado
   * Similar a como hiciste /deliveries/my-orders pero para clientes
   */
  obtenerMisPedidos(): Observable<OrdenCompra[]> {
    // Este endpoint NO existe en tu backend actual
    // Debes crearlo o adaptarlo
    return this.http.get<OrdenCompra[]>(
      `${this.apiUrl}/my-orders`,
      this.getHeaders()
    );
  }

  /**
   * Busca un pedido por tracking code
   * También necesitarás crear este endpoint en el backend
   */
  buscarPorTrackingCode(trackingCode: string): Observable<OrdenCompra> {
    return this.http.get<OrdenCompra>(
      `${this.apiUrl}/tracking/${encodeURIComponent(trackingCode)}`,
      this.getHeaders()
    );
  }

  /**
   * Cancela un pedido (si implementas esta funcionalidad)
   */
  cancelarPedido(externalReference: string): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/cancel`,
      { externalReference },
      this.getHeaders()
    );
  }
}