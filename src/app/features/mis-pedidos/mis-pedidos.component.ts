import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../features/auth/services/auth.service';
import { NotificationService } from '../../shared/notification/notification.service';
import { ShoppingCartService } from '../../shared/shopping-cart/shopping-cart.service';

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
    private route: ActivatedRoute,
    private http: HttpClient,
    private authService: AuthService,
    private notifications: NotificationService,
    private cartService: ShoppingCartService
  ) {}

  ngOnInit() {
    // Verificar si viene de un retorno de pago
    this.route.queryParams.subscribe(params => {
      const status = params['status'];
      const externalRef = params['external_reference'];

      if (status && externalRef) {
        this.handlePaymentReturn(status, externalRef);
        // Limpiar los query params de la URL sin recargar
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {},
          replaceUrl: true
        });
      }
    });

    // Verificar si el usuario está autenticado antes de cargar pedidos
    const isAuthenticated = this.authService.isLoggedIn() || this.authService.isTokenValid();

    if (!isAuthenticated) {
      // Si viene de MercadoPago pero no tiene sesión, mostrar mensaje y redirigir a login
      this.loading = false;
      this.error = 'Tu sesión ha expirado. Por favor, inicia sesión para ver tus pedidos.';

      // Redirigir al login después de 3 segundos
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 3000);
      return;
    }

    this.cargarPedidos();
  }

  handlePaymentReturn(status: string, externalRef: string) {
    switch (status.toLowerCase()) {
      case 'approved':
        this.notifications.showSuccess('¡Pago aprobado! Tu pedido ha sido confirmado.');
        // Limpiar el carrito cuando el pago es aprobado
        try {
          this.cartService.clearCart();
        } catch (e) {
          console.error('Error al limpiar carrito:', e);
        }
        break;
      case 'pending':
        this.notifications.showInfo('Tu pago está pendiente de confirmación. Te notificaremos cuando se confirme.');
        break;
      case 'failed':
        this.notifications.showError('El pago no pudo ser procesado. Por favor, intenta nuevamente.');
        break;
      default:
        this.notifications.showInfo(`Estado del pago: ${status}`);
    }
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
