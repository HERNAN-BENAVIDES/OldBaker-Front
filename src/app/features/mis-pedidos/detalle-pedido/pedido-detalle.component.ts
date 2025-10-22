import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../../features/auth/services/auth.service';
import { NotificationService } from '../../../shared/notification/notification.service';
import { ShoppingCartService } from '../../../shared/shopping-cart/shopping-cart.service';
import { environment } from '../../../../environments/environment';

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
  selector: 'app-pedido-detalle',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './pedido-detalle.component.html',
  styleUrls: ['./pedido-detalle.component.css']
})
export class PedidoDetalleComponent implements OnInit {
  pedido: Pedido | null = null;
  loading = true;
  error: string | null = null;

  private externalRef: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private authService: AuthService,
    private notifications: NotificationService,
    private cartService: ShoppingCartService
  ) {}

  ngOnInit(): void {
    // Leer parámetro de ruta y query params (status)
    this.externalRef = this.route.snapshot.paramMap.get('external_reference');
    const status = this.route.snapshot.queryParamMap.get('status') || undefined;

    // Si hay status desde el retorno de pago, mostrar mensaje y limpiar carrito si aplica
    if (status) {
      this.handlePaymentReturn(status);
      // Limpiar query param status de la URL (opcional)
      this.router.navigate(['./'], {
        relativeTo: this.route,
        queryParams: {},
        replaceUrl: true
      });
    }

    // Validar autenticación
    const isAuthenticated = this.authService.isLoggedIn() || this.authService.isTokenValid();
    if (!isAuthenticated) {
      this.loading = false;
      this.error = 'Tu sesión ha expirado. Por favor, inicia sesión para ver el detalle del pedido.';
      setTimeout(() => this.router.navigate(['/login']), 3000);
      return;
    }

    // Cargar el pedido por externalReference
    this.cargarPedido();
  }

  private cargarPedido() {
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

    const cleanToken = String(token).replace(/^Bearer\s+/i, '').trim();
    const headers = new HttpHeaders({ Authorization: `Bearer ${cleanToken}` });
    const url = `${environment.apiUrl}/api/user/orders?idUsuario=${currentUser.id}`;

    this.http.get<Pedido[]>(url, { headers }).subscribe({
      next: (lista) => {
        const ref = (this.externalRef || '').trim();
        this.pedido = (lista || []).find(p => String(p.externalReference).trim() === ref) || null;
        if (!this.pedido) {
          this.error = 'No se encontró el pedido solicitado.';
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar detalle del pedido:', err);
        this.error = 'Error al cargar el detalle del pedido. Intenta nuevamente.';
        this.loading = false;
      }
    });
  }

  handlePaymentReturn(status: string) {
    switch (status.toLowerCase()) {
      case 'approved':
        this.notifications.showSuccess('¡Pago aprobado! Tu pedido ha sido confirmado.');
        try { this.cartService.clearCart(); } catch {}
        break;
      case 'pending':
        this.notifications.showInfo('Tu pago está pendiente de confirmación.');
        break;
      case 'failed':
        this.notifications.showError('El pago no pudo ser procesado.');
        break;
      default:
        this.notifications.showInfo(`Estado del pago: ${status}`);
    }
  }

  getEstadoTexto(estado: string): string {
    const map: Record<string, string> = {
      'PAID': 'Pagado',
      'PENDING': 'Pendiente',
      'CANCELLED': 'Cancelado',
      'FAILED': 'Fallido'
    };
    return map[estado] || estado;
  }

  formatearFecha(fecha: string): string {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  goBack() {
    this.router.navigate(['/mis-pedidos']);
  }
}

