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

  selectedDeliveryDate: string | null = null; // yyyy-MM-dd
  minSelectableDate: string = '';
  dateError: string | null = null;

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
    this.setupMinDate();
  }

  private setupMinDate() {
    // Mínimo 2 días desde hoy, ajustando si cae en domingo
    const min = new Date();
    min.setDate(min.getDate() + 2);
    // Evitar domingo (0)
    if (min.getDay() === 0) {
      min.setDate(min.getDate() + 1);
    }
    this.minSelectableDate = this.toInputDate(min);
  }

  private toInputDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
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

  private normalizeAddresses(res: any): DireccionResponseDTO[] {
    if (!res) return [];
    // Log bruto para diagnóstico
    try { console.log('[CheckoutAddress] Respuesta cruda direcciones:', JSON.stringify(res)); } catch {}

    // Si ya es array directamente
    if (Array.isArray(res)) {
      return res.filter(r => r && typeof r === 'object');
    }

    // Si viene envuelta en data
    if (res.data) {
      const d = res.data;
      if (Array.isArray(d)) return d as DireccionResponseDTO[];
      if (Array.isArray(d.direcciones)) return d.direcciones as DireccionResponseDTO[];
      if (Array.isArray(d.direccion)) return d.direccion as DireccionResponseDTO[];
      if (d.direcciones && typeof d.direcciones === 'object') {
        // Puede ser objeto cuyos valores son direcciones
        return Object.values(d.direcciones).filter(v => v && typeof v === 'object') as DireccionResponseDTO[];
      }
      if (d.direccion && typeof d.direccion === 'object') return [d.direccion] as DireccionResponseDTO[];
    }

    // Propiedades alternativas en raíz
    if (Array.isArray(res.direcciones)) return res.direcciones as DireccionResponseDTO[];
    if (Array.isArray(res.direccion)) return res.direccion as DireccionResponseDTO[];

    // Objeto cuyos valores parecen direcciones (sin idUsuario pero con campos de dirección)
    const values = Object.values(res);
    if (values.every(v => typeof v === 'object')) {
      const candidates = values.filter((v: any) => v && (v.ciudad || v.barrio || v.carrera));
      if (candidates.length > 1) return candidates as DireccionResponseDTO[];
    }

    // Caso objeto único de dirección (tiene ciudad / barrio / calle / id)
    if (res.ciudad || res.barrio || res.calle || res.carrera) {
      return [res as DireccionResponseDTO];
    }

    return [];
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
    return !!this.newAddress.ciudad && !!this.newAddress.barrio && !!this.newAddress.carrera && !!this.newAddress.calle && !!this.newAddress.numero && !!this.newAddress.numeroTelefono;
  }

  createAddress() {
    if (!this.canCreateAddress()) {
      this.notifications.showError('Completa todos los campos de la nueva dirección');
      return;
    }
    // Construir DTO con id null como solicita el backend
    const dto = {
      id: null,
      ciudad: String(this.newAddress.ciudad || ''),
      barrio: String(this.newAddress.barrio || ''),
      carrera: String(this.newAddress.carrera || ''),
      calle: String(this.newAddress.calle || ''),
      numero: String(this.newAddress.numero || ''),
      numeroTelefono: String(this.newAddress.numeroTelefono || '')
    };

    this.creatingAddress = true;
    const token = this.authService.getToken();
    const cleanToken = token ? token.replace(/^Bearer\s+/i, '').trim() : '';
    const headers = token ? { headers: { Authorization: `Bearer ${cleanToken}` } } : {};
    // Obtener idUsuario requerido por el backend como RequestParam
    const user = this.getUserFromStorage();
    const idUsuario = user?.id;
    if (!idUsuario) {
      this.creatingAddress = false;
      this.notifications.showError('No se pudo determinar el usuario. Inicia sesión nuevamente.');
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/checkout/address' } });
      return;
    }

    const url = `${environment.apiUrl}/api/user/agregar-direccion?idUsuario=${encodeURIComponent(idUsuario)}`;
    try { console.log('[Checkout] POST crear dirección →', url, 'body:', dto); } catch {}
    this.http.post<DireccionResponseDTO | any>(url, dto as any, headers).subscribe({
      next: (resp: any) => {
        this.creatingAddress = false;
        const created: DireccionResponseDTO = resp?.id
          ? resp
          : {
              id: resp?.id ?? null,
              ciudad: dto.ciudad,
              barrio: dto.barrio,
              carrera: dto.carrera,
              calle: dto.calle,
              numero: dto.numero,
              numeroTelefono: dto.numeroTelefono
            } as any;

        if (!Array.isArray(this.addresses)) this.addresses = [];
        this.addresses.push(created);
        this.selectedDeliveryAddressId = created.id ?? this.selectedDeliveryAddressId;
        if (this.selectedDeliveryAddressId == null) {
          this.reloadAddressesSelecting(dto as any);
        } else if (this.useSameAddress) {
          this.selectedBillingAddressId = this.selectedDeliveryAddressId;
        }
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

  private reloadAddressesSelecting(dto: Partial<DireccionResponseDTO>) {
    // Implementar lógica para recargar direcciones y seleccionar la recién creada
    const user = this.getUserFromStorage();
    const idUsuario = user?.id;
    if (!idUsuario) return;

    this.authService.getDireccionUsuario(idUsuario).subscribe({
      next: (res: any) => {
        const list = this.normalizeAddresses(res);
        this.addresses = list;
        const created = list.find(addr => addr.calle === dto.calle && addr.numero === dto.numero && addr.ciudad === dto.ciudad);
        if (created) {
          this.selectedDeliveryAddressId = created.id;
          if (this.useSameAddress) {
            this.selectedBillingAddressId = created.id;
          }
        }
      },
      error: (err) => {
        console.error('[CheckoutAddress] Error reloading addresses:', err);
        this.notifications.showError('Error al recargar direcciones');
      }
    });
  }

  onDateChange(value: string) {
    this.dateError = null;
    if (!value) { this.dateError = 'Selecciona una fecha de entrega'; return; }
    const chosen = new Date(value + 'T00:00:00');
    const min = new Date(this.minSelectableDate + 'T00:00:00');
    if (chosen < min) {
      this.dateError = `La fecha debe ser al menos ${this.minSelectableDate}`;
      return;
    }
    if (chosen.getDay() === 0) { // domingo
      this.dateError = 'No se realizan entregas los domingos';
      return;
    }
  }

  private computeEstimatedDeliveryDateTime(): string {
    // Si el usuario seleccionó una fecha, usar esa fecha a las 09:00 hora local; si no, fallback a +48h
    if (this.selectedDeliveryDate && !this.dateError) {
      const parts = this.selectedDeliveryDate.split('-');
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 9, 0, 0);
      return d.toISOString();
    }
    const d = new Date(Date.now() + 48 * 60 * 60 * 1000);
    return d.toISOString();
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

    // Asegurar que contamos con un ID de dirección (si se creó recién y no tiene id, refrescar)
    if (this.selectedDeliveryAddressId == null) {
      this.notifications.showInfo('Actualizando tus direcciones...');
      this.loadUserAddresses();
      return;
    }

    // Construir CheckoutRequestDTO
    const direccionId = this.selectedDeliveryAddressId as number;
    const estimated = this.computeEstimatedDeliveryDateTime();

    this.isLoading = true;
    const cleanToken = String(token).replace(/^Bearer\s+/i, '').trim();
    const headers = { headers: { Authorization: `Bearer ${cleanToken}` } };
    const payload = {
      payerEmail,
      direccionId,
      fechadeEntregaEstimada: estimated,
      items: this.selectedItems.map(item => ({ productId: item.id, quantity: item.quantity }))
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

  private getUserFromStorage() {
    try {
      const raw = localStorage.getItem('auth_user');
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error('[CheckoutAddress] Error reading user from storage:', e);
      return null;
    }
  }

  // ... existing methods ...
}
