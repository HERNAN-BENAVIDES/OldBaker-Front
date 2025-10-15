import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface PedidoDetalle {
  id: number;
  proveedor: string;
  fechaPedido: string;
  fechaEntrega: string;
  estado: 'pendiente' | 'recibido' | 'verificado' | 'incompleto' | 'aprobado' | 'rechazado';
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
            <option value="incompleto">Incompletos</option>
            <option value="aprobado">Aprobados</option>
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
          <div class="stat-card incompleto">
            <h3>Incompletos</h3>
            <span class="stat-number">{{ getCountByStatus('incompleto') }}</span>
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
                <div class="total">\${{ pedido.total | number:'1.2-2' }}</div>
              </div>
            </div>

            <div class="items-section" *ngIf="pedidoExpandido() === pedido.id">
              <h4>Detalles del Pedido:</h4>
              
              <!-- Mensaje de ayuda -->
              <div class="alert-message info" *ngIf="pedido.estado === 'recibido'">
                <span>ℹ️</span>
                <span>Complete la información de cada ítem para verificar el pedido</span>
              </div>

              <div class="items-table">
                <div class="item-header">
                  <span>Insumo</span>
                  <span>Pedido</span>
                  <span>Recibido</span>
                  <span>Precio Unit.</span>
                  <span>Vencimiento</span>
                  <span>Estado</span>
                  <span>Observaciones</span>
                  <span>Acciones</span>
                </div>
                
                <div *ngFor="let item of pedido.items" class="item-row">
                  <span class="item-name">{{ item.insumo }}</span>
                  <span>{{ item.cantidadPedida }}</span>
                  <input 
                    type="number" 
                    [value]="item.cantidadRecibida"
                    (input)="updateCantidadRecibida(pedido, item, $event)"
                    [disabled]="pedido.estado === 'aprobado' || pedido.estado === 'rechazado'"
                    class="cantidad-input"
                    min="0"
                    [max]="item.cantidadPedida">
                  <span>\${{ item.precioUnitario | number:'1.2-2' }}</span>
                  <input 
                    type="date"
                    [value]="item.fechaVencimiento || ''"
                    (input)="updateFechaVencimiento(item, $event)"
                    [disabled]="pedido.estado === 'aprobado' || pedido.estado === 'rechazado'"
                    class="fecha-input"
                    [ngClass]="{'vencido': isVencido(item.fechaVencimiento)}">
                  <select 
                    [value]="item.estado"
                    (change)="updateEstadoItem(pedido, item, $event)"
                    [disabled]="pedido.estado === 'aprobado' || pedido.estado === 'rechazado'" 
                    class="estado-select">
                    <option value="completo">Completo</option>
                    <option value="incompleto">Incompleto</option>
                    <option value="vencido">Vencido</option>
                    <option value="defectuoso">Defectuoso</option>
                  </select>
                  <div>
                    <span class="observacion-badge" *ngIf="item.observaciones" (click)="verObservacion(item)">
                      📝 Ver nota
                    </span>
                    <span *ngIf="!item.observaciones && item.estado !== 'completo'" 
                          style="color: #999; font-size: 0.8rem;">Sin nota</span>
                    <div class="observacion-text" *ngIf="mostrarObservacion() === item.id && item.observaciones">
                      {{ item.observaciones }}
                    </div>
                  </div>
                  <button 
                    class="btn-secondary" 
                    (click)="abrirObservaciones(item)"
                    [disabled]="pedido.estado === 'aprobado' || pedido.estado === 'rechazado'">
                    {{ item.observaciones ? 'Editar' : 'Agregar' }}
                  </button>
                </div>
              </div>

              <!-- Información de validación -->
              <div class="alert-message warning" *ngIf="!puedeAprobar(pedido) && pedido.estado !== 'aprobado'">
                <span>⚠️</span>
                <span>{{ getMensajeValidacion(pedido) }}</span>
              </div>

              <div class="verification-actions" *ngIf="pedido.estado !== 'aprobado' && pedido.estado !== 'rechazado'">
                <button 
                  class="btn-success" 
                  (click)="aprobarPedido(pedido)"
                  [disabled]="!puedeAprobar(pedido)">
                  <span class="btn-icon">✓</span>
                  Aprobar como Pagable
                </button>
                <button 
                  class="btn-warning" 
                  (click)="marcarIncompleto(pedido)">
                  <span class="btn-icon">⚠️</span>
                  Marcar Incompleto
                </button>
                <button 
                  class="btn-danger" 
                  (click)="rechazarPedido(pedido)">
                  <span class="btn-icon">✗</span>
                  Rechazar Pedido
                </button>
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
      <div class="modal-overlay" *ngIf="modalObservaciones()" (click)="cerrarModalClick($event)">
        <div class="modal" (click)="$event.stopPropagation()">
          <h3>📝 Observaciones del Ítem</h3>
          <p style="color: #666; margin-bottom: 1rem;">
            <strong>{{ itemSeleccionado?.insumo }}</strong>
          </p>
          <textarea 
            [value]="observacionTemp()"
            (input)="updateObservacion($event)"
            placeholder="Describe el problema o situación específica de este ítem..."
            rows="5"></textarea>
          <div class="modal-actions">
            <button class="btn-secondary" (click)="cerrarModal()">Cancelar</button>
            <button class="btn-primary" (click)="guardarObservacion()">Guardar Observación</button>
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
  readonly mostrarObservacion = signal<number | null>(null);
  
  itemSeleccionado: ItemPedido | null = null;

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

  updateCantidadRecibida(pedido: PedidoDetalle, item: ItemPedido, event: Event): void {
    const target = event.target as HTMLInputElement;
    const cantidad = parseInt(target.value) || 0;
    item.cantidadRecibida = Math.min(cantidad, item.cantidadPedida);
    
    // Actualizar estado automáticamente si la cantidad es diferente
    if (item.cantidadRecibida < item.cantidadPedida && item.estado === 'completo') {
      item.estado = 'incompleto';
    } else if (item.cantidadRecibida === item.cantidadPedida && item.estado === 'incompleto') {
      item.estado = 'completo';
    }
    
    this.actualizarTotalPedido(pedido);
  }

  updateFechaVencimiento(item: ItemPedido, event: Event): void {
    const target = event.target as HTMLInputElement;
    item.fechaVencimiento = target.value;
    
    // Si la fecha está vencida, actualizar estado automáticamente
    if (this.isVencido(item.fechaVencimiento)) {
      item.estado = 'vencido';
    }
  }

  updateEstadoItem(pedido: PedidoDetalle, item: ItemPedido, event: Event): void {
    const target = event.target as HTMLSelectElement;
    item.estado = target.value as 'completo' | 'incompleto' | 'vencido' | 'defectuoso';
  }

  private actualizarTotalPedido(pedido: PedidoDetalle): void {
    pedido.total = pedido.items.reduce((total, item) => {
      return total + (item.cantidadRecibida * item.precioUnitario);
    }, 0);
  }

  private loadPedidos(): void {
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
            fechaVencimiento: '',
            estado: 'incompleto',
            observaciones: 'Faltaron 3 bultos en la entrega'
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
            fechaVencimiento: '',
            estado: 'completo'
          },
          {
            id: 4,
            insumo: 'Leche Entera (1L)',
            cantidadPedida: 20,
            cantidadRecibida: 0,
            precioUnitario: 15.50,
            fechaVencimiento: '',
            estado: 'completo'
          }
        ]
      },
      {
        id: 1003,
        proveedor: 'Distribuidora Central',
        fechaPedido: '2024-01-17',
        fechaEntrega: '2024-01-20',
        estado: 'verificado',
        total: 2340.00,
        items: [
          {
            id: 5,
            insumo: 'Levadura Fresca (500g)',
            cantidadPedida: 30,
            cantidadRecibida: 30,
            precioUnitario: 12.00,
            fechaVencimiento: '2024-02-15',
            estado: 'completo'
          },
          {
            id: 6,
            insumo: 'Sal Refinada (1kg)',
            cantidadPedida: 50,
            cantidadRecibida: 50,
            precioUnitario: 8.00,
            fechaVencimiento: '2026-01-01',
            estado: 'completo'
          }
        ]
      },
      {
        id: 1004,
        proveedor: 'Ingredientes Premium',
        fechaPedido: '2024-01-14',
        fechaEntrega: '2024-01-17',
        estado: 'incompleto',
        total: 1890.00,
        items: [
          {
            id: 7,
            insumo: 'Chocolate en Polvo (2kg)',
            cantidadPedida: 20,
            cantidadRecibida: 15,
            precioUnitario: 45.00,
            fechaVencimiento: '2025-03-01',
            estado: 'incompleto',
            observaciones: 'Llegaron solo 15 unidades. El proveedor confirmó el envío del faltante.'
          },
          {
            id: 8,
            insumo: 'Vainilla Líquida (250ml)',
            cantidadPedida: 10,
            cantidadRecibida: 8,
            precioUnitario: 28.00,
            fechaVencimiento: '2024-12-01',
            estado: 'incompleto',
            observaciones: 'Dos botellas llegaron con el sello roto'
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
      incompleto: 'Incompleto',
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
    const fechaVencimiento = new Date(fecha);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return fechaVencimiento < hoy;
  }

  puedeAprobar(pedido: PedidoDetalle): boolean {
    return pedido.items.every(item => {
      const cantidadCorrecta = item.cantidadRecibida === item.cantidadPedida;
      const estadoCorrecto = item.estado === 'completo';
      const tieneFechaVencimiento = item.fechaVencimiento !== undefined && item.fechaVencimiento !== '';
      const noEstaVencido = !this.isVencido(item.fechaVencimiento);
      
      return cantidadCorrecta && estadoCorrecto && tieneFechaVencimiento && noEstaVencido;
    });
  }

  getMensajeValidacion(pedido: PedidoDetalle): string {
    const itemsIncompletos = pedido.items.filter(i => i.cantidadRecibida < i.cantidadPedida);
    const itemsSinFecha = pedido.items.filter(i => !i.fechaVencimiento || i.fechaVencimiento === '');
    const itemsVencidos = pedido.items.filter(i => this.isVencido(i.fechaVencimiento));
    const itemsProblematicos = pedido.items.filter(i => i.estado !== 'completo');
    
    const mensajes: string[] = [];
    
    if (itemsIncompletos.length > 0) {
      mensajes.push(`${itemsIncompletos.length} ítem(s) con cantidad incompleta`);
    }
    if (itemsSinFecha.length > 0) {
      mensajes.push(`${itemsSinFecha.length} ítem(s) sin fecha de vencimiento`);
    }
    if (itemsVencidos.length > 0) {
      mensajes.push(`${itemsVencidos.length} ítem(s) vencido(s)`);
    }
    if (itemsProblematicos.length > 0) {
      mensajes.push(`${itemsProblematicos.length} ítem(s) con problemas`);
    }
    
    if (mensajes.length === 0) {
      return 'Complete todos los campos para aprobar el pedido';
    }
    
    return 'Problemas detectados: ' + mensajes.join(', ');
  }

  aprobarPedido(pedido: PedidoDetalle): void {
    console.log('=== APROBAR PEDIDO ===');
    console.log('Pedido antes:', pedido);
    console.log('Estado antes:', pedido.estado);
    console.log('¿Puede aprobar?', this.puedeAprobar(pedido));
    
    if (!this.puedeAprobar(pedido)) {
      console.log('No se puede aprobar - Mensaje:', this.getMensajeValidacion(pedido));
      this.showNotification(this.getMensajeValidacion(pedido), 'error');
      return;
    }
    
    // Actualizar el array principal de pedidos
    const pedidosActualizados = this.pedidos().map(p => {
      if (p.id === pedido.id) {
        return { ...p, estado: 'aprobado' as const };
      }
      return p;
    });
    
    console.log('Pedidos actualizados:', pedidosActualizados);
    
    // Actualizar el signal principal
    this.pedidos.set(pedidosActualizados);
    
    // Refiltrar para actualizar la vista
    this.filtrarPedidos();
    
    console.log('Estado después de actualizar:', this.pedidos().find(p => p.id === pedido.id)?.estado);
    console.log('=== FIN APROBAR ===');
    
    this.showNotification(`Pedido #${pedido.id} aprobado como pagable exitosamente`, 'success');
  }

  marcarIncompleto(pedido: PedidoDetalle): void {
    const tieneProblemas = pedido.items.some(item => 
      item.estado !== 'completo' || 
      item.cantidadRecibida < item.cantidadPedida
    );
    
    if (!tieneProblemas) {
      this.showNotification('Debe marcar al menos un ítem con problemas para registrar el pedido como incompleto', 'warning');
      return;
    }
    
    pedido.estado = 'incompleto';
    
    // Forzar actualización de los signals
    const pedidosActualizados = this.pedidos().map(p => 
      p.id === pedido.id ? { ...p, estado: 'incompleto' as const } : p
    );
    this.pedidos.set(pedidosActualizados);
    this.filtrarPedidos();
    
    this.showNotification(`Pedido #${pedido.id} marcado como incompleto`, 'warning');
  }

  rechazarPedido(pedido: PedidoDetalle): void {
    if (confirm(`¿Está seguro de rechazar completamente el pedido #${pedido.id}?`)) {
      pedido.estado = 'rechazado';
      
      // Forzar actualización de los signals
      const pedidosActualizados = this.pedidos().map(p => 
        p.id === pedido.id ? { ...p, estado: 'rechazado' as const } : p
      );
      this.pedidos.set(pedidosActualizados);
      this.filtrarPedidos();
      
      this.showNotification(`Pedido #${pedido.id} rechazado`, 'error');
    }
  }

  abrirObservaciones(item: ItemPedido): void {
    this.itemSeleccionado = item;
    this.observacionTemp.set(item.observaciones || '');
    this.modalObservaciones.set(true);
  }

  verObservacion(item: ItemPedido): void {
    if (this.mostrarObservacion() === item.id) {
      this.mostrarObservacion.set(null);
    } else {
      this.mostrarObservacion.set(item.id);
    }
  }

  cerrarModal(): void {
    this.modalObservaciones.set(false);
    this.itemSeleccionado = null;
    this.observacionTemp.set('');
  }

  cerrarModalClick(event: MouseEvent): void {
    this.cerrarModal();
  }

  guardarObservacion(): void {
    if (this.itemSeleccionado) {
      const observacion = this.observacionTemp().trim();
      
      if (observacion === '') {
        this.showNotification('Por favor ingrese una observación', 'warning');
        return;
      }
      
      this.itemSeleccionado.observaciones = observacion;
      this.showNotification('Observación guardada exitosamente', 'success');
    }
    this.cerrarModal();
  }

  goBack(): void {
    this.router.navigate(['/auxiliar']);
  }

  private showNotification(message: string, type: 'success' | 'error' | 'warning'): void {
    console.log(`${type.toUpperCase()}: ${message}`);
    alert(`${type.toUpperCase()}: ${message}`);
  }
}