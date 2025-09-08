import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface PedidoInsumo {
  id: number;
  proveedor: string;
  fechaPedido: string;
  fechaEntrega: string;
  estado: 'pendiente' | 'en_transito' | 'recibido' | 'verificado' | 'aprobado';
  cantidadItems: number;
  total: number;
  observaciones?: string;
}

@Component({
  selector: 'app-pedidos-insumos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container">
      <header class="header">
        <button class="back-btn" (click)="goBack()">← Volver</button>
        <h1>📦 Pedidos de Insumos</h1>
        <div class="header-actions">
          <input 
            type="text" 
            [value]="busqueda()"
            (input)="onBusquedaChange($event)"
            placeholder="Buscar por proveedor..."
            class="search-input">
          <select [value]="filtroEstado()" (change)="onFiltroChange($event)" class="filter-select">
            <option value="todos">Todos</option>
            <option value="pendiente">Pendientes</option>
            <option value="en_transito">En Tránsito</option>
            <option value="recibido">Recibidos</option>
            <option value="verificado">Verificados</option>
            <option value="aprobado">Aprobados</option>
          </select>
        </div>
      </header>

      <main class="main-content">
        <!-- Resumen de estadísticas -->
        <div class="stats-section">
          <div class="stat-card pendiente">
            <div class="stat-icon">⏳</div>
            <div class="stat-info">
              <span class="stat-number">{{ getCountByStatus('pendiente') }}</span>
              <span class="stat-label">Pendientes</span>
            </div>
          </div>
          <div class="stat-card en_transito">
            <div class="stat-icon">🚛</div>
            <div class="stat-info">
              <span class="stat-number">{{ getCountByStatus('en_transito') }}</span>
              <span class="stat-label">En Tránsito</span>
            </div>
          </div>
          <div class="stat-card recibido">
            <div class="stat-icon">📦</div>
            <div class="stat-info">
              <span class="stat-number">{{ getCountByStatus('recibido') }}</span>
              <span class="stat-label">Recibidos</span>
            </div>
          </div>
          <div class="stat-card verificado">
            <div class="stat-icon">✓</div>
            <div class="stat-info">
              <span class="stat-number">{{ getCountByStatus('verificado') }}</span>
              <span class="stat-label">Verificados</span>
            </div>
          </div>
        </div>

        <!-- Lista de pedidos -->
        <div class="pedidos-container">
          <div class="pedidos-header">
            <h2>Lista de Pedidos ({{ pedidosFiltrados().length }})</h2>
            <button class="btn-refresh" (click)="actualizarPedidos()">🔄 Actualizar</button>
          </div>

          <div class="pedidos-grid" *ngIf="pedidosFiltrados().length > 0">
            <div *ngFor="let pedido of pedidosFiltrados()" class="pedido-card">
              <div class="card-header">
                <div class="pedido-id">
                  <h3>#{{ pedido.id }}</h3>
                  <span class="status-badge" [ngClass]="pedido.estado">
                    {{ getStatusText(pedido.estado) }}
                  </span>
                </div>
                <div class="pedido-date">
                  <span class="date-label">Pedido:</span>
                  <span>{{ formatDate(pedido.fechaPedido) }}</span>
                </div>
              </div>

              <div class="card-body">
                <div class="proveedor-info">
                  <h4>{{ pedido.proveedor }}</h4>
                  <p><strong>Entrega programada:</strong> {{ formatDate(pedido.fechaEntrega) }}</p>
                  <p><strong>Items:</strong> {{ pedido.cantidadItems }} productos</p>
                </div>

                <div class="pedido-summary">
                  <div class="total-amount">
                    <span class="currency">\$</span>
                    <span class="amount">{{ pedido.total | number:'1.2-2' }}</span>
                  </div>
                  
                  <div class="delivery-status" [ngClass]="getDeliveryStatus(pedido.fechaEntrega)">
                    <span *ngIf="getDeliveryStatus(pedido.fechaEntrega) === 'overdue'">⚠️ Retrasado</span>
                    <span *ngIf="getDeliveryStatus(pedido.fechaEntrega) === 'today'">🚛 Entrega Hoy</span>
                    <span *ngIf="getDeliveryStatus(pedido.fechaEntrega) === 'upcoming'">📅 Programado</span>
                  </div>
                </div>
              </div>

              <div class="card-actions">
                <button 
                  class="btn-primary" 
                  (click)="verDetalles(pedido.id)"
                  [disabled]="pedido.estado === 'pendiente'">
                  Ver Detalles
                </button>
                
                <button 
                  class="btn-secondary" 
                  (click)="marcarComoRecibido(pedido)"
                  *ngIf="pedido.estado === 'en_transito'">
                  Marcar Recibido
                </button>
                
                <button 
                  class="btn-warning" 
                  (click)="reportarProblema(pedido)"
                  *ngIf="pedido.estado === 'recibido' || pedido.estado === 'verificado'">
                  Reportar Problema
                </button>
              </div>

              <!-- Observaciones si existen -->
              <div class="observaciones" *ngIf="pedido.observaciones">
                <h5>📝 Observaciones:</h5>
                <p>{{ pedido.observaciones }}</p>
              </div>
            </div>
          </div>

          <!-- Estado vacío -->
          <div class="empty-state" *ngIf="pedidosFiltrados().length === 0">
            <div class="empty-icon">📦</div>
            <h3>No hay pedidos</h3>
            <p>No se encontraron pedidos con los filtros seleccionados.</p>
            <button class="btn-primary" (click)="limpiarFiltros()">Limpiar Filtros</button>
          </div>
        </div>

        <!-- Resumen financiero -->
        <div class="financial-summary">
          <h3>📊 Resumen Financiero</h3>
          <div class="summary-grid">
            <div class="summary-item">
              <span class="label">Total Pedidos Activos:</span>
              <span class="value">\${{ getTotalActivos() | number:'1.2-2' }}</span>
            </div>
            <div class="summary-item">
              <span class="label">Promedio por Pedido:</span>
              <span class="value">\${{ getPromedioPedido() | number:'1.2-2' }}</span>
            </div>
            <div class="summary-item">
              <span class="label">Pedidos Este Mes:</span>
              <span class="value">{{ getPedidosEsteMes() }}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  `,
  styleUrls: ['./pedidos-insumos.component.css']
})
export class PedidosInsumosComponent implements OnInit {
  
  readonly pedidos = signal<PedidoInsumo[]>([]);
  readonly pedidosFiltrados = signal<PedidoInsumo[]>([]);
  readonly busqueda = signal<string>('');
  readonly filtroEstado = signal<string>('todos');

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.loadPedidos();
  }

  onBusquedaChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.busqueda.set(target.value);
    this.filtrarPedidos();
  }

  onFiltroChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.filtroEstado.set(target.value);
    this.filtrarPedidos();
  }

  private loadPedidos(): void {
    // Simulación de datos - en producción vendría del backend
    const pedidosData: PedidoInsumo[] = [
      {
        id: 1001,
        proveedor: 'Molinos La Rosa',
        fechaPedido: '2024-01-15',
        fechaEntrega: '2024-01-18',
        estado: 'recibido',
        cantidadItems: 5,
        total: 1250.50,
        observaciones: 'Entrega parcial - faltan 2 sacos de harina'
      },
      {
        id: 1002,
        proveedor: 'Lácteos del Valle',
        fechaPedido: '2024-01-16',
        fechaEntrega: '2024-01-19',
        estado: 'en_transito',
        cantidadItems: 3,
        total: 890.25
      },
      {
        id: 1003,
        proveedor: 'Distribuidora Central',
        fechaPedido: '2024-01-14',
        fechaEntrega: '2024-01-17',
        estado: 'aprobado',
        cantidadItems: 8,
        total: 2150.75
      },
      {
        id: 1004,
        proveedor: 'Azucarera Nacional',
        fechaPedido: '2024-01-17',
        fechaEntrega: '2024-01-20',
        estado: 'pendiente',
        cantidadItems: 12,
        total: 1750.00
      },
      {
        id: 1005,
        proveedor: 'Especias y Condimentos S.A.',
        fechaPedido: '2024-01-12',
        fechaEntrega: '2024-01-15',
        estado: 'verificado',
        cantidadItems: 6,
        total: 450.25,
        observaciones: 'Productos en buen estado, verificación completada'
      }
    ];
    
    this.pedidos.set(pedidosData);
    this.filtrarPedidos();
  }

  filtrarPedidos(): void {
    const busqueda = this.busqueda().toLowerCase();
    const filtroEstado = this.filtroEstado();
    let pedidos = this.pedidos();

    // Filtrar por búsqueda
    if (busqueda) {
      pedidos = pedidos.filter(p => 
        p.proveedor.toLowerCase().includes(busqueda) ||
        p.id.toString().includes(busqueda)
      );
    }

    // Filtrar por estado
    if (filtroEstado !== 'todos') {
      pedidos = pedidos.filter(p => p.estado === filtroEstado);
    }

    this.pedidosFiltrados.set(pedidos);
  }

  getCountByStatus(estado: string): number {
    return this.pedidos().filter(p => p.estado === estado).length;
  }

  getStatusText(estado: string): string {
    const estados: Record<string, string> = {
      pendiente: 'Pendiente',
      en_transito: 'En Tránsito',
      recibido: 'Recibido',
      verificado: 'Verificado',
      aprobado: 'Aprobado'
    };
    return estados[estado] || estado;
  }

  getDeliveryStatus(fechaEntrega: string): 'overdue' | 'today' | 'upcoming' {
    const today = new Date();
    const entrega = new Date(fechaEntrega);
    
    today.setHours(0, 0, 0, 0);
    entrega.setHours(0, 0, 0, 0);
    
    if (entrega < today) return 'overdue';
    if (entrega.getTime() === today.getTime()) return 'today';
    return 'upcoming';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  getTotalActivos(): number {
    return this.pedidos()
      .filter(p => p.estado !== 'aprobado')
      .reduce((sum, p) => sum + p.total, 0);
  }

  getPromedioPedido(): number {
    const pedidos = this.pedidos();
    if (pedidos.length === 0) return 0;
    const total = pedidos.reduce((sum, p) => sum + p.total, 0);
    return total / pedidos.length;
  }

  getPedidosEsteMes(): number {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    return this.pedidos().filter(p => {
      const pedidoDate = new Date(p.fechaPedido);
      return pedidoDate.getMonth() === currentMonth && 
             pedidoDate.getFullYear() === currentYear;
    }).length;
  }

  verDetalles(pedidoId: number): void {
    this.router.navigate(['/auxiliar/detalles-pedidos'], { 
      queryParams: { pedido: pedidoId } 
    });
  }

  marcarComoRecibido(pedido: PedidoInsumo): void {
    pedido.estado = 'recibido';
    this.showNotification(`Pedido #${pedido.id} marcado como recibido`, 'success');
    this.filtrarPedidos();
  }

  reportarProblema(pedido: PedidoInsumo): void {
    this.router.navigate(['/auxiliar/reportes-proveedores'], {
      queryParams: { pedido: pedido.id }
    });
  }

  actualizarPedidos(): void {
    this.loadPedidos();
    this.showNotification('Pedidos actualizados', 'success');
  }

  limpiarFiltros(): void {
    this.busqueda.set('');
    this.filtroEstado.set('todos');
    this.filtrarPedidos();
  }

  goBack(): void {
    this.router.navigate(['/auxiliar']);
  }

  private showNotification(message: string, type: 'success' | 'error' | 'warning'): void {
    console.log(`${type.toUpperCase()}: ${message}`);
  }
}