import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RepartidorHeader } from '../layout/repartidor-header';
import { RepartidorFooter } from '../layout/repartidor-footer';
import { DeliveriesService, DeliveryOrder } from '../services/deliveries.service';
import { NotificationService } from '../../../shared/notification/notification.service';

@Component({
  selector: 'app-repartidor-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, RepartidorHeader, RepartidorFooter],
  template: `
    <app-repartidor-header></app-repartidor-header>
    <section class="repartidor-root">
      <header class="repartidor-header center">
        <h1>Panel de Repartidor</h1>
      </header>

      <section class="summary-cards">
        <article class="summary-card clickable" (click)="openModal('hoy')">
          <h3>Entregas del día</h3>
          <div class="count">{{ delDia.length }}</div>
          <p class="hint">Órdenes asignadas para hoy</p>
        </article>
        <article class="summary-card clickable" (click)="openModal('futuras')">
          <h3>Próximas</h3>
          <div class="count">{{ futuras.length }}</div>
          <p class="hint">Entregas programadas a futuro</p>
        </article>
        <article class="summary-card clickable" (click)="openModal('historial')">
          <h3>Historial</h3>
          <div class="count">{{ entregadas.length }}</div>
          <p class="hint">Entregas completadas</p>
        </article>
      </section>

      <ng-template #stateTpl>
        <div *ngIf="loading" class="loading">Cargando órdenes...</div>
        <div *ngIf="!loading && error" class="error">{{ error }}</div>
      </ng-template>

      <!-- Modal simple -->
      <div class="modal-backdrop" *ngIf="modalOpen" (click)="closeModal()"></div>
      <div class="modal" *ngIf="modalOpen" role="dialog" aria-modal="true">
        <header class="modal-header">
          <h3>{{ modalTitle }}</h3>
          <button class="modal-close" (click)="closeModal()">✕</button>
        </header>
        <div class="modal-body">
          <input type="text" [(ngModel)]="search" placeholder="Buscar por número de guía" class="search-input" />
          <ul class="orders" *ngIf="currentList?.length; else emptyTpl">
            <li *ngFor="let o of currentList" class="order">
              <div class="top">
                <strong>{{ o.trackingCode }}</strong>
                <span class="badge status-{{ o.deliveryStatus | lowercase }}">{{ o.deliveryStatus }}</span>
              </div>
              <div class="mid">
                <span>Asignada: {{ o.fechaAsignacion | date:'short' }}</span>
                <span>ETA: {{ o.fechaEntregaEstimada | date:'short' }}</span>
              </div>
              <div class="addr">
                {{ o.direccion.ciudad }} · {{ o.direccion.barrio }} · Cra {{ o.direccion.carrera }} # {{ o.direccion.calle }} - {{ o.direccion.numero }} · {{ o.direccion.numeroTelefono }}
              </div>
              <div class="bottom">
                <button class="btn-link" (click)="openDetailModal(o)">Detalles</button>
              </div>
            </li>
          </ul>
          <ng-template #emptyTpl>
            <div class="empty">No hay órdenes para mostrar.</div>
          </ng-template>
        </div>
      </div>

      <!-- Modal de detalles -->
      <div class="modal-backdrop" *ngIf="detailModalOpen" (click)="closeDetailModal()"></div>
      <div class="modal2" *ngIf="detailModalOpen" role="dialog" aria-modal="true">
        <header class="modal2-header">
          <h3>Detalles de la orden</h3>
          <button class="modal-close" (click)="closeDetailModal()">✕</button>
        </header>
        <div class="modal2-body">
          <!-- Contenido del detalle de la orden -->
          <p><strong>Código de seguimiento:</strong> {{ selectedOrder?.trackingCode }}</p>
          <p><strong>Estado de entrega:</strong> {{ selectedOrder?.deliveryStatus }}</p>
          <p><strong>Asignada:</strong> {{ selectedOrder?.fechaAsignacion | date:'short' }}</p>
          <p><strong>ETA:</strong> {{ selectedOrder?.fechaEntregaEstimada | date:'short' }}</p>
          <p><strong>Dirección:</strong> {{ selectedOrder?.direccion?.ciudad }}, {{ selectedOrder?.direccion?.barrio }}, Cra {{ selectedOrder?.direccion?.carrera }}, # {{ selectedOrder?.direccion?.calle }} - {{ selectedOrder?.direccion?.numero }}</p>
          <p><strong>Teléfono:</strong> {{ selectedOrder?.direccion?.numeroTelefono }}</p>
          <div class="actions" *ngIf="shouldShowActions()">
            <button class="btn-action" *ngIf="canPickup(selectedOrder)" (click)="markPickedUp(selectedOrder)">Marcar como despachada</button>
            <button class="btn-action" *ngIf="canDeliver(selectedOrder)" (click)="markDelivered(selectedOrder)">Marcar como entregada</button>
          </div>
        </div>
      </div>
    </section>
    <app-repartidor-footer></app-repartidor-footer>
  `,
  styles: [
    `
    .repartidor-root { padding: 24px; max-width: 1100px; margin: 0 auto; padding-bottom: 84px; }
    .repartidor-header { display:flex; align-items:center; justify-content: space-between; margin-bottom: 16px; }
    .repartidor-header.center { justify-content: center; text-align: center; }
    .summary-cards { display:grid; grid-template-columns: repeat(auto-fill, minmax(220px,1fr)); gap: 16px; margin-bottom: 16px; }
    .summary-card { background:#3b82f6; color:#0b2540; border-radius: 12px; padding: 16px; box-shadow: 0 6px 16px rgba(2,6,23,.25); border:1px solid rgba(15,23,42,.1); transition: transform .12s ease, box-shadow .12s ease; }
    .summary-card h3 { margin:0 0 6px; font-size: .95rem; font-weight: 800; color:#0b2540; }
    .summary-card .count { font-size: 2rem; font-weight: 900; line-height: 1; color:#0b2540; }
    .summary-card .hint { margin: 6px 0 0; font-size:.85rem; color:#0b2540; opacity:.9; }
    .summary-card.clickable { cursor:pointer; }
    .summary-card.clickable:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(2,6,23,.25); }

    .orders { list-style:none; padding:0; display:flex; flex-direction:column; gap:12px; }
    .order { border:1px solid #e5e7eb; border-radius:10px; padding:12px; background:#fff; }
    .top { display:flex; align-items:center; justify-content: space-between; }
    .mid { display:flex; gap:16px; color:#475569; font-size: .9rem; }
    .addr { margin: 6px 0; color:#334155; }
    .bottom { display:flex; align-items:center; justify-content: flex-end; gap:10px; }
    .badge { padding:2px 8px; border-radius:9999px; font-size:.75rem; background:#e2e8f0; }
    .status-preparing { background:#fde68a; color:#92400e; }
    .status-delivered { background:#bbf7d0; color:#166534; }

    /* Modal */
    .modal-backdrop { position:fixed; inset:0; background:rgba(0,0,0,.35); }
    .modal { position:fixed; left:50%; top:50%; transform:translate(-50%,-50%); width:min(92vw, 760px); background:#fff; border-radius:12px; box-shadow:0 20px 50px rgba(2,6,23,.35); overflow:hidden; }
    .modal-header { display:flex; align-items:center; justify-content:space-between; padding:12px 16px; background:#2563eb; color:#fff; }
    .modal-body { padding:16px; max-height:70vh; overflow:auto; }
    .modal-close { background:transparent; border:none; color:#fff; font-size:1.2rem; cursor:pointer; }

    .loading, .error, .empty { padding: 12px; border-radius:8px; background:#f1f5f9; }

    .btn-link { background:#2563eb; color:#fff; border:none; padding:6px 10px; border-radius:6px; cursor:pointer; font-weight:600; }
    .btn-link:hover { background:#1d4ed8; }

    /* Segundo modal para detalles */
    .modal2 { position:fixed; left:50%; top:50%; transform:translate(-50%,-50%); width:min(92vw, 600px); background:#fff; border-radius:12px; box-shadow:0 20px 50px rgba(2,6,23,.35); overflow:hidden; }
    .modal2-header { display:flex; align-items:center; justify-content:space-between; padding:12px 16px; background:#2563eb; color:#fff; }
    .modal2-body { padding:16px; }
    .actions { margin-top: 12px; display: flex; gap: 10px; }
    .btn-action { flex: 1; padding: 10px; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; background:#60a5fa; color:#0f172a; box-shadow:0 2px 6px rgba(0,0,0,.15); transition:background .2s ease, transform .15s ease; }
    .btn-action:hover { background:#3b82f6; transform:translateY(-2px); }
    .btn-action:disabled { opacity:.5; cursor:not-allowed; transform:none; }
    `
  ]
})
export class RepartidorDashboardComponent implements OnInit {
  delDia: DeliveryOrder[] = [];
  futuras: DeliveryOrder[] = [];
  entregadas: DeliveryOrder[] = [];
  loading = true;
  error: string | null = null;
  modalOpen = false;
  modalTitle = '';
  currentList: DeliveryOrder[] = [];
  detailModalOpen = false;
  selectedOrder: DeliveryOrder | null = null;
  search = '';
  currentModalType: 'hoy' | 'futuras' | 'historial' | null = null;

  constructor(private deliveries: DeliveriesService, private notifications: NotificationService) {}

  ngOnInit(): void {
    this.loading = true;
    this.deliveries.fetchMyOrders().subscribe({
      next: (res) => {
        this.delDia = res?.delDia ?? [];
        this.futuras = res?.futuras ?? [];
        this.entregadas = res?.entregadas ?? [];
        this.loading = false;
      },
      error: () => {
        this.error = 'No se pudieron cargar tus órdenes de reparto';
        this.loading = false;
      }
    });
  }

  openModal(tipo: 'hoy' | 'futuras' | 'historial') {
    this.modalTitle = tipo === 'hoy' ? 'Entregas del día' : tipo === 'futuras' ? 'Próximas entregas' : 'Historial de entregas';
    this.currentModalType = tipo;
    const list = this.getListForModal();
    this.currentList = this.applySearch(list);
    this.modalOpen = true;
  }

  closeModal() {
    this.modalOpen = false;
    this.currentList = [];
    this.search = '';
    this.currentModalType = null;
  }

  openDetailModal(order: DeliveryOrder) {
    this.selectedOrder = order;
    this.detailModalOpen = true;
  }

  closeDetailModal() {
    this.detailModalOpen = false;
    this.selectedOrder = null;
  }

  onSearchChange() {
    if (!this.modalOpen) return;
    this.currentList = this.applySearch(this.getListForModal());
  }

  private getListForModal(): DeliveryOrder[] {
    if (this.currentModalType === 'hoy') return this.delDia;
    if (this.currentModalType === 'futuras') return this.futuras;
    if (this.currentModalType === 'historial') return this.entregadas;
    return [];
  }

  applySearch(list: DeliveryOrder[]): DeliveryOrder[] {
    const q = this.search.trim().toLowerCase();
    if (!q) return [...list];
    return list.filter(o => `${o.trackingCode}`.toLowerCase().includes(q) || `${o.orderId}`.includes(q));
  }

  // Acciones
  markPickedUp(order: DeliveryOrder | null) {
    if (!order) return;
    this.deliveries.pickup(order.orderId).subscribe({
      next: (res: any) => {
        this.notifications.showSuccess(res?.message || 'Orden marcada como despachada');
        this.reload();
      },
      error: (err) => {
        const msg = err?.error?.error || err?.message || 'No se pudo marcar como despachada';
        this.notifications.showError(msg);
      }
    });
  }

  markDelivered(order: DeliveryOrder | null) {
    if (!order) return;
    this.deliveries.complete(order.orderId).subscribe({
      next: (res: any) => {
        this.notifications.showSuccess(res?.message || 'Orden marcada como entregada');
        this.reload();
      },
      error: (err) => {
        const msg = err?.error?.error || err?.message || 'No se pudo marcar como entregada';
        this.notifications.showError(msg);
      }
    });
  }

  private reload() {
    this.loading = true;
    this.deliveries.fetchMyOrders().subscribe({
      next: (res) => {
        this.delDia = res?.delDia ?? [];
        this.futuras = res?.futuras ?? [];
        this.entregadas = res?.entregadas ?? [];
        if (this.modalOpen && this.currentModalType) {
          this.currentList = this.applySearch(this.getListForModal());
        }
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  canPickup(order: DeliveryOrder | null): boolean { return !!order && this.currentModalType === 'hoy' && order.deliveryStatus === 'READY_FOR_DISPATCH'; }
  canDeliver(order: DeliveryOrder | null): boolean { return !!order && this.currentModalType === 'hoy' && order.deliveryStatus === 'DISPATCHED'; }
  shouldShowActions(): boolean { return !!this.selectedOrder && this.currentModalType === 'hoy' && (this.canPickup(this.selectedOrder) || this.canDeliver(this.selectedOrder)); }
}
