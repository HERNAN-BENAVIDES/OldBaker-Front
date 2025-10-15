import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ShoppingCartService {
  private cartItems = new BehaviorSubject<CartItem[]>([]);
  public cartItems$ = this.cartItems.asObservable();

  constructor() {
    // Cargar items del localStorage al iniciar
    this.loadCart();
  }

  private loadCart() {
    try {
      const saved = localStorage.getItem('shopping_cart');
      if (saved) {
        this.cartItems.next(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Error al cargar el carrito:', e);
    }
  }

  private saveCart() {
    try {
      localStorage.setItem('shopping_cart', JSON.stringify(this.cartItems.value));
    } catch (e) {
      console.error('Error al guardar el carrito:', e);
    }
  }

  addItem(item: Omit<CartItem, 'quantity'>) {
    const currentItems = this.cartItems.value;
    const existingItem = currentItems.find(i => i.id === item.id);

    if (existingItem) {
      existingItem.quantity++;
    } else {
      currentItems.push({ ...item, quantity: 1 });
    }

    this.cartItems.next([...currentItems]);
    this.saveCart();
  }

  removeItem(id: number) {
    const currentItems = this.cartItems.value.filter(item => item.id !== id);
    this.cartItems.next(currentItems);
    this.saveCart();
  }

  updateQuantity(id: number, quantity: number) {
    const currentItems = this.cartItems.value;
    const item = currentItems.find(i => i.id === id);

    if (item) {
      if (quantity <= 0) {
        this.removeItem(id);
      } else {
        item.quantity = quantity;
        this.cartItems.next([...currentItems]);
        this.saveCart();
      }
    }
  }

  clearCart() {
    this.cartItems.next([]);
    this.saveCart();
  }

  getTotal(): number {
    return this.cartItems.value.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  getItemCount(): number {
    return this.cartItems.value.reduce((count, item) => count + item.quantity, 0);
  }
}

