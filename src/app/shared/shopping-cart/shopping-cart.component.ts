import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShoppingCartService, CartItem } from './shopping-cart.service';
import { LucideAngularModule, ShoppingCart, X, Plus, Minus, Trash2 } from 'lucide-angular';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/features/auth/services/auth.service';

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
    private authService: AuthService
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
    if (confirm('¿Estás seguro de que deseas vaciar el carrito?')) {
      this.cartService.clearCart();
    }
  }

  checkout() {
    if (this.cartItems.length === 0) {
      alert('El carrito está vacío');
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
      alert('No se pudo procesar el pago porque no se encontró un token de autenticación.');
      return;
    }

    // Construir el payload con los items del carrito
    const payload = {
      items: this.cartItems.map(item => ({
        productoId: item.id,
        cantidad: item.quantity,
        precioUnitario: item.price
      }))
    };

    const headers = {
      headers: {
        Authorization: `Bearer ${token}` // Usar el token en el encabezado con formato Bearer
      }
    };

    this.http.post(`${environment.apiUrl}/api/orders/checkout`, payload, headers).subscribe({
      next: (response: any) => {
        if (response.initPoint) {
          window.location.href = response.initPoint; // Redirigir al initPoint
        }
      },
      error: (error: any) => {
        if (error.error && error.error.error) {
          alert(error.error.error); // Mostrar el mensaje de error
        } else {
          alert('Hubo un error al procesar el pedido');
        }
        console.error(error);
      }
    });
  }
}
