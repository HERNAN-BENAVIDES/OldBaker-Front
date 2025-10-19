import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShoppingCartService, CartItem } from './shopping-cart.service';
import { LucideAngularModule, ShoppingCart, X, Plus, Minus, Trash2 } from 'lucide-angular';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/features/auth/services/auth.service';
import { NotificationService } from '../notification/notification.service';

@Component({
  selector: 'app-shopping-cart',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './shopping-cart.component.html',
  styleUrls: ['./shopping-cart.component.css']
})
export class ShoppingCartComponent implements OnInit {
  isOpen = false;
  cartItems: CartItem[] = [];
  itemCount = 0;
  total = 0;

  // Íconos de Lucide
  readonly ShoppingCart = ShoppingCart;
  readonly X = X;
  readonly Plus = Plus;
  readonly Minus = Minus;
  readonly Trash2 = Trash2;

  constructor(
    private cartService: ShoppingCartService,
    private router: Router,
    private http: HttpClient,
    private authService: AuthService,
    private notifications: NotificationService
  ) {}

  ngOnInit() {
    this.cartService.cartItems$.subscribe(items => {
      this.cartItems = items;
      this.itemCount = this.cartService.getItemCount();
      this.total = this.cartService.getTotal();
    });
  }

  toggleCart() {
    this.isOpen = !this.isOpen;
  }

  increaseQuantity(item: CartItem) {
    this.cartService.updateQuantity(item.id, item.quantity + 1);
  }

  decreaseQuantity(item: CartItem) {
    this.cartService.updateQuantity(item.id, item.quantity - 1);
  }

  removeItem(id: number) {
    this.cartService.removeItem(id);
  }

  clearCart() {
    this.notifications.showConfirm(
      '¿Estás seguro de que deseas vaciar el carrito?',
      () => {
        this.cartService.clearCart();
        this.notifications.showSuccess('Carrito vaciado correctamente');
      }
    );
  }

  checkout() {
    if (this.cartItems.length === 0) {
      this.notifications.showInfo('El carrito está vacío');
      return;
    }

    const isLoggedIn = this.authService.isLoggedIn(); // Método real del servicio AuthService

    if (!isLoggedIn) {
      this.isOpen = false; // Cerrar el carrito
      this.router.navigate(['/login']);
      return;
    }

    const token = this.authService.getToken();

    if (!token) {
      console.error('Error: No se encontró un token de autenticación.');
      this.notifications.showError('No se pudo procesar el pago porque no se encontró un token de autenticación.');
      return;
    }

    // Obtener el email del usuario autenticado
    const currentUser = this.authService.getCurrentUser();
    const payerEmail = currentUser?.email;

    if (!payerEmail) {
      console.error('Error: No se pudo obtener el email del usuario.');
      this.notifications.showError('No se pudo procesar el pago porque no se encontró el email del usuario.');
      return;
    }

    // Limpiar advertencias de stock previas
    this.clearStockWarnings();

    // Construir el payload con el formato correcto: { payerEmail, items: [{ productId, quantity }] }
    const payload = {
      payerEmail: payerEmail,
      items: this.cartItems.map(item => ({
        productId: item.id,
        quantity: item.quantity
      }))
    };

    // Limpiar el token: remover prefijo "Bearer " si ya existe para evitar duplicación
    const cleanToken = String(token).replace(/^Bearer\s+/i, '').trim();

    const headers = {
      headers: {
        Authorization: `Bearer ${cleanToken}` // Usar el token limpio con formato Bearer
      }
    };

    this.http.post(`${environment.apiUrl}/api/orders/checkout`, payload, headers).subscribe({
      next: (response: any) => {
        if (response.initPoint) {
          window.location.href = response.initPoint; // Redirigir al initPoint
        }
      },
      error: (error: any) => {
        // Procesar error de stock
        this.handleCheckoutError(error);
      }
    });
  }

  clearStockWarnings() {
    this.cartItems.forEach(item => {
      item.stockWarning = undefined;
      item.maxAvailable = undefined;
    });
  }

  handleCheckoutError(error: any) {
    try {
      const errorMessage = error?.error?.error || error?.error?.message || '';

      // Detectar si es un error de stock
      // Formato esperado: "Producto 'Pan hamburguesa' no se puede preparar en la cantidad solicitada (142). Se puede preparar hasta 100 unidades."
      const stockErrorRegex = /Producto '([^']+)' no se puede preparar en la cantidad solicitada \((\d+)\)\. Se puede preparar hasta (\d+) unidades/;
      const match = errorMessage.match(stockErrorRegex);

      if (match) {
        const productName = match[1];
        const maxAvailable = parseInt(match[3], 10);

        // Buscar el producto en el carrito por nombre y agregar la advertencia
        const affectedItem = this.cartItems.find(item => item.name === productName);

        if (affectedItem) {
          affectedItem.stockWarning = `Se puede preparar hasta ${maxAvailable} unidades.`;
          affectedItem.maxAvailable = maxAvailable;

          // Forzar actualización de la vista
          this.cartItems = [...this.cartItems];
        }
      } else {
        // Error genérico
        if (error.error && error.error.error) {
          this.notifications.showError(error.error.error);
        } else {
          this.notifications.showError('Hubo un error al procesar el pedido');
        }
      }
    } catch (e) {
      console.error('Error procesando error de checkout:', e);
      this.notifications.showError('Hubo un error al procesar el pedido');
    }
  }
}
