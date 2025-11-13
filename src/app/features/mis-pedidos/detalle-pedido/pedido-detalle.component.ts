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

interface Direccion {
  barrio: string;
  numero: string;
  ciudad: string; 
  calle: string;
  carrera: string;
  numeroTelefono: string;
}

interface Repartidor {
  nombre: string;
  telefono: string;
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
  deliveryStatus?: string;
  trackingCode?: string;
  direccion?: Direccion;  
  repartidor?: Repartidor;
}

interface EstadoEntrega {
  codigo: string;
  nombre: string;
  descripcion: string;
  completado: boolean;
  activo: boolean;
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
  estadosEntrega: EstadoEntrega[] = [];

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
    this.externalRef = this.route.snapshot.paramMap.get('external_reference');
    const status = this.route.snapshot.queryParamMap.get('status') || undefined;

    if (status) {
      this.handlePaymentReturn(status);
      this.router.navigate(['./'], {
        relativeTo: this.route,
        queryParams: {},
        replaceUrl: true
      });
    }

    const isAuthenticated = this.authService.isLoggedIn() || this.authService.isTokenValid();
    if (!isAuthenticated) {
      this.loading = false;
      this.error = 'Tu sesión ha expirado. Por favor, inicia sesión para ver el detalle del pedido.';
      setTimeout(() => this.router.navigate(['/login']), 3000);
      return;
    }

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
        
        // 🔍 DEBUG: Verifica qué datos está recibiendo
        console.log('📦 Pedido recibido:', this.pedido);
        console.log('👤 Repartidor:', this.pedido?.repartidor);
        console.log('📍 Dirección:', this.pedido?.direccion);
        console.log('📊 Estado de entrega:', this.pedido?.deliveryStatus);
        
        if (!this.pedido) {
          this.error = 'No se encontró el pedido solicitado.';
        } else {
          this.inicializarEstadosEntrega();
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

  private inicializarEstadosEntrega() {
    if (!this.pedido) return;

    const todosLosEstados = [
      { codigo: 'EN_PREPARACION', nombre: 'En preparación', descripcion: 'Tu pedido está siendo preparado' },
      { codigo: 'LISTO_PARA_ENTREGAR', nombre: 'Listo para entregar', descripcion: 'Tu pedido está listo' },
      { codigo: 'ENTREGADO_A_REPARTIDOR', nombre: 'Entregado al repartidor', descripcion: 'El repartidor tiene tu pedido' },
      { codigo: 'EN_CAMINO', nombre: 'En camino', descripcion: 'Tu pedido está en camino' },
      { codigo: 'ENTREGADO', nombre: 'Entregado', descripcion: 'Tu pedido fue entregado' }
    ];

    const estadoActual = this.pedido.deliveryStatus || 'EN_PREPARACION';
    const indiceActual = todosLosEstados.findIndex(e => e.codigo === estadoActual);

    this.estadosEntrega = todosLosEstados.map((estado, index) => ({
      ...estado,
      completado: index < indiceActual,
      activo: index === indiceActual
    }));
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

  getEstadoClass(estado: string): string {
    const map: Record<string, string> = {
      'PAID': 'estado-completado',
      'PENDING': 'estado-pendiente',
      'CANCELLED': 'estado-cancelado',
      'FAILED': 'estado-cancelado'
    };
    return map[estado] || 'estado-pendiente';
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