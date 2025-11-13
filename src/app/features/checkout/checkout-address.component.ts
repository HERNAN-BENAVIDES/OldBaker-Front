import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ShoppingCartService, CartItem } from '../../shared/shopping-cart/shopping-cart.service';
import { AuthService } from '../auth/services/auth.service';
import { NotificationService } from '../../shared/notification/notification.service';
import { environment } from '../../../environments/environment'; // asegurar import

interface DireccionResponseDTO {
  id: number;
  ciudad: string;
  barrio: string;
  carrera: string;
  calle: string;
  numero: string;
  numeroTelefono: string;
}

@Component({
  selector: 'app-checkout-address',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './checkout-address.component.html',
  styleUrls: ['./checkout-address.component.css']
})
export class CheckoutAddressComponent implements OnInit {
  selectedItems: CartItem[] = [];
  total = 0;
  isLoading = false;

  addresses: DireccionResponseDTO[] = [];
  selectedDeliveryAddressId: number | null = null;
  selectedBillingAddressId: number | null = null;
  useSameAddress = true;
  showNewAddressForm = false;
  newAddress: Partial<DireccionResponseDTO> = {
    ciudad: '',
    barrio: '',
    carrera: '',
    calle: '',
    numero: '',
    numeroTelefono: ''
  };
  creatingAddress = false;

  constructor(
    private cartService: ShoppingCartService,
    private authService: AuthService,
    private notifications: NotificationService,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.loadSelectedItems();
    if (this.selectedItems.length === 0) {
      this.notifications.showInfo('No hay productos seleccionados en el carrito.');
      this.router.navigate(['/cart']);
      return;
    }
    this.loadUserAddresses();
  }

  private loadSelectedItems() {
    try {
      const raw = localStorage.getItem('cart_selected_ids');
      if (raw) {
        const selectedIds: number[] = JSON.parse(raw);
        const current = (this.cartService as any).cartItems?.value as CartItem[] || [];
        this.selectedItems = current.filter(item => selectedIds.includes(item.id));
        this.total = this.selectedItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
      }
    } catch (e) {
      console.error('[CheckoutAddress] Error cargando items seleccionados:', e);
    }
  }

  normalizeAddresses(response: any[]): DireccionResponseDTO[] {
  return response
    .map(item => {
      const dir = item.direccion;
      if (!dir) return null; // <- si no hay dirección, retorna null temporalmente
      return {
        id: item.orderId ?? 0,
        ciudad: dir.ciudad,
        barrio: dir.barrio,
        carrera: dir.carrera,
        calle: dir.calle,
        numero: dir.numero,
        numeroTelefono: dir.numeroTelefono
      } as DireccionResponseDTO;
    })
    .filter((d): d is DireccionResponseDTO => d !== null); // <- elimina los null
}




  private loadUserAddresses() {
    const user = this.getUserFromStorage();
    const idUsuario = user?.id;
    if (!idUsuario) {
      this.notifications.showInfo('Debes iniciar sesión para continuar');
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/checkout/address' } });
      return;
    }
    this.isLoading = true;
    this.authService.getDireccionUsuario(idUsuario).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        const list = this.normalizeAddresses(res);
        this.addresses = list;
        console.log('[CheckoutAddress] Direcciones normalizadas:', this.addresses);
        if (this.addresses.length === 0) {
          this.showNewAddressForm = true;
          this.notifications.showInfo('No se detectaron direcciones válidas. Crea una para continuar.');
        } else {
          this.selectedDeliveryAddressId = this.addresses[0].id;
          this.selectedBillingAddressId = this.addresses[0].id;
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('[CheckoutAddress] Error obteniendo direcciones:', err);
        this.notifications.showError('No se pudieron cargar tus direcciones');
      }
    });
  }

  goBack() {
    this.router.navigate(['/cart']);
  }

  toggleUseSameAddress() {
    if (this.useSameAddress) {
      // al activar, igualar facturación a entrega
      this.selectedBillingAddressId = this.selectedDeliveryAddressId;
    }
  }

  openNewAddressForm() {
    this.showNewAddressForm = true;
  }

  cancelNewAddress() {
    this.showNewAddressForm = false;
    this.resetNewAddress();
  }

  private resetNewAddress() {
    this.newAddress = { ciudad: '', barrio: '', carrera: '', calle: '', numero: '', numeroTelefono: '' };
  }

  canCreateAddress(): boolean {
  return !!this.newAddress.ciudad &&
         !!this.newAddress.barrio &&
         !!this.newAddress.carrera &&
         !!this.newAddress.calle &&
         !!this.newAddress.numero &&
         !!this.newAddress.numeroTelefono;
}

  

  createAddress() {
    if (!this.canCreateAddress()) {
      this.notifications.showError('Completa todos los campos de la nueva dirección');
      return;
    }
    const user = this.getUserFromStorage();
    const idUsuario = user?.id;
    if (!idUsuario) {
      this.notifications.showError('Usuario no identificado');
      return;
    }
    this.creatingAddress = true;
    const token = this.authService.getToken();
    const cleanToken = token ? token.replace(/^Bearer\s+/i, '').trim() : '';
    const headers = token ? { headers: { Authorization: `Bearer ${cleanToken}` } } : {};
    const payload = { idUsuario, ...this.newAddress };
    this.http.post('/api/user/direccion', payload, headers).subscribe({
      next: (resp: any) => {
        this.creatingAddress = false;
        // asumir que resp contiene la nueva dirección (o su id)
        const created: DireccionResponseDTO = resp?.id ? resp : { id: resp.id, ciudad: this.newAddress.ciudad!, barrio: this.newAddress.barrio!, carrera: this.newAddress.carrera!, calle: this.newAddress.calle!, numero: this.newAddress.numero!, numeroTelefono: this.newAddress.numeroTelefono! } as DireccionResponseDTO;
        this.addresses.push(created);
        this.selectedDeliveryAddressId = created.id;
        if (this.useSameAddress) this.selectedBillingAddressId = created.id;
        this.showNewAddressForm = false;
        this.notifications.showSuccess('Dirección creada correctamente');
        this.resetNewAddress();
      },
      error: err => {
        this.creatingAddress = false;
        const msg = err?.error?.error || err?.error?.message || 'Error creando dirección';
        this.notifications.showError(msg);
      }
    });
  }

  proceedToPayment() {
    if (!this.selectedDeliveryAddressId) {
      this.notifications.showInfo('Selecciona una dirección de entrega');
      return;
    }
    if (!this.useSameAddress && !this.selectedBillingAddressId) {
      this.notifications.showInfo('Selecciona una dirección de facturación');
      return;
    }
    const token = this.authService.getToken();
    const currentUser = this.getUserFromStorage();
    const payerEmail = currentUser?.email;
    if (!token) {
      this.notifications.showInfo('Debes iniciar sesión antes de pagar');
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/checkout/address' } });
      return;
    }
    if (!payerEmail) {
      this.notifications.showError('No se encontró email del usuario');
      return;
    }
    const delivery = this.addresses.find(a => a.id === this.selectedDeliveryAddressId);
    const billing = this.useSameAddress ? delivery : this.addresses.find(a => a.id === this.selectedBillingAddressId!);
    if (!delivery || !billing) {
      this.notifications.showError('Direcciones inválidas seleccionadas');
      return;
    }
    this.isLoading = true;
    const cleanToken = String(token).replace(/^Bearer\s+/i, '').trim();
    const headers = { headers: { Authorization: `Bearer ${cleanToken}` } };
    const payload = {
      payerEmail,
      items: this.selectedItems.map(item => ({ productId: item.id, quantity: item.quantity })),
      deliveryAddress: delivery,
      billingAddress: billing
    };

    const urlCheckout = `${environment.apiUrl}/api/orders/checkout`;
    this.http.post(urlCheckout, payload, headers).subscribe({
      next: (resp: any) => {
        this.isLoading = false;
        if (resp?.initPoint) {
          try { localStorage.removeItem('cart_selected_ids'); } catch {}
          window.location.href = resp.initPoint;
        } else {
          this.notifications.showSuccess('Pedido creado correctamente');
          this.router.navigate(['/mis-pedidos']);
        }
      },
      error: err => {
        this.isLoading = false;
        const msg = err?.error?.error || err?.error?.message || 'Error procesando el pedido';
        this.notifications.showError(msg);
      }
    });
  }

  private getUserFromStorage(): any {
    try {
      const raw = localStorage.getItem('auth_user');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }
}
