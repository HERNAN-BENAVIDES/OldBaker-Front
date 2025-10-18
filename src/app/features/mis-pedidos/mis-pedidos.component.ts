import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../features/auth/services/auth.service';

interface PedidoItem {
  productoId: number;
  productoNombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

interface Pedido {
  id: number;
  externalReference: string;
  status: string;
  paymentId: string | null;
  total: number;
  fechaCreacion: string;
  payerEmail: string;
  items: PedidoItem[];
}

@Component({
  selector: 'app-mis-pedidos',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './mis-pedidos.component.html',
  styleUrls: ['./mis-pedidos.component.css']
})
export class MisPedidosComponent implements OnInit {
  pedidos: Pedido[] = [];
  loading = true;
  error: string | null = null;

  constructor(
    private router: Router,
    private http: HttpClient,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.cargarPedidos();
  }

  cargarPedidos() {
    const currentUser = this.authService.getCurrentUser();

    if (!currentUser || !currentUser.id) {
      this.error = 'No se pudo obtener la información del usuario';
      this.loading = false;
      return;
    }

    const token = this.authService.getToken();

    if (!token) {
      this.error = 'No se encontró el token de autenticación';
      this.loading = false;
      return;
    }

    // Limpiar el token: remover prefijo "Bearer " si ya existe
    const cleanToken = String(token).replace(/^Bearer\s+/i, '').trim();

    const headers = new HttpHeaders({
      Authorization: `Bearer ${cleanToken}`
    });

    const url = `${environment.apiUrl}/api/user/orders?idUsuario=${currentUser.id}`;

    this.http.get<Pedido[]>(url, { headers }).subscribe({
      next: (response) => {
        this.pedidos = response || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar pedidos:', err);
        this.error = 'Error al cargar los pedidos. Por favor, intenta nuevamente.';
        this.loading = false;
      }
    });
  }

  getEstadoClass(estado: string): string {
    const statusMap: { [key: string]: string } = {
      'PAID': 'estado-completado',
      'PENDING': 'estado-pendiente',
      'CANCELLED': 'estado-cancelado',
      'FAILED': 'estado-cancelado'
    };
    return statusMap[estado] || 'estado-pendiente';
  }

  getEstadoTexto(estado: string): string {
    const statusText: { [key: string]: string } = {
      'PAID': 'Pagado',
      'PENDING': 'Pendiente',
      'CANCELLED': 'Cancelado',
      'FAILED': 'Fallido'
    };
    return statusText[estado] || estado;
  }

  formatearFecha(fecha: string): string {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  goBack() {
    this.router.navigate(['..']);
  }
}
