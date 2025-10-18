import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { OrderService } from '../../services/order.service';
import { ShoppingCartService } from '../../shared/shopping-cart/shopping-cart.service';

@Component({
  selector: 'app-payment-result',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="payment-result">
      <ng-container *ngIf="loading">
        <p>Validando pago...</p>
      </ng-container>

      <ng-container *ngIf="!loading">
        <h2>{{ title }}</h2>
        <p>{{ message }}</p>

        <div class="actions">
          <button (click)="goHome()">Ir al inicio</button>
          <button *ngIf="showOrders" (click)="goOrders()">Ver mis pedidos</button>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .payment-result { max-width: 720px; margin: 48px auto; padding: 24px; text-align: center; }
    h2 { margin-bottom: 12px; }
    .actions { margin-top: 20px; display:flex; gap:12px; justify-content:center }
    button { padding: 8px 14px; border-radius:6px; border:none; background:#2b7a4b; color:white; cursor:pointer }
    button:hover { opacity:0.95 }
  `]
})
export class PaymentResultComponent implements OnInit {
  loading = true;
  title = '';
  message = '';
  showOrders = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService,
    private cartService: ShoppingCartService
  ) {}

  ngOnInit(): void {
    const externalRef = this.route.snapshot.queryParamMap.get('external_reference');

    if (!externalRef) {
      this.title = 'Referencia no encontrada';
      this.message = 'No se encontró información de la transacción.';
      this.loading = false;
      return;
    }

    // Llamar al backend para verificar estado real del pago
    this.orderService.verifyPayment(externalRef).subscribe({
      next: (res) => {
        // Esperamos que el backend devuelva un objeto con un campo 'status' o similar.
        const status = res && res.status ? String(res.status).toUpperCase() : '';

        if (status === 'PAID' || status === 'PAGADO' || status === 'APPROVED' || status === 'SUCCESS') {
          this.title = 'Pago aprobado';
          this.message = 'Gracias — tu pago fue recibido y el pedido está confirmado.';
          // Limpiar carrito local
          try { this.cartService.clearCart(); } catch (e) { console.error(e); }
          this.showOrders = true;
        } else if (status === 'PENDING' || status === 'EN_PROCESO') {
          this.title = 'Pago pendiente';
          this.message = 'Tu pago está pendiente de confirmación. Verifica nuevamente más tarde.';
        } else {
          this.title = 'Pago no aprobado';
          this.message = 'Hubo un problema procesando el pago. Si ya se realizó el cargo, contacta soporte.';
        }

        this.loading = false;
      },
      error: (err) => {
        console.error('Error verificando pago', err);
        this.title = 'Error comprobando pago';
        this.message = 'Ocurrió un error al validar el pago. Intenta nuevamente más tarde.';
        this.loading = false;
      }
    });
  }

  goHome() {
    this.router.navigate(['/']);
  }

  goOrders() {
    this.router.navigate(['/mis-pedidos']);
  }
}

