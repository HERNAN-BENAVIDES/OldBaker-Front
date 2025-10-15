import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShoppingCartService, CartItem } from './shopping-cart.service';
import { LucideAngularModule, ShoppingCart, X, Plus, Minus, Trash2 } from 'lucide-angular';

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

  constructor(private cartService: ShoppingCartService) {}

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
    alert('Función de checkout - Por implementar');
    // Aquí implementarías la lógica de checkout
  }
}

