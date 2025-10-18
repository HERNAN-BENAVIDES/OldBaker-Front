import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { AuthService } from '../features/auth/services/auth.service';

@Injectable({ providedIn: 'root' })
export class OrderService {
  constructor(private http: HttpClient, private auth: AuthService) {}

  // Verifica el estado del pago a partir de la external reference
  verifyPayment(externalReference: string): Observable<any> {
    const url = `${environment.apiUrl}/orders/external/${encodeURIComponent(externalReference)}`;

    // Preparar headers con Authorization si existe token
    const token = this.auth.getToken();
    let options = {} as any;
    try {
      if (token) {
        const raw = String(token).replace(/^Bearer\s+/i, '').trim();
        const headers = new HttpHeaders({ Authorization: `Bearer ${raw}` });
        options = { headers };
      }
    } catch (e) {
      // fallback: sin headers
    }

    return this.http.get<any>(url, options);
  }
}
