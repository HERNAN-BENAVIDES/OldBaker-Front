import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ShoppingCartService, CartItem } from '../../shared/shopping-cart/shopping-cart.service';
import { AuthService } from '../../features/auth/services/auth.service';
import { NotificationService } from '../../shared/notification/notification.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-cart-page',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './cart-page.component.html',
  styleUrls: ['./cart-page.component.css']
})
export class CartPageComponent implements OnInit, OnDestroy {
  cartItems: CartItem[] = [];
  total = 0;
  private cartSub?: any;
  selectedCartIds = new Set<number>();

  constructor(
    private cartService: ShoppingCartService,
    private router: Router,
    private http: HttpClient,
    private authService: AuthService,
    private notifications: NotificationService
  ) {}

  ngOnInit(): void {
    console.log('[CartPage] Inicializando. Items en localStorage:', localStorage.getItem('shopping_cart'));
    this.cartSub = this.cartService.cartItems$.subscribe(items => {
      console.log('[CartPage] Suscripción recibió items:', items.length);
      this.cartItems = items;
      // Cargar selecciones guardadas primero
      this.loadSavedSelections();
      // seleccionar automáticamente recién agregados
      this.loadJustAddedSelections();
      this.total = this.selectedTotal; // total dinámico según seleccionados
      console.log('[CartPage] Total seleccionados:', this.selectedCartIds.size, 'Total calculado:', this.total);
    });
  }

  ngOnDestroy(): void {
    console.log('[CartPage] Destruyendo componente. Guardando selecciones...');
    this.cartSub?.unsubscribe?.();
    // Guardar selecciones al salir
    this.saveSelections();
    console.log('[CartPage] Items en localStorage después de destruir:', localStorage.getItem('shopping_cart'));
  }

  private loadSavedSelections() {
    try {
      const raw = localStorage.getItem('cart_selected_ids');
      if (raw) {
        const arr = JSON.parse(raw);
        const ids: number[] = Array.isArray(arr) ? arr : [];
        this.selectedCartIds = new Set(ids.filter(id => this.cartItems.find(ci => ci.id === id)));
      }
    } catch { /* ignore */ }
  }

  private loadJustAddedSelections() {
    try {
      const raw = localStorage.getItem('cart_last_added_ids');
      const arr = raw ? JSON.parse(raw) : [];
      const ids: number[] = Array.isArray(arr) ? arr : [];
      let changed = false;
      for (const id of ids) {
        if (this.cartItems.find(ci => ci.id === id) && !this.selectedCartIds.has(id)) { this.selectedCartIds.add(id); changed = true; }
      }
      if (changed) {
        // recalcular total
        this.total = this.selectedTotal;
      }
    } catch { /* ignore */ }
  }

  private saveSelections() {
    try {
      localStorage.setItem('cart_selected_ids', JSON.stringify(Array.from(this.selectedCartIds)));
    } catch { /* ignore */ }
  }

  get selectedTotal(): number {
    return this.cartItems.reduce((acc, it) => this.selectedCartIds.has(it.id) ? acc + (it.price * it.quantity) : acc, 0);
  }

  increaseQuantity(item: CartItem) {
    this.cartService.updateQuantity(item.id, item.quantity + 1);
    this.total = this.selectedTotal;
  }

  decreaseQuantity(item: CartItem) {
    this.cartService.updateQuantity(item.id, item.quantity - 1);
    this.total = this.selectedTotal;
  }

  removeItem(id: number) {
    this.cartService.removeItem(id);
    this.selectedCartIds.delete(id);
    this.total = this.selectedTotal;
  }

  removeSelectedCartItems() {
    if (this.selectedCartIds.size === 0) { this.notifications.showInfo('No hay ítems seleccionados'); return; }
    this.cartService.removeItems(Array.from(this.selectedCartIds));
    this.selectedCartIds.clear();
    this.total = this.selectedTotal;
    this.saveSelections();
    this.notifications.showSuccess('Ítems seleccionados eliminados');
  }

  clearCart() {
    this.notifications.showConfirm(
      '¿Vaciar todo el carrito?',
      () => {
        this.cartService.clearCart();
        this.selectedCartIds.clear();
        this.total = 0;
        try {
          localStorage.removeItem('cart_last_added_ids');
          localStorage.removeItem('cart_selected_ids');
        } catch {}
        this.notifications.showSuccess('Carrito vaciado');
      }
    );
  }

  continueToCheckout() {
    if (this.selectedCartIds.size === 0) {
      this.notifications.showInfo('Selecciona al menos un producto para continuar');
      return;
    }

    const isLoggedIn = this.authService.isLoggedIn();
    if (!isLoggedIn) {
      this.router.navigate(['/login']);
      return;
    }

    // Guardar selecciones antes de navegar
    this.saveSelections();

    // Navegar a la página de dirección
    this.router.navigate(['/checkout/address']);
  }

  checkout() {
    if (this.selectedCartIds.size === 0) {
      this.notifications.showInfo('Selecciona al menos un producto para pagar');
      return;
    }
    const selectedItems = this.cartItems.filter(ci => this.selectedCartIds.has(ci.id));

    const isLoggedIn = this.authService.isLoggedIn();

    if (!isLoggedIn) {
      this.router.navigate(['/login']);
      return;
    }

    const token = this.authService.getToken();

    if (!token) {
      this.notifications.showError('No se pudo procesar el pago: token no encontrado.');
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    const payerEmail = currentUser?.email;
    if (!payerEmail) {
      this.notifications.showError('No se pudo procesar el pago: email del usuario no disponible.');
      return;
    }

    this.clearStockWarnings();

    const payload = {
      payerEmail: payerEmail,
      items: selectedItems.map(item => ({ productId: item.id, quantity: item.quantity }))
    };

    const cleanToken = String(token).replace(/^Bearer\s+/i, '').trim();
    const headers = { headers: { Authorization: `Bearer ${cleanToken}` } };

    this.http.post(`${environment.apiUrl}/api/orders/checkout`, payload, headers).subscribe({
      next: (response: any) => {
        if (response.initPoint) {
          window.location.href = response.initPoint;
        }
      },
      error: (error: any) => {
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
      const stockErrorRegex = /Producto '([^']+)' no se puede preparar en la cantidad solicitada \((\d+)\)\. Se puede preparar hasta (\d+) unidades/;
      const match = errorMessage.match(stockErrorRegex);

      if (match) {
        const productName = match[1];
        const maxAvailable = parseInt(match[3], 10);
        const affectedItem = this.cartItems.find(item => item.name === productName);

        if (affectedItem) {
          affectedItem.stockWarning = `Se puede preparar hasta ${maxAvailable} unidades.`;
          affectedItem.maxAvailable = maxAvailable;
          this.cartItems = [...this.cartItems];
        }
      } else {
        if (error.error && error.error.error) {
          this.notifications.showError(error.error.error);
        } else {
          this.notifications.showError('Hubo un error al procesar el pedido');
        }
      }
    } catch (e) {
      this.notifications.showError('Hubo un error al procesar el pedido');
    }
  }

  toggleSelectCartItem(item: CartItem) {
    if (this.selectedCartIds.has(item.id)) this.selectedCartIds.delete(item.id); else this.selectedCartIds.add(item.id);
    this.total = this.selectedTotal;
    this.saveSelections();
  }

  selectAll() {
    this.cartItems.forEach(item => this.selectedCartIds.add(item.id));
    this.total = this.selectedTotal;
    this.saveSelections();
  }

  deselectAll() {
    this.selectedCartIds.clear();
    this.total = 0;
    this.saveSelections();
  }
}
