// src/app/features/services/delivery.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { OrdenCompra, DeliveryUpdate } from '../../shared/models/pedido.model';
import { AuthService } from 'src/app/features/auth/services/auth.service';

@Injectable({ providedIn: 'root' })
export class DeliveryService {
  private readonly apiUrl = `${environment.apiUrl}/api`; // Base para endpoints delivery

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
   * Obtiene todos los pedidos asignados al repartidor
   * Endpoint existente: GET /api/deliveries/my-orders
   */
  obtenerMisEntregas(): Observable<OrdenCompra[]> {
    return this.http.get<OrdenCompra[]>(
      `${this.apiUrl}/deliveries/my-orders`,
      this.getHeaders()
    );
  }

  /**
   * Actualiza el estado de un pedido
   * NOTA: Debes crear este endpoint en tu backend
   * PUT /api/deliveries/update-status
   * Body: { orderId, newStatus, comentario? }
   */
  actualizarEstadoPedido(update: DeliveryUpdate): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/deliveries/update-status`,
      update,
      this.getHeaders()
    );
  }

  /**
   * Marca un pedido como recogido (IN_TRANSIT)
   */
  marcarComoRecogido(orderId: number): Observable<any> {
    return this.actualizarEstadoPedido({
      orderId,
      newStatus: 'IN_TRANSIT',
      comentario: 'Pedido recogido por el repartidor'
    });
  }

  /**
   * Marca un pedido como entregado
   */
  marcarComoEntregado(orderId: number, comentario?: string): Observable<any> {
    return this.actualizarEstadoPedido({
      orderId,
      newStatus: 'DELIVERED',
      comentario: comentario || 'Pedido entregado exitosamente'
    });
  }

  /**
   * Reporta un problema con la entrega
   * NOTA: Debes crear este endpoint en tu backend
   */
  reportarProblema(orderId: number, problema: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/deliveries/report-issue`,
      { orderId, problema },
      this.getHeaders()
    );
  }

  /**
   * Obtiene los detalles completos de un pedido
   */
  obtenerDetallePedido(orderId: number): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/deliveries/orders/${orderId}`,
      this.getHeaders()
    );
  }

  /**
   * Obtiene estadísticas del repartidor
   * NOTA: Endpoint opcional, crear en backend si lo necesitas
   */
  obtenerEstadisticas(): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/deliveries/stats`,
      this.getHeaders()
    );
  }
}