import { Component, OnInit, signal } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface ReporteProveedor {
  id: number;
  pedidoId: number;
  proveedor: string;
  tipoProblema: 'incompleto' | 'vencido' | 'defectuoso' | 'retraso' | 'otro';
  descripcion: string;
  fechaReporte: string;
  estado: 'abierto' | 'en_proceso' | 'resuelto' | 'cerrado';
  prioridad: 'baja' | 'media' | 'alta' | 'critica';
  observacionesProveedor?: string;
  fechaResolucion?: string;
}

interface FormularioReporte {
  id?: number;
  pedidoId: number | null;
  proveedor: string;
  tipoProblema: string;
  prioridad: string;
  descripcion: string;
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
          <button class="btn-primary" (click)="abrirFormularioReporte()">+ Nuevo Reporte</button>
        </div>
      </header>

      <main class="main-content">
        <!-- Estadísticas de reportes -->
        <div class="stats-section">
          <div class="stat-card abierto">
            <div class="stat-icon">🔴</div>
            <div class="stat-info">
              <span class="stat-number">{{ getCountByStatus('abierto') }}</span>
              <span class="stat-label">Abiertos</span>
            </div>
          </div>
          <div class="stat-card en_proceso">
            <div class="stat-icon">🟡</div>
            <div class="stat-info">
              <span class="stat-number">{{ getCountByStatus('en_proceso') }}</span>
              <span class="stat-label">En Proceso</span>
            </div>
          </div>
          <div class="stat-card resuelto">
            <div class="stat-icon">🟢</div>
            <div class="stat-info">
              <span class="stat-number">{{ getCountByStatus('resuelto') }}</span>
              <span class="stat-label">Resueltos</span>
            </div>
          </div>
          <div class="stat-card critica">
            <div class="stat-icon">🚨</div>
            <div class="stat-info">
              <span class="stat-number">{{ getCountByPriority('critica') }}</span>
              <span class="stat-label">Críticos</span>
            </div>
          </div>
        </div>

        <!-- Filtros -->
        <div class="filters-section">
          <select [value]="filtroEstado()" (change)="onFiltroEstadoChange($event)" class="filter-select">
            <option value="todos">Todos los estados</option>
            <option value="abierto">Abiertos</option>
            <option value="en_proceso">En Proceso</option>
            <option value="resuelto">Resueltos</option>
            <option value="cerrado">Cerrados</option>
          </select>
          
          <select [value]="filtroPrioridad()" (change)="onFiltroPrioridadChange($event)" class="filter-select">
            <option value="todas">Todas las prioridades</option>
            <option value="critica">Crítica</option>
            <option value="alta">Alta</option>
            <option value="media">Media</option>
            <option value="baja">Baja</option>
          </select>

          <select [value]="filtroTipo()" (change)="onFiltroTipoChange($event)" class="filter-select">
            <option value="todos">Todos los tipos</option>
            <option value="incompleto">Pedidos Incompletos</option>
            <option value="vencido">Productos Vencidos</option>
            <option value="defectuoso">Productos Defectuosos</option>
            <option value="retraso">Retrasos de Entrega</option>
            <option value="otro">Otros</option>
          </select>
        </div>

        <!-- Lista de reportes -->
        <div class="reportes-container">
          <div *ngFor="let reporte of reportesFiltrados()" class="reporte-card">
            <div class="card-header">
              <div class="reporte-info">
                <h3>Reporte #{{ reporte.id }}</h3>
                <p><strong>Pedido:</strong> #{{ reporte.pedidoId }} - {{ reporte.proveedor }}</p>
                <p><strong>Fecha:</strong> {{ formatDate(reporte.fechaReporte) }}</p>
              </div>
              <div class="reporte-badges">
                <span class="status-badge" [ngClass]="reporte.estado">
                  {{ getStatusText(reporte.estado) }}
                </span>
                <span class="priority-badge" [ngClass]="reporte.prioridad">
                  {{ getPriorityText(reporte.prioridad) }}
                </span>
              </div>
            </div>

            <div class="card-body">
              <div class="problema-info">
                <h4>{{ getTipoProblemaText(reporte.tipoProblema) }}</h4>
                <p class="descripcion">{{ reporte.descripcion }}</p>
              </div>

              <div class="reporte-details" *ngIf="reporteExpandido() === reporte.id">
                <div class="timeline">
                  <div class="timeline-item created">
                    <div class="timeline-icon">📝</div>
                    <div class="timeline-content">
                      <strong>Reporte Creado</strong>
                      <span>{{ formatDate(reporte.fechaReporte) }}</span>
                    </div>
                  </div>
                  
                  <div class="timeline-item" *ngIf="reporte.estado !== 'abierto'">
                    <div class="timeline-icon">👀</div>
                    <div class="timeline-content">
                      <strong>En Proceso</strong>
                      <span>Proveedor notificado</span>
                    </div>
                  </div>
                  
                  <div class="timeline-item resolved" *ngIf="reporte.fechaResolucion">
                    <div class="timeline-icon">✅</div>
                    <div class="timeline-content">
                      <strong>Resuelto</strong>
                      <span>{{ formatDate(reporte.fechaResolucion) }}</span>
                    </div>
                  </div>
                </div>

                <div class="observaciones-proveedor" *ngIf="reporte.observacionesProveedor">
                  <h5>📋 Respuesta del Proveedor:</h5>
                  <p>{{ reporte.observacionesProveedor }}</p>
                </div>

                <div class="acciones-reporte" *ngIf="reporte.estado !== 'cerrado'">
                  <button 
                    class="btn-warning" 
                    (click)="marcarEnProceso(reporte)"
                    *ngIf="reporte.estado === 'abierto'">
                    Marcar en Proceso
                  </button>
                  
                  <button 
                    class="btn-success" 
                    (click)="marcarResuelto(reporte)"
                    *ngIf="reporte.estado === 'en_proceso'">
                    Marcar como Resuelto
                  </button>
                  
                  <button 
                    class="btn-secondary" 
                    (click)="cerrarReporte(reporte)"
                    *ngIf="reporte.estado === 'resuelto'">
                    Cerrar Reporte
                  </button>

                  <button 
                    class="btn-primary" 
                    (click)="editarReporte(reporte)">
                    Editar
                  </button>
                </div>
              </div>
            </div>

            <div class="card-footer">
              <button 
                class="btn-link" 
                (click)="toggleReporte(reporte.id)">
                {{ reporteExpandido() === reporte.id ? '↑ Ocultar' : '↓ Ver más' }}
              </button>
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

      <!-- Modal para nuevo reporte -->
      <div class="modal-overlay" *ngIf="mostrarFormulario()">
        <div class="modal">
          <h3>{{ modoEdicion() ? 'Editar Reporte' : 'Nuevo Reporte a Proveedor' }}</h3>
          
          <form (ngSubmit)="guardarReporte()" #reporteForm="ngForm">
            <div class="form-group">
              <label>Pedido ID:</label>
              <input 
                type="number" 
                [value]="formularioReporte().pedidoId || ''"
                (input)="updateFormField('pedidoId', $event)"
                name="pedidoId" 
                required 
                class="form-input">
            </div>

            <div class="form-group">
              <label>Proveedor:</label>
              <input 
                type="text" 
                [value]="formularioReporte().proveedor"
                (input)="updateFormField('proveedor', $event)"
                name="proveedor" 
                required 
                class="form-input">
            </div>

            <div class="form-group">
              <label>Tipo de Problema:</label>
              <select 
                [value]="formularioReporte().tipoProblema"
                (change)="updateFormField('tipoProblema', $event)"
                name="tipoProblema" 
                required 
                class="form-select">
                <option value="">Seleccionar...</option>
                <option value="incompleto">Pedido Incompleto</option>
                <option value="vencido">Productos Vencidos</option>
                <option value="defectuoso">Productos Defectuosos</option>
                <option value="retraso">Retraso de Entrega</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            <div class="form-group">
              <label>Prioridad:</label>
              <select 
                [value]="formularioReporte().prioridad"
                (change)="updateFormField('prioridad', $event)"
                name="prioridad" 
                required 
                class="form-select">
                <option value="">Seleccionar...</option>
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
                <option value="critica">Crítica</option>
              </select>
            </div>

            <div class="form-group">
              <label>Descripción del Problema:</label>
              <textarea 
                [value]="formularioReporte().descripcion"
                (input)="updateFormField('descripcion', $event)"
                name="descripcion" 
                required 
                rows="4" 
                class="form-textarea"
                placeholder="Describe detalladamente el problema encontrado..."></textarea>
            </div>

            <div class="modal-actions">
              <button type="button" class="btn-secondary" (click)="cerrarFormulario()">
                Cancelar
              </button>
              <button type="submit" class="btn-primary">
                {{ modoEdicion() ? 'Actualizar' : 'Crear' }} Reporte
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./reportes-proveedores.component.css']
})
export class ReportesProveedoresComponent implements OnInit {
  
  readonly reportes = signal<ReporteProveedor[]>([]);
  readonly reportesFiltrados = signal<ReporteProveedor[]>([]);
  readonly filtroEstado = signal<string>('todos');
  readonly filtroPrioridad = signal<string>('todas');
  readonly filtroTipo = signal<string>('todos');
  readonly reporteExpandido = signal<number | null>(null);
  readonly mostrarFormulario = signal<boolean>(false);
  readonly modoEdicion = signal<boolean>(false);
  readonly formularioReporte = signal<FormularioReporte>({
    pedidoId: null,
    proveedor: '',
    tipoProblema: '',
    prioridad: 'media',
    descripcion: ''
  });

  constructor(private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.loadReportes();
    
    // Verificar si viene de otro módulo con un pedido específico
    this.route.queryParams.subscribe(params => {
      if (params['pedido']) {
        this.precargarReporte(params['pedido']);
      }
    });
  }

  onFiltroEstadoChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.filtroEstado.set(target.value);
    this.filtrarReportes();
  }

  onFiltroPrioridadChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.filtroPrioridad.set(target.value);
    this.filtrarReportes();
  }

  onFiltroTipoChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.filtroTipo.set(target.value);
    this.filtrarReportes();
  }

  updateFormField(field: string, event: Event): void {
    const target = event.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    const currentForm = this.formularioReporte();
    
    let value: any = target.value;
    if (field === 'pedidoId') {
      value = target.value ? parseInt(target.value) : null;
    }
    
    this.formularioReporte.set({
      ...currentForm,
      [field]: value
    });
  }

  private loadReportes(): void {
    // Simulación de datos
    const reportesData: ReporteProveedor[] = [
      {
        id: 2001,
        pedidoId: 1001,
        proveedor: 'Molinos La Rosa',
        tipoProblema: 'incompleto',
        descripcion: 'Faltaron 3 sacos de harina de trigo de 50kg. Se recibieron solo 7 de los 10 pedidos.',
        fechaReporte: '2024-01-18',
        estado: 'en_proceso',
        prioridad: 'alta',
        observacionesProveedor: 'Confirmar la entrega de los sacos faltantes mañana en la mañana.'
      },
      {
        id: 2002,
        pedidoId: 1003,
        proveedor: 'Lácteos del Valle',
        tipoProblema: 'vencido',
        descripcion: 'Se encontraron 5 paquetes de mantequilla con fecha de vencimiento para el día siguiente. No cumple con nuestros estándares de calidad.',
        fechaReporte: '2024-01-17',
        estado: 'resuelto',
        prioridad: 'critica',
        fechaResolucion: '2024-01-19',
        observacionesProveedor: 'Se realizó el cambio de productos y se implementaron nuevos controles de calidad.'
      }
    ];
    
    this.reportes.set(reportesData);
    this.filtrarReportes();
  }

  private precargarReporte(pedidoId: string): void {
    this.formularioReporte.set({
      pedidoId: parseInt(pedidoId),
      proveedor: '',
      tipoProblema: '',
      prioridad: 'media',
      descripcion: ''
    });
    this.abrirFormularioReporte();
  }

  filtrarReportes(): void {
    let reportes = this.reportes();

    if (this.filtroEstado() !== 'todos') {
      reportes = reportes.filter(r => r.estado === this.filtroEstado());
    }

    if (this.filtroPrioridad() !== 'todas') {
      reportes = reportes.filter(r => r.prioridad === this.filtroPrioridad());
    }

    if (this.filtroTipo() !== 'todos') {
      reportes = reportes.filter(r => r.tipoProblema === this.filtroTipo());
    }

    this.reportesFiltrados.set(reportes);
  }

  getCountByStatus(estado: string): number {
    return this.reportes().filter(r => r.estado === estado).length;
  }

  getCountByPriority(prioridad: string): number {
    return this.reportes().filter(r => r.prioridad === prioridad).length;
  }

  getStatusText(estado: string): string {
    const estados: Record<string, string> = {
      abierto: 'Abierto',
      en_proceso: 'En Proceso',
      resuelto: 'Resuelto',
      cerrado: 'Cerrado'
    };
    return estados[estado] || estado;
  }

  getPriorityText(prioridad: string): string {
    const prioridades: Record<string, string> = {
      baja: 'Baja',
      media: 'Media',
      alta: 'Alta',
      critica: 'Crítica'
    };
    return prioridades[prioridad] || prioridad;
  }

  getTipoProblemaText(tipo: string): string {
    const tipos: Record<string, string> = {
      incompleto: '📦 Pedido Incompleto',
      vencido: '⏰ Productos Vencidos',
      defectuoso: '❌ Productos Defectuosos',
      retraso: '🕐 Retraso de Entrega',
      otro: '❓ Otro Problema'
    };
    return tipos[tipo] || tipo;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  toggleReporte(reporteId: number): void {
    if (this.reporteExpandido() === reporteId) {
      this.reporteExpandido.set(null);
    } else {
      this.reporteExpandido.set(reporteId);
    }
  }

  abrirFormularioReporte(): void {
    this.modoEdicion.set(false);
    this.formularioReporte.set({
      pedidoId: null,
      proveedor: '',
      tipoProblema: '',
      prioridad: 'media',
      descripcion: ''
    });
    this.mostrarFormulario.set(true);
  }

  editarReporte(reporte: ReporteProveedor): void {
    this.modoEdicion.set(true);
    this.formularioReporte.set({
      id: reporte.id,
      pedidoId: reporte.pedidoId,
      proveedor: reporte.proveedor,
      tipoProblema: reporte.tipoProblema,
      prioridad: reporte.prioridad,
      descripcion: reporte.descripcion
    });
    this.mostrarFormulario.set(true);
  }

  cerrarFormulario(): void {
    this.mostrarFormulario.set(false);
    this.modoEdicion.set(false);
    this.formularioReporte.set({
      pedidoId: null,
      proveedor: '',
      tipoProblema: '',
      prioridad: 'media',
      descripcion: ''
    });
  }

  guardarReporte(): void {
    const formulario = this.formularioReporte();
    
    // Validar que pedidoId no sea null
    if (!formulario.pedidoId) {
      this.showNotification('El ID del pedido es requerido', 'error');
      return;
    }
    
    if (this.modoEdicion()) {
      // Actualizar reporte existente
      const reportes = this.reportes().map(r => 
        r.id === formulario.id ? { 
          ...r, 
          pedidoId: formulario.pedidoId!,
          proveedor: formulario.proveedor,
          tipoProblema: formulario.tipoProblema as ReporteProveedor['tipoProblema'],
          prioridad: formulario.prioridad as ReporteProveedor['prioridad'],
          descripcion: formulario.descripcion
        } : r
      );
      this.reportes.set(reportes);
      this.showNotification('Reporte actualizado correctamente', 'success');
    } else {
      // Crear nuevo reporte
      const nuevoReporte: ReporteProveedor = {
        id: Date.now(),
        pedidoId: formulario.pedidoId,
        proveedor: formulario.proveedor,
        tipoProblema: formulario.tipoProblema as ReporteProveedor['tipoProblema'],
        descripcion: formulario.descripcion,
        fechaReporte: new Date().toISOString().split('T')[0],
        estado: 'abierto',
        prioridad: formulario.prioridad as ReporteProveedor['prioridad']
      };
      
      this.reportes.set([...this.reportes(), nuevoReporte]);
      this.showNotification('Reporte creado correctamente', 'success');
    }
    
    this.filtrarReportes();
    this.cerrarFormulario();
  }

  marcarEnProceso(reporte: ReporteProveedor): void {
    reporte.estado = 'en_proceso';
    this.showNotification(`Reporte #${reporte.id} marcado como en proceso`, 'success');
    this.filtrarReportes();
  }

  marcarResuelto(reporte: ReporteProveedor): void {
    reporte.estado = 'resuelto';
    reporte.fechaResolucion = new Date().toISOString().split('T')[0];
    this.showNotification(`Reporte #${reporte.id} marcado como resuelto`, 'success');
    this.filtrarReportes();
  }

  cerrarReporte(reporte: ReporteProveedor): void {
    reporte.estado = 'cerrado';
    this.showNotification(`Reporte #${reporte.id} cerrado`, 'success');
    this.filtrarReportes();
  }

  limpiarFiltros(): void {
    this.filtroEstado.set('todos');
    this.filtroPrioridad.set('todas');
    this.filtroTipo.set('todos');
    this.filtrarReportes();
  }

  goBack(): void {
    this.router.navigate(['/auxiliar']);
  }

  private showNotification(message: string, type: 'success' | 'error' | 'warning'): void {
    console.log(`${type.toUpperCase()}: ${message}`);
  }
}