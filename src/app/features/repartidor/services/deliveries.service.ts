import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../auth/services/auth.service';

export interface DireccionEntrega {
  barrio: string;
  numero: string;
  ciudad: string;
  calle: string;
  carrera: string;
  numeroTelefono: string;
}

export interface DeliveryOrder {
  externalReference: string;
  total: number;
  fechaAsignacion: string;
  orderId: number;
  direccion: DireccionEntrega;
  trackingCode: string;
  paymentStatus: string;
  deliveryStatus: string;
  fechaEntregaEstimada?: string;
}

export interface DeliveryBuckets {
  delDia: DeliveryOrder[];
  futuras: DeliveryOrder[];
  entregadas: DeliveryOrder[];
}

@Injectable({ providedIn: 'root' })
export class DeliveriesService {
  private readonly baseUrl = `${environment.apiUrl}/api/user/deliveries`;

  constructor(private http: HttpClient, private auth: AuthService) {}

  fetchMyOrders(): Observable<DeliveryBuckets> {
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: token.replace(/^Bearer\s+/i, 'Bearer ') }) : undefined;
    const url = `${this.baseUrl}/my-orders`;
    return this.http.get<DeliveryBuckets>(url, headers ? { headers } : undefined).pipe(
      catchError((err) => {
        console.warn('[DeliveriesService] Error al obtener mis órdenes de reparto', err);
        return of({ delDia: [], futuras: [], entregadas: [] } as DeliveryBuckets);
      })
    );
  }

  pickup(orderId: number): Observable<any> {
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: token.replace(/^Bearer\s+/i, 'Bearer ') }) : undefined;
    const url = `${this.baseUrl}/${orderId}/pickup`;
    return this.http.put(url, {}, headers ? { headers } : undefined);
  }

  complete(orderId: number): Observable<any> {
    const token = this.auth.getToken();
    const headers = token ? new HttpHeaders({ Authorization: token.replace(/^Bearer\s+/i, 'Bearer ') }) : undefined;
    const url = `${this.baseUrl}/${orderId}/complete`;
    return this.http.put(url, {}, headers ? { headers } : undefined);
  }
}
