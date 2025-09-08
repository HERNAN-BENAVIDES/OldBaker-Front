import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface PedidoDetalle {
  id: number;
  proveedor: string;
  fechaPedido: string;
  fechaEntrega: string;
  estado: 'pendiente' | 'recibido' | 'verificado' | 'aprobado' | 'rechazado';
  items: ItemPedido[];
  total: number;
}

interface ItemPedido {
  id: number;
  insumo: string;
  cantidadPedida: number;
  cantidadRecibida: number;
  precioUnitario: number;
  fechaVencimiento?: string;
  estado: 'completo' | 'incompleto' | 'vencido' | 'defectuoso';
  observaciones?: string;
}

@Component({
  selector: 'app-detalles-pedidos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container">
      <header class="header">
        <button class="back-btn" (click)="goBack()">← Volver</button>
        <h1>🍞 Detalles de Pedidos</h1>
        <div class="filter-section">
          <select [value]="filtroEstado()" (change)="onFiltroChange($event)" class="filter-select">
            <option value="todos">Todos los estados</option>
            <option value="pendiente">Pendientes</option>
            <option value="recibido">Recibidos</option>
            <option value="verificado">Verificados</option>
          </select>
        </div>
      </header>

      <main class="main-content">
        <div class="stats-grid">
          <div class="stat-card pendiente">
            <h3>Pendientes</h3>
            <span class="stat-number">{{ getCountByStatus('pendiente') }}</span>
          </div>
          <div class="stat-card recibido">
            <h3>Recibidos</h3>
            <span class="stat-number">{{ getCountByStatus('recibido') }}</span>
          </div>
          <div class="stat-card verificado">
            <h3>Verificados</h3>
            <span class="stat-number">{{ getCountByStatus('verificado') }}</span>
          </div>
        </div>

        <div class="pedidos-list">
          <div *ngFor="let pedido of pedidosFiltrados()" class="pedido-card">
            <div class="pedido-header">
              <div class="pedido-info">
                <h3>Pedido #{{ pedido.id }}</h3>
                <p><strong>Proveedor:</strong> {{ pedido.proveedor }}</p>
                <p><strong>Fecha Pedido:</strong> {{ pedido.fechaPedido }}</p>
                <p><strong>Fecha Entrega:</strong> {{ pedido.fechaEntrega }}</p>
              </div>
              <div class="pedido-status">
                <span class="status-badge" [ngClass]="pedido.estado">{{ getStatusText(pedido.estado) }}</span>
                <span class="total">\${{ pedido.total | number:'1.2-2' }}</span>
              </div>
            </div>

            <div class="items-section" *ngIf="pedidoExpandido() === pedido.id">
              <h4>Detalles del Pedido:</h4>
              <div class="items-table">
                <div class="item-header">
                  <span>Insumo</span>
                  <span>Pedido</span>
                  <span>Recibido</span>
                  <span>Precio Unit.</span>
                  <span>Vencimiento</span>
                  <span>Estado</span>
                  <span>Acciones</span>
                </div>
                
                <div *ngFor="let item of pedido.items" class="item-row">
                  <span class="item-name">{{ item.insumo }}</span>
                  <span>{{ item.cantidadPedida }}</span>
                  <input 
                    type="number" 
                    [value]="item.cantidadRecibida"
                    (input)="updateCantidadRecibida(item, $event)"
                    [disabled]="pedido.estado === 'aprobado'"
                    class="cantidad-input">
                  <span>\${{ item.precioUnitario }}</span>
                  <span [ngClass]="{'vencido': isVencido(item.fechaVencimiento)}">
                    {{ item.fechaVencimiento || 'N/A' }}
                  </span>
                  <select 
                    [value]="item.estado"
                    (change)="updateEstadoItem(item, $event)"
                    [disabled]="pedido.estado === 'aprobado'" 
                    class="estado-select">
                    <option value="completo">Completo</option>
                    <option value="incompleto">Incompleto</option>
                    <option value="vencido">Vencido</option>
                    <option value="defectuoso">Defectuoso</option>
                  </select>
                  <button 
                    class="btn-secondary" 
                    (click)="abrirObservaciones(item)"
                    *ngIf="item.estado !== 'completo'">
                    Observar
                  </button>
                </div>
              </div>

              <div class="verification-actions" *ngIf="pedido.estado !== 'aprobado'">
                <button class="btn-success" (click)="aprobarPedido(pedido)">✓ Aprobar como Pagable</button>
                <button class="btn-warning" (click)="marcarIncompleto(pedido)">⚠️ Marcar Incompleto</button>
                <button class="btn-danger" (click)="rechazarPedido(pedido)">✗ Rechazar Pedido</button>
              </div>
            </div>

            <div class="pedido-actions">
              <button 
                class="btn-primary" 
                (click)="toggleExpansion(pedido.id)">
                {{ pedidoExpandido() === pedido.id ? 'Ocultar' : 'Ver' }} Detalles
              </button>
            </div>
          </div>
        </div>
      </main>

      <!-- Modal de Observaciones -->
      <div class="modal-overlay" *ngIf="modalObservaciones()">
        <div class="modal">
          <h3>Observaciones</h3>
          <textarea 
            [value]="observacionTemp()"
            (input)="updateObservacion($event)"
            placeholder="Describe el problema o observación..."
            rows="4"></textarea>
          <div class="modal-actions">
            <button class="btn-secondary" (click)="cerrarModal()">Cancelar</button>
            <button class="btn-primary" (click)="guardarObservacion()">Guardar</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./detalles-pedidos.component.css']
})
export class DetallesPedidosComponent implements OnInit {
  
  readonly pedidos = signal<PedidoDetalle[]>([]);
  readonly pedidosFiltrados = signal<PedidoDetalle[]>([]);
  readonly filtroEstado = signal<string>('todos');
  readonly pedidoExpandido = signal<number | null>(null);
  readonly modalObservaciones = signal<boolean>(false);
  readonly observacionTemp = signal<string>('');
  
  private itemSeleccionado: ItemPedido | null = null;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.loadPedidos();
  }

  onFiltroChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.filtroEstado.set(target.value);
    this.filtrarPedidos();
  }

  updateObservacion(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    this.observacionTemp.set(target.value);
  }

  updateCantidadRecibida(item: ItemPedido, event: Event): void {
    const target = event.target as HTMLInputElement;
    item.cantidadRecibida = parseInt(target.value) || 0;
  }

  updateEstadoItem(item: ItemPedido, event: Event): void {
    const target = event.target as HTMLSelectElement;
    item.estado = target.value as 'completo' | 'incompleto' | 'vencido' | 'defectuoso';
  }

  private loadPedidos(): void {
    // Simulación de datos - en producción vendría del backend
    const pedidosData: PedidoDetalle[] = [
      {
        id: 1001,
        proveedor: 'Molinos La Rosa',
        fechaPedido: '2024-01-15',
        fechaEntrega: '2024-01-18',
        estado: 'recibido',
        total: 1250.50,
        items: [
          {
            id: 1,
            insumo: 'Harina de Trigo (50kg)',
            cantidadPedida: 10,
            cantidadRecibida: 10,
            precioUnitario: 45.00,
            fechaVencimiento: '2024-06-15',
            estado: 'completo'
          },
          {
            id: 2,
            insumo: 'Azúcar Blanca (25kg)',
            cantidadPedida: 15,
            cantidadRecibida: 12,
            precioUnitario: 35.00,
            fechaVencimiento: '2025-12-01',
            estado: 'incompleto'
          }
        ]
      },
      {
        id: 1002,
        proveedor: 'Lácteos del Valle',
        fechaPedido: '2024-01-16',
        fechaEntrega: '2024-01-19',
        estado: 'pendiente',
        total: 890.25,
        items: [
          {
            id: 3,
            insumo: 'Mantequilla (5kg)',
            cantidadPedida: 8,
            cantidadRecibida: 0,
            precioUnitario: 55.00,
            fechaVencimiento: '2024-02-20',
            estado: 'completo'
          }
        ]
      }
    ];
    
    this.pedidos.set(pedidosData);
    this.filtrarPedidos();
  }

  filtrarPedidos(): void {
    const filtro = this.filtroEstado();
    const pedidos = this.pedidos();
    
    if (filtro === 'todos') {
      this.pedidosFiltrados.set(pedidos);
    } else {
      this.pedidosFiltrados.set(pedidos.filter(p => p.estado === filtro));
    }
  }

  getCountByStatus(estado: string): number {
    return this.pedidos().filter(p => p.estado === estado).length;
  }

  getStatusText(estado: string): string {
    const estados: Record<string, string> = {
      pendiente: 'Pendiente',
      recibido: 'Recibido',
      verificado: 'Verificado',
      aprobado: 'Aprobado',
      rechazado: 'Rechazado'
    };
    return estados[estado] || estado;
  }

  toggleExpansion(pedidoId: number): void {
    if (this.pedidoExpandido() === pedidoId) {
      this.pedidoExpandido.set(null);
    } else {
      this.pedidoExpandido.set(pedidoId);
    }
  }

  isVencido(fecha?: string): boolean {
    if (!fecha) return false;
    return new Date(fecha) < new Date();
  }

  aprobarPedido(pedido: PedidoDetalle): void {
    // Verificar que todos los items estén completos
    const todosCompletos = pedido.items.every(item => 
      item.cantidadRecibida >= item.cantidadPedida && item.estado === 'completo'
    );

    if (todosCompletos) {
      pedido.estado = 'aprobado';
      this.showNotification('Pedido aprobado como pagable', 'success');
    } else {
      this.showNotification('No se puede aprobar: hay items incompletos o con problemas', 'error');
    }
  }

  marcarIncompleto(pedido: PedidoDetalle): void {
    pedido.estado = 'verificado';
    this.showNotification('Pedido marcado como incompleto', 'warning');
  }

  rechazarPedido(pedido: PedidoDetalle): void {
    pedido.estado = 'rechazado';
    this.showNotification('Pedido rechazado', 'error');
  }

  abrirObservaciones(item: ItemPedido): void {
    this.itemSeleccionado = item;
    this.observacionTemp.set(item.observaciones || '');
    this.modalObservaciones.set(true);
  }

  cerrarModal(): void {
    this.modalObservaciones.set(false);
    this.itemSeleccionado = null;
    this.observacionTemp.set('');
  }

  guardarObservacion(): void {
    if (this.itemSeleccionado) {
      this.itemSeleccionado.observaciones = this.observacionTemp();
      this.showNotification('Observación guardada', 'success');
    }
    this.cerrarModal();
  }

  goBack(): void {
    this.router.navigate(['/auxiliar']);
  }

  private showNotification(message: string, type: 'success' | 'error' | 'warning'): void {
    console.log(`${type.toUpperCase()}: ${message}`);
  }
}