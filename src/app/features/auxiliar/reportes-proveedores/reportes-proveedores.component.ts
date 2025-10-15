import { Component, OnInit, signal } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Reporte {
  id: number;
  pedidoId: number;
  proveedor: string;
  tipo: 'incompleto' | 'vencido' | 'defectuoso' | 'otro';
  estado: 'pendiente' | 'en_revision' | 'resuelto' | 'rechazado';
  prioridad: 'alta' | 'media' | 'baja';
  descripcion: string;
  fechaReporte: string;
  fechaRespuesta?: string;
  respuestaProveedor?: string;
  evidencias?: string[];
  reportadoPor: string;
  seguimientos?: Seguimiento[];
}

interface Seguimiento {
  id: number;
  fecha: string;
  usuario: string;
  comentario: string;
  tipo: 'comentario' | 'cambio_estado';
  estadoAnterior?: string;
  estadoNuevo?: string;
}

interface NuevoReporte {
  pedidoId: number;
  proveedor: string;
  tipo: 'incompleto' | 'vencido' | 'defectuoso' | 'otro';
  prioridad: 'alta' | 'media' | 'baja';
  descripcion: string;
  evidencias: string[];
}

@Component({
  selector: 'app-reportes-proveedores',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container">
      <header class="header">
        <button class="back-btn" (click)="goBack()">← Volver</button>
        <h1>⚠️ Reportes a Proveedores</h1>
        <div class="header-actions">
          <button class="btn-new-report" (click)="abrirModalNuevoReporte()">
            <span>📝</span>
            <span>Nuevo Reporte</span>
          </button>
        </div>
      </header>

      <main class="main-content">
        <!-- Estadísticas -->
        <div class="stats-grid">
          <div class="stat-card pendiente">
            <h3>Pendientes</h3>
            <span class="stat-number">{{ getCountByStatus('pendiente') }}</span>
          </div>
          <div class="stat-card en_revision">
            <h3>En Revisión</h3>
            <span class="stat-number">{{ getCountByStatus('en_revision') }}</span>
          </div>
          <div class="stat-card resuelto">
            <h3>Resueltos</h3>
            <span class="stat-number">{{ getCountByStatus('resuelto') }}</span>
          </div>
          <div class="stat-card rechazado">
            <h3>Rechazados</h3>
            <span class="stat-number">{{ getCountByStatus('rechazado') }}</span>
          </div>
        </div>

        <!-- Filtros -->
        <div class="filter-section">
          <div class="filter-grid">
            <div class="filter-group">
              <label>Estado</label>
              <select [value]="filtroEstado()" (change)="onFiltroEstadoChange($event)" class="filter-select">
                <option value="todos">Todos</option>
                <option value="pendiente">Pendientes</option>
                <option value="en_revision">En Revisión</option>
                <option value="resuelto">Resueltos</option>
                <option value="rechazado">Rechazados</option>
              </select>
            </div>
            <div class="filter-group">
              <label>Tipo de Problema</label>
              <select [value]="filtroTipo()" (change)="onFiltroTipoChange($event)" class="filter-select">
                <option value="todos">Todos</option>
                <option value="incompleto">Incompleto</option>
                <option value="vencido">Vencido</option>
                <option value="defectuoso">Defectuoso</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div class="filter-group">
              <label>Proveedor</label>
              <input 
                type="text" 
                [value]="busquedaProveedor()"
                (input)="onBusquedaChange($event)"
                placeholder="Buscar proveedor..."
                class="filter-input">
            </div>
          </div>
        </div>

        <!-- Lista de reportes -->
        <div class="reportes-container">
          <div class="reportes-header">
            <h2>Reportes ({{ reportesFiltrados().length }})</h2>
          </div>

          <div class="reportes-list" *ngIf="reportesFiltrados().length > 0">
            <div *ngFor="let reporte of reportesFiltrados()" class="reporte-card">
              <div class="reporte-header">
                <div class="reporte-id">
                  <h3>Reporte #{{ reporte.id }}</h3>
                  <span class="tipo-badge" [ngClass]="reporte.tipo">
                    {{ getTipoText(reporte.tipo) }}
                  </span>
                  <span class="status-badge" [ngClass]="reporte.estado">
                    {{ getEstadoText(reporte.estado) }}
                  </span>
                </div>
                <div class="reporte-date">
                  <p><strong>Reportado:</strong> {{ formatDate(reporte.fechaReporte) }}</p>
                  <div class="priority-indicator" [ngClass]="reporte.prioridad">
                    {{ reporte.prioridad === 'alta' ? '🔴' : reporte.prioridad === 'media' ? '🟡' : '🟢' }}
                    Prioridad {{ reporte.prioridad }}
                  </div>
                </div>
              </div>

              <div class="reporte-body">
                <div class="reporte-info">
                  <div class="info-item">
                    <span class="info-label">Pedido:</span>
                    <span class="info-value">#{{ reporte.pedidoId }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Proveedor:</span>
                    <span class="info-value">{{ reporte.proveedor }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Reportado por:</span>
                    <span class="info-value">{{ reporte.reportadoPor }}</span>
                  </div>
                </div>

                <div class="descripcion-section">
                  <h4>📋 Descripción del Problema</h4>
                  <p>{{ reporte.descripcion }}</p>
                </div>

                <div class="evidencia-section" *ngIf="reporte.evidencias && reporte.evidencias.length > 0">
                  <h5>📎 Evidencias Adjuntas</h5>
                  <div class="evidencia-list">
                    <span *ngFor="let evidencia of reporte.evidencias" class="evidencia-item">
                      {{ evidencia }}
                    </span>
                  </div>
                </div>

                <div class="respuesta-section" *ngIf="reporte.respuestaProveedor">
                  <h5>💬 Respuesta del Proveedor ({{ formatDate(reporte.fechaRespuesta!) }})</h5>
                  <p>{{ reporte.respuestaProveedor }}</p>
                </div>
              </div>

              <div class="reporte-actions" *ngIf="reporte.estado !== 'resuelto' && reporte.estado !== 'rechazado'">
                <button class="btn-primary" (click)="verDetalleReporte(reporte.id)">
                  {{ reporteExpandido() === reporte.id ? '👁️ Ocultar Detalles' : '👁️ Ver Detalles' }}
                </button>
                <button class="btn-success" (click)="marcarResuelto(reporte)" *ngIf="reporte.estado === 'en_revision'">
                  ✓ Marcar Resuelto
                </button>
                <button class="btn-secondary" (click)="agregarSeguimiento(reporte)">
                  💬 Agregar Seguimiento
                </button>
                <button class="btn-danger" (click)="cancelarReporte(reporte)">
                  ✗ Cancelar Reporte
                </button>
              </div>

              <!-- Detalles expandidos -->
              <div class="detalles-expandidos" *ngIf="reporteExpandido() === reporte.id">
                <div class="detalle-item">
                  <span class="detalle-label">📅 Fecha de creación:</span>
                  <span class="detalle-value">{{ formatDate(reporte.fechaReporte) }} </span>
                </div>
                <div class="detalle-item" *ngIf="reporte.fechaRespuesta">
                  <span class="detalle-label">📅 Fecha de respuesta:</span>
                  <span class="detalle-value">{{ formatDate(reporte.fechaRespuesta) }}</span>
                </div>
                <div class="detalle-item">
                  <span class="detalle-label">🏢 Proveedor:</span>
                  <span class="detalle-value">{{ reporte.proveedor }}</span>
                </div>
                <div class="detalle-item">
                  <span class="detalle-label">📦 Pedido relacionado:</span>
                  <span class="detalle-value">#{{ reporte.pedidoId }}</span>
                </div>
                <div class="detalle-item">
                  <span class="detalle-label">👤 Reportado por:</span>
                  <span class="detalle-value">{{ reporte.reportadoPor }}</span>
                </div>
                <div class="detalle-item">
                  <span class="detalle-label">⚠️ Tipo de problema:</span>
                  <span class="detalle-value">{{ getTipoText(reporte.tipo) }}</span>
                </div>
                <div class="detalle-item">
                  <span class="detalle-label">📊 Estado actual:</span>
                  <span class="detalle-value">{{ getEstadoText(reporte.estado) }}</span>
                </div>
                <div class="detalle-item">
                  <span class="detalle-label">🔥 Prioridad:</span>
                  <span class="detalle-value">{{ reporte.prioridad.toUpperCase() }}</span>
                </div>

                <!-- Historial de Seguimientos -->
                <div class="seguimientos-section" *ngIf="reporte.seguimientos && reporte.seguimientos.length > 0">
                  <h4>📋 Historial de Seguimientos ({{ reporte.seguimientos.length }})</h4>
                  <div class="seguimientos-list">
                    <div *ngFor="let seguimiento of reporte.seguimientos" 
                         class="seguimiento-item"
                         [ngClass]="seguimiento.tipo">
                      <div class="seguimiento-header">
                        <span class="seguimiento-fecha">{{ formatDate(seguimiento.fecha) }}</span>
                        <span class="seguimiento-usuario">{{ seguimiento.usuario }}</span>
                      </div>
                      <div class="seguimiento-contenido">
                        <span *ngIf="seguimiento.tipo === 'cambio_estado'" class="seguimiento-icono">🔄</span>
                        <span *ngIf="seguimiento.tipo === 'comentario'" class="seguimiento-icono">💬</span>
                        <p>{{ seguimiento.comentario }}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Mensaje si no hay seguimientos -->
                <div class="sin-seguimientos" *ngIf="!reporte.seguimientos || reporte.seguimientos.length === 0">
                  <p>📝 No hay seguimientos registrados para este reporte</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Estado vacío -->
          <div class="empty-state" *ngIf="reportesFiltrados().length === 0">
            <div class="empty-icon">📋</div>
            <h3>No hay reportes</h3>
            <p>No se encontraron reportes con los filtros seleccionados.</p>
            <button class="btn-primary" (click)="limpiarFiltros()">Limpiar Filtros</button>
          </div>
        </div>
      </main>

      <!-- Modal Nuevo Reporte -->
      <div class="modal-overlay" *ngIf="mostrarModalNuevo()" (click)="cerrarModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <h3>📝 Nuevo Reporte a Proveedor</h3>
          
          <div class="form-group">
            <label>Número de Pedido *</label>
            <input 
              type="number" 
              [(ngModel)]="nuevoReporte.pedidoId"
              placeholder="Ej: 1001"
              required>
            <small>Ingrese el número del pedido relacionado</small>
          </div>

          <div class="form-group">
            <label>Proveedor *</label>
            <input 
              type="text" 
              [(ngModel)]="nuevoReporte.proveedor"
              placeholder="Nombre del proveedor"
              required>
          </div>

          <div class="form-group">
            <label>Tipo de Problema *</label>
            <select [(ngModel)]="nuevoReporte.tipo" required>
              <option value="incompleto">Pedido Incompleto</option>
              <option value="vencido">Productos Vencidos</option>
              <option value="defectuoso">Productos Defectuosos</option>
              <option value="otro">Otro Problema</option>
            </select>
          </div>

          <div class="form-group">
            <label>Prioridad *</label>
            <select [(ngModel)]="nuevoReporte.prioridad" required>
              <option value="alta">Alta - Requiere atención inmediata</option>
              <option value="media">Media - Atención en 24-48 horas</option>
              <option value="baja">Baja - No es urgente</option>
            </select>
          </div>

          <div class="form-group">
            <label>Descripción del Problema *</label>
            <textarea 
              [(ngModel)]="nuevoReporte.descripcion"
              placeholder="Describa detalladamente el problema encontrado..."
              rows="5"
              required></textarea>
            <small>Sea específico: cantidades, productos afectados, etc.</small>
          </div>

          <div class="modal-actions">
            <button class="btn-secondary" (click)="cerrarModal()">Cancelar</button>
            <button class="btn-primary" (click)="crearReporte()">Crear Reporte</button>
          </div>
        </div>
      </div>

      <!-- Modal Seguimiento -->
      <div class="modal-overlay" *ngIf="mostrarModalSeguimiento()" (click)="cerrarModalSeguimiento()">
        <div class="modal" (click)="$event.stopPropagation()">
          <h3>💬 Agregar Seguimiento</h3>
          
          <div class="form-group">
            <label>Reporte #{{ reporteSeleccionado()?.id }}</label>
            <p style="color: #666; margin: 0.5rem 0;">{{ reporteSeleccionado()?.proveedor }}</p>
          </div>

          <div class="form-group">
            <label>Comentario de Seguimiento *</label>
            <textarea 
              [(ngModel)]="textoSeguimiento"
              placeholder="Agregue información adicional o actualización del estado..."
              rows="4"
              required></textarea>
          </div>

          <div class="modal-actions">
            <button class="btn-secondary" (click)="cerrarModalSeguimiento()">Cancelar</button>
            <button class="btn-primary" (click)="guardarSeguimiento()">Guardar Seguimiento</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrl: './reportes-proveedores.component.css'
})
export class ReportesProveedoresComponent implements OnInit {
  
  readonly reportes = signal<Reporte[]>([]);
  readonly reportesFiltrados = signal<Reporte[]>([]);
  readonly filtroEstado = signal<string>('todos');
  readonly filtroTipo = signal<string>('todos');
  readonly busquedaProveedor = signal<string>('');
  readonly mostrarModalNuevo = signal<boolean>(false);
  readonly mostrarModalSeguimiento = signal<boolean>(false);
  readonly reporteSeleccionado = signal<Reporte | null>(null);
  readonly reporteExpandido = signal<number | null>(null);

  nuevoReporte: NuevoReporte = {
    pedidoId: 0,
    proveedor: '',
    tipo: 'incompleto',
    prioridad: 'media',
    descripcion: '',
    evidencias: []
  };

  textoSeguimiento: string = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadReportes();
    
    // Si viene desde pedidos-insumos con un pedido específico
    this.route.queryParams.subscribe(params => {
      if (params['pedido']) {
        this.nuevoReporte.pedidoId = parseInt(params['pedido']);
        this.abrirModalNuevoReporte();
      }
    });
  }

  private loadReportes(): void {
    const reportesData: Reporte[] = [
      {
        id: 2001,
        pedidoId: 1001,
        proveedor: 'Molinos La Rosa',
        tipo: 'incompleto',
        estado: 'en_revision',
        prioridad: 'alta',
        descripcion: 'Faltaron 3 sacos de harina de trigo en la entrega. Se recibieron solo 7 de los 10 solicitados. El proveedor debe confirmar fecha de entrega del faltante.',
        fechaReporte: '2024-01-18',
        evidencias: ['Foto_entrega.jpg', 'Remision_firmada.pdf'],
        reportadoPor: 'Juan Pérez - Auxiliar',
        seguimientos: [
          {
            id: 1,
            fecha: '2024-01-19',
            usuario: 'Juan Pérez',
            comentario: 'Se contactó al proveedor. Confirma envío del faltante para el 22/01',
            tipo: 'comentario'
          }
        ]
      },
      {
        id: 2002,
        pedidoId: 1004,
        proveedor: 'Ingredientes Premium',
        tipo: 'vencido',
        estado: 'resuelto',
        prioridad: 'alta',
        descripcion: 'Se recibieron 5 unidades de levadura con fecha de vencimiento próxima (vencen en 3 días). No cumple con el requisito mínimo de 30 días de vigencia.',
        fechaReporte: '2024-01-14',
        fechaRespuesta: '2024-01-16',
        respuestaProveedor: 'Se realizó el cambio de producto. Las nuevas unidades fueron entregadas el 16/01 con vencimiento vigente hasta 06/2024. Se adjunta nota crédito.',
        evidencias: ['Levadura_vencida.jpg'],
        reportadoPor: 'María González - Auxiliar',
        seguimientos: [
          {
            id: 1,
            fecha: '2024-01-15',
            usuario: 'María González',
            comentario: 'Proveedor acepta el reclamo y programa cambio',
            tipo: 'comentario'
          },
          {
            id: 2,
            fecha: '2024-01-16',
            usuario: 'Sistema',
            comentario: 'Estado cambiado de En Revisión a Resuelto',
            tipo: 'cambio_estado',
            estadoAnterior: 'en_revision',
            estadoNuevo: 'resuelto'
          }
        ]
      },
      {
        id: 2003,
        pedidoId: 1005,
        proveedor: 'Especias y Condimentos S.A.',
        tipo: 'defectuoso',
        estado: 'pendiente',
        prioridad: 'media',
        descripcion: 'Dos frascos de vainilla llegaron con el sello de seguridad roto. No se pueden aceptar por temas de inocuidad alimentaria.',
        fechaReporte: '2024-01-17',
        evidencias: ['Sello_roto_1.jpg', 'Sello_roto_2.jpg'],
        reportadoPor: 'Carlos Ramírez - Auxiliar',
        seguimientos: []
      },
      {
        id: 2004,
        pedidoId: 1002,
        proveedor: 'Lácteos del Valle',
        tipo: 'otro',
        estado: 'rechazado',
        prioridad: 'baja',
        descripcion: 'El empaque de la mantequilla presenta abolladuras menores pero el producto está en buen estado.',
        fechaReporte: '2024-01-15',
        fechaRespuesta: '2024-01-16',
        respuestaProveedor: 'Las abolladuras son cosméticas y no afectan la calidad del producto. El empaque cumple con los estándares. No procede reclamo.',
        reportadoPor: 'Ana López - Auxiliar',
        seguimientos: []
      },
      {
        id: 2005,
        pedidoId: 1003,
        proveedor: 'Distribuidora Central',
        tipo: 'incompleto',
        estado: 'resuelto',
        prioridad: 'media',
        descripcion: 'Faltó 1 caja de sal refinada (12 unidades). Se recibieron 49 unidades en lugar de 50.',
        fechaReporte: '2024-01-13',
        fechaRespuesta: '2024-01-14',
        respuestaProveedor: 'Caja faltante entregada el 14/01. Se incluye nota crédito por el inconveniente y 5% de descuento en próximo pedido.',
        reportadoPor: 'Luis Martínez - Auxiliar',
        seguimientos: []
      }
    ];
    
    this.reportes.set(reportesData);
    this.filtrarReportes();
  }

  onFiltroEstadoChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.filtroEstado.set(target.value);
    this.filtrarReportes();
  }

  onFiltroTipoChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.filtroTipo.set(target.value);
    this.filtrarReportes();
  }

  onBusquedaChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.busquedaProveedor.set(target.value);
    this.filtrarReportes();
  }

  filtrarReportes(): void {
    let reportes = this.reportes();
    
    // Filtrar por estado
    if (this.filtroEstado() !== 'todos') {
      reportes = reportes.filter(r => r.estado === this.filtroEstado());
    }
    
    // Filtrar por tipo
    if (this.filtroTipo() !== 'todos') {
      reportes = reportes.filter(r => r.tipo === this.filtroTipo());
    }
    
    // Filtrar por proveedor
    if (this.busquedaProveedor()) {
      const busqueda = this.busquedaProveedor().toLowerCase();
      reportes = reportes.filter(r => 
        r.proveedor.toLowerCase().includes(busqueda) ||
        r.id.toString().includes(busqueda)
      );
    }
    
    this.reportesFiltrados.set(reportes);
  }

  getCountByStatus(estado: string): number {
    return this.reportes().filter(r => r.estado === estado).length;
  }

  getTipoText(tipo: string): string {
    const tipos: Record<string, string> = {
      incompleto: 'Incompleto',
      vencido: 'Vencido',
      defectuoso: 'Defectuoso',
      otro: 'Otro'
    };
    return tipos[tipo] || tipo;
  }

  getEstadoText(estado: string): string {
    const estados: Record<string, string> = {
      pendiente: 'Pendiente',
      en_revision: 'En Revisión',
      resuelto: 'Resuelto',
      rechazado: 'Rechazado'
    };
    return estados[estado] || estado;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  abrirModalNuevoReporte(): void {
    this.mostrarModalNuevo.set(true);
  }

  cerrarModal(): void {
    this.mostrarModalNuevo.set(false);
    this.resetNuevoReporte();
  }

  crearReporte(): void {
    // Validar campos requeridos
    if (!this.nuevoReporte.pedidoId || !this.nuevoReporte.proveedor || !this.nuevoReporte.descripcion) {
      this.showNotification('Por favor complete todos los campos obligatorios', 'error');
      return;
    }

    if (this.nuevoReporte.descripcion.length < 20) {
      this.showNotification('La descripción debe tener al menos 20 caracteres', 'error');
      return;
    }

    // Crear nuevo reporte
    const nuevoReporte: Reporte = {
      id: Math.max(...this.reportes().map(r => r.id)) + 1,
      pedidoId: this.nuevoReporte.pedidoId,
      proveedor: this.nuevoReporte.proveedor,
      tipo: this.nuevoReporte.tipo,
      estado: 'pendiente',
      prioridad: this.nuevoReporte.prioridad,
      descripcion: this.nuevoReporte.descripcion,
      fechaReporte: new Date().toISOString().split('T')[0],
      evidencias: this.nuevoReporte.evidencias,
      reportadoPor: 'Usuario Actual - Auxiliar',
      seguimientos: []
    };

    // Agregar al listado
    const reportesActualizados = [...this.reportes(), nuevoReporte];
    this.reportes.set(reportesActualizados);
    this.filtrarReportes();

    this.showNotification(`Reporte #${nuevoReporte.id} creado exitosamente`, 'success');
    this.cerrarModal();
  }

  resetNuevoReporte(): void {
    this.nuevoReporte = {
      pedidoId: 0,
      proveedor: '',
      tipo: 'incompleto',
      prioridad: 'media',
      descripcion: '',
      evidencias: []
    };
  }

  agregarSeguimiento(reporte: Reporte): void {
    this.reporteSeleccionado.set(reporte);
    this.textoSeguimiento = '';
    this.mostrarModalSeguimiento.set(true);
  }

  cerrarModalSeguimiento(): void {
    this.mostrarModalSeguimiento.set(false);
    this.reporteSeleccionado.set(null);
    this.textoSeguimiento = '';
  }

  guardarSeguimiento(): void {
    if (!this.textoSeguimiento || this.textoSeguimiento.trim().length < 10) {
      this.showNotification('El comentario debe tener al menos 10 caracteres', 'error');
      return;
    }

    const reporte = this.reporteSeleccionado();
    if (reporte) {
      // Inicializar array de seguimientos si no existe
      if (!reporte.seguimientos) {
        reporte.seguimientos = [];
      }

      const estadoAnterior = reporte.estado;
      
      // Cambiar estado a en_revision si está pendiente
      if (reporte.estado === 'pendiente') {
        reporte.estado = 'en_revision';
      }

      // Crear nuevo seguimiento
      const nuevoSeguimiento: Seguimiento = {
        id: reporte.seguimientos.length + 1,
        fecha: new Date().toISOString().split('T')[0],
        usuario: 'Usuario Actual - Auxiliar',
        comentario: this.textoSeguimiento.trim(),
        tipo: 'comentario'
      };

      // Agregar seguimiento del cambio de estado si cambió
      if (estadoAnterior !== reporte.estado) {
        const seguimientoEstado: Seguimiento = {
          id: reporte.seguimientos.length + 2,
          fecha: new Date().toISOString().split('T')[0],
          usuario: 'Sistema',
          comentario: `Estado cambiado de ${this.getEstadoText(estadoAnterior)} a ${this.getEstadoText(reporte.estado)}`,
          tipo: 'cambio_estado',
          estadoAnterior: estadoAnterior,
          estadoNuevo: reporte.estado
        };
        reporte.seguimientos.push(seguimientoEstado);
      }

      reporte.seguimientos.push(nuevoSeguimiento);
      
      this.showNotification(`Seguimiento agregado al reporte #${reporte.id}`, 'success');
      this.cerrarModalSeguimiento();
      this.filtrarReportes();
    }
  }

  marcarResuelto(reporte: Reporte): void {
    if (confirm(`¿Confirma que el reporte #${reporte.id} ha sido resuelto satisfactoriamente?`)) {
      reporte.estado = 'resuelto';
      reporte.fechaRespuesta = new Date().toISOString().split('T')[0];
      this.showNotification(`Reporte #${reporte.id} marcado como resuelto`, 'success');
      this.filtrarReportes();
    }
  }

  cancelarReporte(reporte: Reporte): void {
    if (confirm(`¿Está seguro de cancelar el reporte #${reporte.id}? Esta acción no se puede deshacer.`)) {
      reporte.estado = 'rechazado';
      this.showNotification(`Reporte #${reporte.id} cancelado`, 'warning');
      this.filtrarReportes();
    }
  }

  verDetalleReporte(reporteId: number): void {
    // Expandir/colapsar detalles del reporte
    if (this.reporteExpandido() === reporteId) {
      this.reporteExpandido.set(null);
    } else {
      this.reporteExpandido.set(reporteId);
    }
  }

  limpiarFiltros(): void {
    this.filtroEstado.set('todos');
    this.filtroTipo.set('todos');
    this.busquedaProveedor.set('');
    this.filtrarReportes();
    this.showNotification('Filtros limpiados', 'info');
  }

  goBack(): void {
    this.router.navigate(['/auxiliar']);
  }

  private showNotification(message: string, type: 'success' | 'error' | 'warning' | 'info'): void {
    console.log(`${type.toUpperCase()}: ${message}`);
    alert(message);
  }
}