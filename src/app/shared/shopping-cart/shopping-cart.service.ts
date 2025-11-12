import { Injectable } from '@angular/core';
import { BehaviorSubject, forkJoin, of, Observable } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../features/auth/services/auth.service';
import { ProductosService } from '../../services/productos.service';
import { environment } from '../../../environments/environment';

export interface CartItem {
  id: number;           // idProducto
  name: string;
  price: number;
  quantity: number;     // cantidad
  image?: string;
  selected?: boolean;   // nuevo: seleccionado para checkout
  stockWarning?: string; // Mensaje de advertencia de stock
  maxAvailable?: number; // Cantidad máxima disponible
}

interface CartItemDTO { idProducto: number; cantidad: number; selected?: boolean; }
interface CartDTO { id?: number; userId: number; items: CartItemDTO[] }

@Injectable({ providedIn: 'root' })
export class ShoppingCartService {
  private cartItems = new BehaviorSubject<CartItem[]>([]);
  public cartItems$ = this.cartItems.asObservable();
  private serverCartId?: number;

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private productos: ProductosService
  ) {
    this.loadCart();
    // Suscribirse a cambios de usuario (login/logout)
    try {
      const user$ = (this.auth as any).currentUser$;
      if (user$ && typeof user$.subscribe === 'function') {
        user$.subscribe((u: any) => {
          if (u && u.id) {
            // Usuario acaba de loguearse: recargar desde servidor y fusionar con carrito local previo si existe
            this.reloadFromServer(true);
          } else if (!u) {
            // Usuario deslogueado: mantener items locales (se podrán usar como invitado)
          }
        });
      }
    } catch {}
  }

  private getUser() {
    try { return this.auth.getCurrentUser?.() || JSON.parse(localStorage.getItem('auth_user') || 'null'); } catch { return null; }
  }
  private getAuthHeaders(): { headers: HttpHeaders } | undefined {
    const token = this.auth.getToken?.();
    if (!token) return undefined;
    const clean = token.replace(/^Bearer\s+/i, '').trim();
    return { headers: new HttpHeaders({ Authorization: `Bearer ${clean}` }) };
  }

  // Enriquecer ítems sin imagen consultando detalles del producto
  private enrichMissingImages(items: CartItem[]): Observable<CartItem[]> {
    const missing = items.filter(i => !i.image || String(i.image).trim() === '');
    if (missing.length === 0) return of(items);

    const lookups = missing.map(m => this.productos.getProductoDetalle(m.id).pipe(
      map(det => ({ id: m.id, url: det.url ?? '' })),
      catchError(() => of({ id: m.id, url: '' }))
    ));

    return forkJoin(lookups).pipe(
      map(results => {
        const byId = new Map<number, string>(results.map(r => [r.id, r.url]));
        return items.map(it => {
          if (!it.image || String(it.image).trim() === '') {
            const url = byId.get(it.id) || it.image || '';
            return { ...it, image: url } as CartItem;
          }
          return it;
        });
      })
    );
  }

  private loadCart() {
    const user = this.getUser();
    if (user?.id) {
      // Cargar desde backend
      const url = `${environment.apiUrl}/api/user/${encodeURIComponent(user.id)}/cart`;
      const headers = this.getAuthHeaders();
      this.http.get<CartDTO>(url, headers).pipe(
        switchMap((cart: CartDTO | any) => {
          if (!cart || !cart.items || cart.items.length === 0) {
            return of<CartItem[]>([]);
          }
          this.serverCartId = cart.id;
          const enrich$ = cart.items.map((ci: CartItemDTO) =>
            this.productos.getProductoDetalle(ci.idProducto).pipe(
              map(det => ({ id: ci.idProducto, name: det.nombre, price: det.costoUnitario, quantity: ci.cantidad, image: det.url, selected: ci.selected ?? true } as CartItem)),
              catchError(() => of<CartItem>({ id: ci.idProducto, name: `Producto ${ci.idProducto}`, price: 0, quantity: ci.cantidad, selected: ci.selected ?? true }))
            )
          );
          return forkJoin<CartItem[]>(enrich$);
        }),
        catchError(err => {
          console.warn('[ShoppingCart] Error cargando carrito desde backend, usando fallback local:', err);
          try {
            const saved = localStorage.getItem('shopping_cart');
            return of<CartItem[]>(saved ? (JSON.parse(saved) as CartItem[]) : []);
          } catch { return of<CartItem[]>([]); }
        })
      ).subscribe((items: CartItem[]) => {
        const needsEnrich = items.some(i => !i.image || String(i.image).trim() === '');
        if (needsEnrich) {
          this.enrichMissingImages(items).subscribe(filled => this.cartItems.next(filled));
        } else {
          this.cartItems.next(items);
        }
      });
    } else {
      // Fallback local si no hay usuario
      try {
        const saved = localStorage.getItem('shopping_cart');
        if (saved) {
          const parsed = JSON.parse(saved) as CartItem[];
          const needsEnrich = parsed.some(i => !i.image || String(i.image).trim() === '');
          if (needsEnrich) {
            this.enrichMissingImages(parsed).subscribe(filled => this.cartItems.next(filled));
          } else {
            this.cartItems.next(parsed);
          }
        }
      } catch (e) {
        console.error('Error al cargar el carrito local:', e);
      }
    }
  }

  private persistCart() {
    const user = this.getUser();
    const items = this.cartItems.value;
    if (user?.id) {
      const payload: CartDTO = {
        id: this.serverCartId,
        userId: user.id,
        items: items.map(it => ({ idProducto: it.id, cantidad: it.quantity, selected: it.selected ?? true }))
      };
      const url = `${environment.apiUrl}/api/user/${encodeURIComponent(user.id)}/cart`;
      const headers = this.getAuthHeaders();
      this.http.put<CartDTO>(url, payload, headers).pipe(catchError(err => {
        console.warn('[ShoppingCart] Error actualizando carrito en backend, conservando en memoria:', err);
        return of(payload);
      })).subscribe(res => {
        this.serverCartId = res?.id ?? this.serverCartId;
      });
    } else {
      // Fallback local: solo para usuarios sin login
      try { localStorage.setItem('shopping_cart', JSON.stringify(items)); } catch {}
    }
  }

  addItem(item: Omit<CartItem, 'quantity'>) {
    const currentItems = [...this.cartItems.value];
    const existingItem = currentItems.find(i => i.id === item.id);

    if (existingItem) {
      existingItem.quantity++;
      existingItem.selected = true;
    } else {
      currentItems.push({ ...item, quantity: 1, selected: true });
    }

    this.cartItems.next(currentItems);
    this.persistCart();
  }

  addItemWithQuantity(item: Omit<CartItem, 'quantity'>, qty: number) {
    const currentItems = [...this.cartItems.value];
    const existingItem = currentItems.find(i => i.id === item.id);
    const safeQty = Math.max(1, Math.floor(qty));
    if (existingItem) {
      existingItem.quantity += safeQty;
      existingItem.selected = true;
    } else {
      currentItems.push({ ...item, quantity: safeQty, selected: true });
    }
    this.cartItems.next(currentItems);
    this.persistCart();
  }

  removeItem(id: number) {
    const currentItems = this.cartItems.value.filter(item => item.id !== id);
    this.cartItems.next(currentItems);
    this.persistCart();
  }

  removeItems(ids: number[]) {
    if (!Array.isArray(ids) || ids.length === 0) return;
    const keep = this.cartItems.value.filter(it => !ids.includes(it.id));
    this.cartItems.next(keep);
    this.persistCart();
  }

  updateQuantity(id: number, quantity: number) {
    const currentItems = [...this.cartItems.value];
    const item = currentItems.find(i => i.id === id);

    if (item) {
      if (quantity <= 0) {
        this.removeItem(id);
      } else {
        item.quantity = quantity;
        this.cartItems.next(currentItems);
        this.persistCart();
      }
    }
  }

  setSelected(id: number, selected: boolean) {
    const currentItems = [...this.cartItems.value];
    const item = currentItems.find(i => i.id === id);
    if (item) {
      item.selected = selected;
      this.cartItems.next(currentItems);
      this.persistCart();
    }
  }

  clearCart() {
    this.cartItems.next([]);
    this.persistCart();
  }

  getTotal(): number {
    return this.cartItems.value.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  getItemCount(): number {
    return this.cartItems.value.reduce((count, item) => count + item.quantity, 0);
  }

  /** Forzar recarga desde backend. Si mergeLocal es true, fusionar items locales previos que no existen en el remoto */
  reloadFromServer(mergeLocal = false) {
    const user = this.getUser();
    if (!user?.id) return;
    const url = `${environment.apiUrl}/api/user/${encodeURIComponent(user.id)}/cart`;
    const headers = this.getAuthHeaders();
    let localBackup: CartItem[] = [];
    if (mergeLocal) {
      try {
        const saved = localStorage.getItem('shopping_cart');
        localBackup = saved ? (JSON.parse(saved) as CartItem[]) : [];
      } catch {}
    }
    this.http.get<CartDTO>(url, headers).pipe(
      switchMap((cart: CartDTO | any) => {
        if (!cart || !cart.items) {
          return of<CartItem[]>([]);
        }
        this.serverCartId = cart.id;
        const enrich$ = cart.items.map((ci: CartItemDTO) =>
          this.productos.getProductoDetalle(ci.idProducto).pipe(
            map(det => ({ id: ci.idProducto, name: det.nombre, price: det.costoUnitario, quantity: ci.cantidad, image: det.url, selected: ci.selected ?? true } as CartItem)),
            catchError(() => of<CartItem>({ id: ci.idProducto, name: `Producto ${ci.idProducto}`, price: 0, quantity: ci.cantidad, selected: ci.selected ?? true }))
          )
        );
        return forkJoin<CartItem[]>(enrich$).pipe(
          map((remoteItems: CartItem[]) => {
            if (mergeLocal && localBackup.length > 0) {
              const idsRemote = new Set(remoteItems.map(r => r.id));
              const toAdd = localBackup.filter(lb => !idsRemote.has(lb.id));
              if (toAdd.length > 0) {
                remoteItems = remoteItems.concat(toAdd.map(t => ({ ...t, selected: t.selected ?? true })));
                // Persistir fusión en servidor
                this.cartItems.next(remoteItems as CartItem[]);
                this.persistCart();
                try { localStorage.removeItem('shopping_cart'); } catch {}
              }
            }
            return remoteItems as CartItem[];
          }),
          switchMap((allItems: CartItem[]) => this.enrichMissingImages(allItems))
        );
      }),
      catchError(err => {
        console.warn('[ShoppingCart] Error recargando carrito (reloadFromServer):', err);
        return of<CartItem[]>([]);
      })
    ).subscribe((items: CartItem[]) => {
      this.cartItems.next(items);
    });
  }

  /** Sincronizar estado actual al servidor explícitamente */
  syncToServer() {
    const user = this.getUser();
    if (!user?.id) return;
    const payload: CartDTO = {
      id: this.serverCartId,
      userId: user.id,
      items: this.cartItems.value.map(it => ({ idProducto: it.id, cantidad: it.quantity, selected: it.selected ?? true }))
    };
    const url = `${environment.apiUrl}/api/user/${encodeURIComponent(user.id)}/cart`;
    const headers = this.getAuthHeaders();
    this.http.put<CartDTO>(url, payload, headers).pipe(catchError(err => { console.warn('[ShoppingCart] syncToServer error:', err); return of(payload); })).subscribe(res => {
      this.serverCartId = res?.id ?? this.serverCartId;
    });
  }
}
