import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { DetallePedidoDialogComponent } from './dialogs/detalle-pedido-dialog.component';
import { MatChipsModule } from '@angular/material/chips';
import { PedidoDialogComponent } from './dialogs/pedido-dialog.component';
import { AuthService } from '../../auth/services/auth.service';
import { ProveedoresService, ProveedorApi } from './proveedores.service';
import { MatMenuModule } from '@angular/material/menu';
import { Router, ActivatedRoute } from '@angular/router';
import { NotificationService } from '../../../shared/notification/notification.service';

// Importar diálogos (los crearemos por separado)
import { ProveedorDialogComponent } from './dialogs/proveedor-dialog.component';
import { InsumoDialogComponent } from './dialogs/insumo-dialog.component';
import { ProductoDialogComponent } from './dialogs/producto-dialog.component';
import { RecetaDialogComponent } from './dialogs/receta-dialog.component';
// import { PedidoDialogComponent } from './dialogs/pedido-dialog.component';
import { ReporteDialogComponent } from './dialogs/reporte-dialog.component';
import { InsumoProveedorDialogComponent } from './dialogs/insumo-proveedor-dialog.component';
import { InsumosProveedorService } from './insumos-proveedor.service';
import { PedidosService } from './pedidos.service';
import { ProductosService } from '../../../services/productos.service';
import { InsumosService } from './insumos.service';

// Exportar componentes de diálogo para uso en tests
export {
  ProveedorDialogComponent,
  InsumoDialogComponent,
  ProductoDialogComponent,
  RecetaDialogComponent,
  ReporteDialogComponent,
  InsumoProveedorDialogComponent
};

// Interfaces
export interface Proveedor {
  id_proveedor: number;
  nombre: string;
  telefono: string;
  email: string;
  numero_cuenta: string;
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

interface PedidoDetalle {
  id: number;
  proveedor: string;
  fechaPedido: string;
  fechaEntrega: string;
  estado: 'pendiente' | 'recibido' | 'verificado' | 'incompleto' | 'aprobado' | 'rechazado';
  items: ItemPedido[];
  total: number;
}

export interface InsumoProveedor {
  id_insumo: number;
  nombre: string;
  descripcion: string;
  costo_unitario: number;
  fecha_vencimiento: Date;
  cantidad_disponible: number;
  nombre_proveedor: string;
  id_proveedor: number;
}

export interface PedidoInsumo {
  id_pedido: number;
  nombre: string;
  descripcion: string;
  nombre_proveedor: string;
  id_proveedor: number;
  costo_total: number;
  fecha_pedido: Date;
  fecha_entrega_estimada?: Date;
  es_pagable: boolean;
  estado?: 'pendiente' | 'en_proceso' | 'recibido' | 'cancelado';  // ← NUEVO
  detalles: DetallePedido[];
}

export interface DetallePedido {
  id_detalle: number;
  cantidad_insumo: number;
  costo_subtotal: number;
  es_devuelto: boolean;
  id_insumo: number;
  id_pedido: number;
  nombre_insumo?: string;
  costo_unitario?: number;
}

export interface Reporte {
  id_devolucion: number;
  razon: string;
  es_devolucion: boolean;
  fecha_devolucion: Date;
  id_detalle: number;
}

export interface InsumoReceta {
  id_insumo: number;
  nombre_insumo: string;
  cantidad: number;
}

export interface Receta {
  id_receta: number;
  nombre: string;
  descripcion: string;
  id_producto: number;
  nombre_producto?: string;
  insumos: InsumoReceta[]; // ⭐ Array de múltiples insumos
  // Para compatibilidad con la tabla
  id_insumo?: number;
  nombre_insumo?: string;
  cantidad_insumo?: number;
}

export interface Insumo {
  id_insumo: number;
  nombre: string;
  descripcion: string;
  costo_unitario: number;
  cantidad_actual: number;
}

export interface Producto {
  id_producto: number;
  nombre: string;
  descripcion: string;
  costo_unitario: number;
  fecha_vencimiento: Date;
  categoria: string;
}

// Definir tipos específicos para los diálogos - CORREGIDO
type DialogType = 'proveedor' | 'insumo' | 'producto' | 'insumo-proveedor' | 'receta' | 'reporte' | 'pedido' | 'detalle';

@Component({
  selector: 'app-admin-proveedores',
  standalone: true,
  imports: [
  CommonModule,
  HttpClientModule,
  ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDialogModule,
    MatSnackBarModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule,
    MatTooltipModule,
    MatTabsModule,
    MatChipsModule,
    MatMenuModule
  ],
  templateUrl: './proveedores.html',
  styleUrls: ['./proveedores.css']
})
export class AdminProveedoresComponent implements OnInit, OnDestroy, AfterViewInit {

  activeModule = 'dashboard';

  // Data Sources para las tablas
  detallesPedidosDataSource = new MatTableDataSource<PedidoDetalle>([]);
  detallesPedidosTotal = 0;
  proveedoresDataSource = new MatTableDataSource<Proveedor>([]);
  insumosProveedorDataSource = new MatTableDataSource<InsumoProveedor>([]);
  pedidosDataSource = new MatTableDataSource<PedidoInsumo>([]);
  detallesDataSource = new MatTableDataSource<DetallePedido>([]);
  reportesDataSource = new MatTableDataSource<Reporte>([]);
  recetasDataSource = new MatTableDataSource<Receta>([]);
  insumosDataSource = new MatTableDataSource<Insumo>([]);
  productosDataSource = new MatTableDataSource<Producto>([]);

  // Paginación para insumos-proveedor
  @ViewChild('insumosPaginator') insumosPaginator!: MatPaginator;
  insumosPageIndex = 0;
  insumosPageSize = 10;
  insumosTotal = 0;
  // Paginadores para otras tablas (local paging)
  @ViewChild('proveedoresPaginator') proveedoresPaginator!: MatPaginator;
  @ViewChild('pedidosPaginator') pedidosPaginator!: MatPaginator;
  @ViewChild('detallesPaginator') detallesPaginator!: MatPaginator;
  @ViewChild('reportesPaginator') reportesPaginator!: MatPaginator;
  @ViewChild('recetasPaginator') recetasPaginator!: MatPaginator;
  @ViewChild('insumosPaginatorLocal') insumosPaginatorLocal!: MatPaginator;
  @ViewChild('productosPaginator') productosPaginator!: MatPaginator;

  // caches completos para paginar localmente
  allProveedores: Proveedor[] = [];
  allPedidos: PedidoInsumo[] = [];
  allDetalles: DetallePedido[] = [];
  allReportes: Reporte[] = [];
  allRecetas: Receta[] = [];
  allInsumos: Insumo[] = [];
  allProductos: Producto[] = [];

  proveedoresPageIndex = 0; proveedoresPageSize = 10; proveedoresTotal = 0;
  pedidosPageIndex = 0; pedidosPageSize = 10; pedidosTotal = 0;
  detallesPageIndex = 0; detallesPageSize = 10; detallesTotal = 0;
  reportesPageIndex = 0; reportesPageSize = 10; reportesTotal = 0;
  recetasPageIndex = 0; recetasPageSize = 10; recetasTotal = 0;
  insumosLocalPageIndex = 0; insumosLocalPageSize = 10; insumosLocalTotal = 0;
  productosPageIndex = 0; productosPageSize = 10; productosTotal = 0;

  // Definición de columnas para cada tabla
  detallesPedidosColumns: string[] = ['id', 'proveedor', 'fechaPedido', 'fechaEntrega', 'estado', 'total', 'acciones'];
  proveedoresColumns: string[] = ['id_proveedor', 'nombre', 'telefono', 'email', 'numero_cuenta', 'acciones'];
  insumosProveedorColumns: string[] = ['id_insumo', 'nombre', 'descripcion', 'costo_unitario', 'fecha_vencimiento', 'cantidad_disponible', 'nombre_proveedor', 'acciones'];
  pedidosColumns: string[] = ['id_pedido', 'nombre', 'descripcion', 'nombre_proveedor', 'cantidad_items', 'costo_total', 'fecha_pedido', 'fecha_entrega_estimada','estado',
'es_pagable', 'acciones'];
  detallesColumns: string[] = ['id_detalle', 'cantidad_insumo', 'costo_subtotal', 'es_devuelto', 'nombre_insumo', 'id_pedido', 'acciones'];
  reportesColumns: string[] = ['id_devolucion', 'razon', 'es_devolucion', 'fecha_devolucion', 'id_detalle', 'acciones'];
  recetasColumns: string[] = ['id_receta', 'nombre', 'descripcion', 'cantidad_insumo', 'nombre_insumo', 'nombre_producto', 'acciones'];
  insumosColumns: string[] = ['id_insumo', 'nombre', 'descripcion', 'costo_unitario', 'cantidad_actual', 'acciones'];
  productosColumns: string[] = ['id_producto', 'nombre', 'descripcion', 'costo_unitario', 'vida_util_dias', 'pedido_minimo', 'categoria'];

  // Usuario actual
  userName: string = 'Administrador';

  constructor(
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private authService: AuthService,
  private router: Router,
  private route: ActivatedRoute,
    private notifications: NotificationService,
    private proveedoresService: ProveedoresService,
    private insumosProveedorService: InsumosProveedorService
    , private pedidosService: PedidosService,
    private productosService: ProductosService,
    private insumosService: InsumosService
  ) {}

  ngOnInit(): void {
    this.loadUserInfo();
    // Suscribirse a parámetros de ruta para soportar /admin/:module
    this.route.paramMap.subscribe(params => {
      const moduleParam = params.get('module');
      if (moduleParam) {
        this.activeModule = moduleParam;
      } else {
        // si no hay parámetro, verificar si la URL tiene segmento (p.ej. /admin/proveedores)
        const url = this.router.url || '';
        if (url.startsWith('/admin')) {
          const parts = url.split('/').filter(p => p.length > 0);
          this.activeModule = parts.length >= 2 ? parts[1] : 'dashboard';
        } else {
          this.activeModule = 'dashboard';
        }
      }
      // Cargar datos cada vez que el módulo cambie (si es necesario)
      this.loadAllData();
    });
  }

  ngAfterViewInit(): void {
    // conectar paginator al dataSource cuando esté disponible
    try {
      // Asignar paginadores a cada DataSource (coincidir con los template refs)
      // Nota: no asignamos `dataSource.paginator` porque aplicamos paginación manual
      // (slicing) y manejamos el evento (page) explícitamente. Dejar la sincronización
      // de propiedades para que los controles del paginador estén activos.

      // Sincronizar propiedades (length, pageIndex, pageSize) para que los botones estén activos
      if (this.proveedoresPaginator) {
        this.proveedoresPaginator.length = this.proveedoresTotal;
        this.proveedoresPaginator.pageIndex = this.proveedoresPageIndex;
        this.proveedoresPaginator.pageSize = this.proveedoresPageSize;
      }
      if (this.pedidosPaginator) {
        this.pedidosPaginator.length = this.pedidosTotal;
        this.pedidosPaginator.pageIndex = this.pedidosPageIndex;
        this.pedidosPaginator.pageSize = this.pedidosPageSize;
      }
      if (this.detallesPaginator) {
        this.detallesPaginator.length = this.detallesTotal;
        this.detallesPaginator.pageIndex = this.detallesPageIndex;
        this.detallesPaginator.pageSize = this.detallesPageSize;
      }
      if (this.reportesPaginator) {
        this.reportesPaginator.length = this.reportesTotal;
        this.reportesPaginator.pageIndex = this.reportesPageIndex;
        this.reportesPaginator.pageSize = this.reportesPageSize;
      }
      if (this.recetasPaginator) {
        this.recetasPaginator.length = this.recetasTotal;
        this.recetasPaginator.pageIndex = this.recetasPageIndex;
        this.recetasPaginator.pageSize = this.recetasPageSize;
      }
      if (this.insumosPaginatorLocal) {
        this.insumosPaginatorLocal.length = this.insumosLocalTotal || this.insumosTotal;
        this.insumosPaginatorLocal.pageIndex = this.insumosLocalPageIndex || this.insumosPageIndex;
        this.insumosPaginatorLocal.pageSize = this.insumosLocalPageSize || this.insumosPageSize;
      }
      if (this.productosPaginator) {
        this.productosPaginator.length = this.productosTotal;
        this.productosPaginator.pageIndex = this.productosPageIndex;
        this.productosPaginator.pageSize = this.productosPageSize;
      }
    } catch (e) {}
  }

  // Cargar información del usuario
  loadUserInfo(): void {
    const user = this.authService.getCurrentUser();
    if (user && user.nombre) {
      this.userName = user.nombre;
    }
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  setActiveModule(module: string, navigate: boolean = true): void {
    this.activeModule = module;
    // Navegar para reflejar en la barra de direcciones
    try {
      if (navigate) {
        const route = module === 'dashboard' ? '/admin' : `/admin/${module}`;
        // Solo navegar si la URL actual difiere
        if (this.router.url !== route) {
          this.router.navigate([route]);
        }
      }
    } catch (e) {
      // En tests sin router disponible, ignorar
    }
    this.loadDataForModule(module);
  }

  loadDataForModule(module: string): void {
    console.log(`Cargando datos para el módulo: ${module}`);
  }

  loadAllData(): void {
    this.loadDetallesPedidos();
    this.loadProveedores();
    this.loadInsumos();
    this.loadProductos();
    this.loadInsumosProveedor();
    this.loadPedidos();
    this.loadDetalles();
    this.loadReportes();
    this.loadRecetas();
  }

  private loadDetallesPedidos(): void {
  const mockData: PedidoDetalle[] = [
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

  this.detallesPedidosDataSource.data = mockData;
  this.detallesPedidosTotal = mockData.length;
}

  private loadProveedores(): void {
    // Llamar al backend para obtener proveedores
    this.proveedoresService.list().subscribe({
      next: (res: ProveedorApi[]) => {
        // Mapear respuesta API a la interfaz local Proveedor
        const mapped: Proveedor[] = res.map(r => ({
          id_proveedor: r.idProveedor,
          nombre: r.nombre,
          telefono: r.telefono,
          email: r.email,
          numero_cuenta: r.numeroCuenta
        }));
        this.allProveedores = mapped;
        this.proveedoresTotal = this.allProveedores.length;
        this.proveedoresPageIndex = 0;
        this.proveedoresPageSize = this.proveedoresPageSize || 10;
        this.proveedoresDataSource.data = this.allProveedores.slice(0, this.proveedoresPageSize);
      },
      error: (err) => {
        console.warn('No se pudo cargar proveedores desde API, usando mock.', err);
        // fallback a mock
        const mockData: Proveedor[] = [
          {
            id_proveedor: 1,
            nombre: 'Distribuidora Central',
            telefono: '+57 300 123 4567',
            email: 'ventas@distribuidora.com',
            numero_cuenta: '1234567890'
          },
          {
            id_proveedor: 2,
            nombre: 'Harinas del Valle',
            telefono: '+57 301 234 5678',
            email: 'contacto@harinas.com',
            numero_cuenta: '0987654321'
          }
        ];
        this.allProveedores = mockData;
        this.proveedoresTotal = mockData.length;
        this.proveedoresDataSource.data = this.allProveedores.slice(0, this.proveedoresPageSize || 10);
      }
    });
  }

  private loadInsumos(): void {
    // Intentar cargar los insumos desde el backend
    this.insumosService.list().subscribe({
      next: (res) => {
        const mapped: Insumo[] = (res as any[]).map((r: any) => ({
          id_insumo: r.id ?? r.idInsumo ?? r.id_insumo,
          nombre: r.nombre,
          descripcion: r.descripcion,
          costo_unitario: r.costoUnitario ?? r.costo_unitario ?? 0,
          cantidad_actual: r.cantidadActual ?? r.cantidad_actual ?? 0
        } as Insumo));
        this.allInsumos = mapped;
        this.insumosLocalTotal = this.allInsumos.length;
        this.insumosDataSource.data = this.allInsumos;
      },
      error: (err) => {
        console.warn('No se pudo cargar insumos desde API, usando mock fallback', err);
        const mockData: Insumo[] = [
          {
            id_insumo: 1,
            nombre: 'Harina de Trigo',
            descripcion: 'Harina premium para panificación',
            costo_unitario: 2500,
            cantidad_actual: 50
          },
          {
            id_insumo: 2,
            nombre: 'Azúcar Blanca',
            descripcion: 'Azúcar refinada para repostería',
            costo_unitario: 3000,
            cantidad_actual: 25
          },
          {
            id_insumo: 3,
            nombre: 'Mantequilla',
            descripcion: 'Mantequilla sin sal',
            costo_unitario: 8000,
            cantidad_actual: 15
          }
        ];
        this.allInsumos = mockData;
        this.insumosLocalTotal = this.allInsumos.length;
        this.insumosDataSource.data = this.allInsumos;
      }
    });
  }

  private loadProductos(): void {
    // Usar servicio de productos para cargar desde backend
    try {
      // @ts-ignore - producto service inyectado en el constructor de la clase (si no está, se debe agregar)
      this.productosService.getProductos().subscribe({
        next: (res: any[]) => {
          // Mapear respuesta a la interfaz local Producto (nombres de campos usados en la tabla)
          const mapped = res.map(r => ({
            id_producto: r.idProducto ?? r.id_producto ?? r.id ?? 0,
            nombre: r.nombre ?? r.name ?? '',
            descripcion: r.descripcion ?? r.description ?? '',
            costo_unitario: r.costoUnitario ?? r.costo_unitario ?? r.costo ?? 0,
            // Exponer ambos nombres para evitar problemas de mapeo en template
            // El backend puede devolver `vidaUtilDias` o `diasVidaUtil` según el DTO; contemplamos ambos
            vida_util_dias: r.vidaUtilDias ?? r.diasVidaUtil ?? r.vida_util_dias ?? r.vida_util ?? null,
            vidaUtilDias: r.vidaUtilDias ?? r.diasVidaUtil ?? r.vida_util_dias ?? r.vida_util ?? null,
            pedido_minimo: r.pedidoMinimo ?? r.pedido_minimo ?? r.minimo ?? null,
            pedidoMinimo: r.pedidoMinimo ?? r.pedido_minimo ?? r.minimo ?? null,
            categoria: r.categoriaNombre ?? r.categoria ?? (r.categoria?.nombre ?? '')
          } as any));

          // Debug: mostrar en consola el primer elemento recibido y el mapeado
          try { console.log('Productos API response sample:', res && res.length ? res[0] : null); } catch(e) {}
          try { console.log('Productos mapeados sample:', mapped && mapped.length ? mapped[0] : null); } catch(e) {}

          // Asignar todos los productos al dataSource (sin paginación)
          this.allProductos = mapped;
          this.productosTotal = this.allProductos.length;
          this.productosDataSource.data = this.allProductos;
        },
        error: (err) => {
          console.warn('No se pudo cargar productos desde API, usando mock fallback', err);
          this.allProductos = [];
          this.productosTotal = 0;
          this.productosDataSource.data = [];
        }
      });
    } catch (e) {
      console.error('Error al cargar productos', e);
      this.allProductos = [];
      this.productosTotal = 0;
      this.productosDataSource.data = [];
    }
  }

  private loadInsumosProveedor(page: number = 0, size: number = 10, search?: string): void {
    // Usar endpoint paginado del backend; fallback a list completa si API no responde
    this.insumosProveedorService.paginated(page, size, search).subscribe({
      next: (res) => {
        // Se espera respuesta con { content: [...], totalElements }
        const content = Array.isArray(res.content) ? res.content : (res as any);
        const mapped: InsumoProveedor[] = content.map((r: any) => ({
          id_insumo: r.id,
          nombre: r.nombre,
          descripcion: r.descripcion,
          costo_unitario: r.costoUnitario,
          fecha_vencimiento: r.fechaVencimiento ? new Date(r.fechaVencimiento) : new Date(),
          cantidad_disponible: r.cantidadDisponible,
          nombre_proveedor: '',
          id_proveedor: r.idProveedor
        }));
        mapped.forEach(m => {
          const prov = this.proveedoresDataSource.data.find(p => p.id_proveedor === m.id_proveedor);
          if (prov) m.nombre_proveedor = prov.nombre;
        });
        this.insumosProveedorDataSource.data = mapped;
        // actualizar paginación
        this.insumosTotal = res.totalElements ?? (Array.isArray(res) ? res.length : mapped.length);
        this.insumosPageIndex = page;
        this.insumosPageSize = size;
      },
      error: (err) => {
        console.warn('No se pudo cargar insumos-proveedor paginados desde API, usando list/fallback.', err);
        // Intentar cargar la lista completa y paginar localmente
        this.insumosProveedorService.list().subscribe({
          next: (all) => {
            const mapped: InsumoProveedor[] = all.map(r => ({
              id_insumo: r.id,
              nombre: r.nombre,
              descripcion: r.descripcion,
              costo_unitario: r.costoUnitario,
              fecha_vencimiento: r.fechaVencimiento ? new Date(r.fechaVencimiento) : new Date(),
              cantidad_disponible: r.cantidadDisponible,
              nombre_proveedor: '',
              id_proveedor: r.idProveedor
            }));
            mapped.forEach(m => {
              const prov = this.proveedoresDataSource.data.find(p => p.id_proveedor === m.id_proveedor);
              if (prov) m.nombre_proveedor = prov.nombre;
            });
            this.insumosTotal = mapped.length;
            this.insumosPageIndex = page;
            this.insumosPageSize = size;
            const start = page * size;
            this.insumosProveedorDataSource.data = mapped.slice(start, start + size);
          },
          error: () => {
            // fallback mock
            const mockData: InsumoProveedor[] = [
              {
                id_insumo: 1,
                nombre: 'Harina de Trigo',
                descripcion: 'Harina premium para panificación',
                costo_unitario: 2500,
                fecha_vencimiento: new Date('2024-12-31'),
                cantidad_disponible: 50,
                nombre_proveedor: 'Harinas del Valle',
                id_proveedor: 2
              }
            ];
            this.insumosTotal = mockData.length;
            this.insumosProveedorDataSource.data = mockData;
          }
        });
      }
    });
  }

  onInsumosPage(event: any): void {
    const pageIndex = event.pageIndex ?? this.insumosPageIndex;
    const pageSize = event.pageSize ?? this.insumosPageSize;
    this.loadInsumosProveedor(pageIndex, pageSize);
  }

  onProveedoresPage(event: any): void {
    const pageIndex = event.pageIndex ?? this.proveedoresPageIndex;
    const pageSize = event.pageSize ?? this.proveedoresPageSize;
    this.proveedoresPageIndex = pageIndex; this.proveedoresPageSize = pageSize;
    this.proveedoresTotal = this.allProveedores.length;
    const start = pageIndex * pageSize;
    this.proveedoresDataSource.data = this.allProveedores.slice(start, start + pageSize);
    try { if (this.proveedoresPaginator) { this.proveedoresPaginator.length = this.proveedoresTotal; this.proveedoresPaginator.pageIndex = pageIndex; } } catch(e) {}
  }

  onPedidosPage(event: any): void {
    const pageIndex = event.pageIndex ?? this.pedidosPageIndex;
    const pageSize = event.pageSize ?? this.pedidosPageSize;
    this.pedidosPageIndex = pageIndex; this.pedidosPageSize = pageSize;
    this.pedidosTotal = this.allPedidos.length;
    const start = pageIndex * pageSize;
    this.pedidosDataSource.data = this.allPedidos.slice(start, start + pageSize);
    try { if (this.pedidosPaginator) { this.pedidosPaginator.length = this.pedidosTotal; this.pedidosPaginator.pageIndex = pageIndex; } } catch(e) {}
  }

  onDetallesPage(event: any): void {
    const pageIndex = event.pageIndex ?? this.detallesPageIndex;
    const pageSize = event.pageSize ?? this.detallesPageSize;
    this.detallesPageIndex = pageIndex; this.detallesPageSize = pageSize;
    this.detallesTotal = this.allDetalles.length;
    const start = pageIndex * pageSize;
    this.detallesDataSource.data = this.allDetalles.slice(start, start + pageSize);
    try { if (this.detallesPaginator) { this.detallesPaginator.length = this.detallesTotal; this.detallesPaginator.pageIndex = pageIndex; } } catch(e) {}
  }

  onReportesPage(event: any): void {
    const pageIndex = event.pageIndex ?? this.reportesPageIndex;
    const pageSize = event.pageSize ?? this.reportesPageSize;
    this.reportesPageIndex = pageIndex; this.reportesPageSize = pageSize;
    this.reportesTotal = this.allReportes.length;
    const start = pageIndex * pageSize;
    this.reportesDataSource.data = this.allReportes.slice(start, start + pageSize);
    try { if (this.reportesPaginator) { this.reportesPaginator.length = this.reportesTotal; this.reportesPaginator.pageIndex = pageIndex; } } catch(e) {}
  }

  onRecetasPage(event: any): void {
    const pageIndex = event.pageIndex ?? this.recetasPageIndex;
    const pageSize = event.pageSize ?? this.recetasPageSize;
    this.recetasPageIndex = pageIndex; this.recetasPageSize = pageSize;
    this.recetasTotal = this.allRecetas.length;
    const start = pageIndex * pageSize;
    this.recetasDataSource.data = this.allRecetas.slice(start, start + pageSize);
    try { if (this.recetasPaginator) { this.recetasPaginator.length = this.recetasTotal; this.recetasPaginator.pageIndex = pageIndex; } } catch(e) {}
  }

  onInsumosLocalPage(event: any): void {
    const pageIndex = event.pageIndex ?? this.insumosLocalPageIndex;
    const pageSize = event.pageSize ?? this.insumosLocalPageSize;
    this.insumosLocalPageIndex = pageIndex; this.insumosLocalPageSize = pageSize;
    this.insumosLocalTotal = this.allInsumos.length;
    const start = pageIndex * pageSize;
    this.insumosDataSource.data = this.allInsumos.slice(start, start + pageSize);
    try { if (this.insumosPaginatorLocal) { this.insumosPaginatorLocal.length = this.insumosLocalTotal; this.insumosPaginatorLocal.pageIndex = pageIndex; } } catch(e) {}
  }

  onProductosPage(event: any): void {
    const pageIndex = event.pageIndex ?? this.productosPageIndex;
    const pageSize = event.pageSize ?? this.productosPageSize;
    this.productosPageIndex = pageIndex; this.productosPageSize = pageSize;
    this.productosTotal = this.allProductos.length;
    const start = pageIndex * pageSize;
    this.productosDataSource.data = this.allProductos.slice(start, start + pageSize);
    try { if (this.productosPaginator) { this.productosPaginator.length = this.productosTotal; this.productosPaginator.pageIndex = pageIndex; } } catch(e) {}
  }

  private loadPedidos(): void {
    // Intentar cargar pedidos desde el backend
    this.pedidosService.list().subscribe({
      next: (res) => {
        // Mapear la respuesta del backend a la interfaz local `PedidoInsumo`
        const mapped: PedidoInsumo[] = res.map(r => ({
          id_pedido: r.id,
          nombre: r.nombre,
          descripcion: r.descripcion || '',
          nombre_proveedor: r?.detalles?.length ? (r.detalles[0].insumo?.nombre_proveedor || '') : '',
          id_proveedor: r?.detalles?.length ? (r.detalles[0].insumo?.idProveedor || 0) : 0,
          costo_total: r.costoTotal || 0,
          fecha_pedido: r.fechaPedido ? new Date(r.fechaPedido) : new Date(),
          fecha_entrega_estimada: undefined,
          es_pagable: !!r.pago,
          estado: (r.estado as any) || 'pendiente',
          detalles: (r.detalles || []).map(d => ({
            id_detalle: d.id,
            id_insumo: d.insumo?.id || 0,
            id_pedido: r.id,
            nombre_insumo: d.insumo?.nombre || '',
            cantidad_insumo: d.cantidadInsumo,
            costo_unitario: (d.costoSubtotal && d.cantidadInsumo) ? (d.costoSubtotal / d.cantidadInsumo) : 0,
            costo_subtotal: d.costoSubtotal,
            es_devuelto: !!d.esDevuelto
          }))
        }));

        this.allPedidos = mapped;
        this.pedidosTotal = this.allPedidos.length;
        this.pedidosPageIndex = 0;
        this.pedidosPageSize = this.pedidosPageSize || 10;
        this.pedidosDataSource.data = this.allPedidos.slice(0, this.pedidosPageSize);
      },
      error: (err) => {
        console.warn('No se pudo cargar pedidos desde API, usando mock.', err);
        // fallback a mock (mantener comportamiento previo)
        const mockData: PedidoInsumo[] = [
          {
            id_pedido: 1,
            nombre: 'Pedido Semanal',
            descripcion: 'Insumos para la semana',
            nombre_proveedor: 'Distribuidora Central',
            id_proveedor: 1,
            costo_total: 150000,
            fecha_pedido: new Date('2025-10-16'),
            fecha_entrega_estimada: new Date('2025-10-18'),
            es_pagable: true,
            estado: 'pendiente',
            detalles: [
             {
              id_detalle: 1,
              id_insumo: 1,
              id_pedido: 1,
              nombre_insumo: 'Harina de Trigo',
              cantidad_insumo: 10,
              costo_unitario: 2500,
              costo_subtotal: 25000,
              es_devuelto: false
            },
            {
              id_detalle: 2,
              id_insumo: 2,
              id_pedido: 1,
              nombre_insumo: 'Azúcar Blanca',
              cantidad_insumo: 15,
              costo_unitario: 3000,
              costo_subtotal: 45000,
              es_devuelto: false
            }
          ]
        }
      ];
      this.allPedidos = mockData;
      this.pedidosTotal = this.allPedidos.length;
      this.pedidosDataSource.data = this.allPedidos.slice(0, this.pedidosPageSize || 10);
      }
    });
}

  private loadDetalles(): void {
    const mockData: DetallePedido[] = [
      {
        id_detalle: 1,
        cantidad_insumo: 10,
        costo_subtotal: 25000,
        es_devuelto: false,
        id_insumo: 1,
        id_pedido: 1,
        nombre_insumo: 'Harina de Trigo'
      }
    ];
    this.allDetalles = mockData;
    this.detallesTotal = this.allDetalles.length;
    this.detallesDataSource.data = this.allDetalles.slice(0, this.detallesPageSize || 10);
  }

  private loadReportes(): void {
    const mockData: Reporte[] = [
      {
        id_devolucion: 1,
        razon: 'Producto defectuoso',
        es_devolucion: true,
        fecha_devolucion: new Date(),
        id_detalle: 1
      }
    ];
    this.allReportes = mockData;
    this.reportesTotal = this.allReportes.length;
    this.reportesDataSource.data = this.allReportes.slice(0, this.reportesPageSize || 10);
  }


private loadRecetas(): void {
    // DATOS MOCK ACTUALIZADOS CON MÚLTIPLES INSUMOS
    const mockData: Receta[] = [
      {
        id_receta: 1,
        nombre: 'Pan Integral',
        descripcion: 'Receta básica de pan integral con ingredientes naturales',
        id_producto: 1,
        nombre_producto: 'Pan Artesanal',
        insumos: [
          { id_insumo: 1, nombre_insumo: 'Harina de Trigo', cantidad: 500 },
          { id_insumo: 2, nombre_insumo: 'Azúcar Blanca', cantidad: 50 },
          { id_insumo: 3, nombre_insumo: 'Mantequilla', cantidad: 100 }
        ],
        // Para compatibilidad con la tabla (muestra el primero)
        id_insumo: 1,
        nombre_insumo: 'Harina de Trigo',
        cantidad_insumo: 500
      },
      {
        id_receta: 2,
        nombre: 'Torta de Chocolate Especial',
        descripcion: 'Deliciosa torta de chocolate con varios ingredientes',
        id_producto: 2,
        nombre_producto: 'Torta de Chocolate',
        insumos: [
          { id_insumo: 1, nombre_insumo: 'Harina de Trigo', cantidad: 300 },
          { id_insumo: 2, nombre_insumo: 'Azúcar Blanca', cantidad: 200 },
          { id_insumo: 3, nombre_insumo: 'Mantequilla', cantidad: 150 },
          { id_insumo: 4, nombre_insumo: 'Huevos', cantidad: 4 }
        ],
        id_insumo: 1,
        nombre_insumo: 'Harina de Trigo',
        cantidad_insumo: 300
      }
    ];
    this.allRecetas = mockData;
    this.recetasTotal = this.allRecetas.length;
    this.recetasDataSource.data = this.allRecetas.slice(0, this.recetasPageSize || 10);
  }


  applyFilter(event: Event, dataSource: MatTableDataSource<any>): void {
    const filterValue = (event.target as HTMLInputElement).value;
    dataSource.filter = filterValue.trim().toLowerCase();
  }

  getDetallesPedidosCountByStatus(estado: string): number {
  return this.detallesPedidosDataSource.data.filter(p => p.estado === estado).length;
}

  // método para abrir el diálogo de detalles
openDetallePedidoDialog(pedido: PedidoDetalle): void {
  const dialogRef = this.dialog.open(DetallePedidoDialogComponent, {
    width: '90%',
    maxWidth: '1200px',
    maxHeight: '90vh',
    data: { pedido, isEdit: true }
  });


  dialogRef.afterClosed().subscribe((result: PedidoDetalle | undefined) => {
    if (result) {
      // Actualizar el pedido en el DataSource
      const index = this.detallesPedidosDataSource.data.findIndex(p => p.id === result.id);
      if (index !== -1) {
        this.detallesPedidosDataSource.data[index] = result;
        this.detallesPedidosDataSource.data = [...this.detallesPedidosDataSource.data];

        this.snackBar.open('Pedido actualizado exitosamente', 'Cerrar', {
          duration: 3000,
          panelClass: 'snackbar-success'
        });
      }
    }
  });
}

openAddDialog(type: DialogType): void {
  if (type === 'detalle') {
    this.snackBar.open(`Funcionalidad de ${type} en desarrollo`, 'Cerrar', {
      duration: 3000,
      panelClass: 'snackbar-warning'
    });
    return;
  }

  let dialogComponent: any;
  let dialogData: any = { item: null, isEdit: false, type };

  switch (type) {
    case 'proveedor':
      dialogComponent = ProveedorDialogComponent;
      break;

    case 'insumo':
      dialogComponent = InsumoDialogComponent;
      break;

    case 'producto':
      dialogComponent = ProductoDialogComponent;
      break;

    case 'insumo-proveedor':
      dialogComponent = InsumoProveedorDialogComponent;
      dialogData.proveedores = this.proveedoresDataSource.data;
      dialogData.insumos = this.insumosDataSource.data;
      // ← AGREGAR: Pasar los insumos-proveedor existentes para validación
      dialogData.insumosProveedorExistentes = this.insumosProveedorDataSource.data;
      break;

    case 'receta':
      dialogComponent = RecetaDialogComponent;
      dialogData.insumos = this.insumosDataSource.data;
      dialogData.productos = this.productosDataSource.data;
      break;

    case 'reporte':
      dialogComponent = ReporteDialogComponent;
      dialogData.detalles = this.detallesDataSource.data;
      break;

    case 'pedido':
      dialogComponent = PedidoDialogComponent;
      dialogData.proveedores = this.proveedoresDataSource.data;
      dialogData.insumosProveedor = this.insumosProveedorDataSource.data;
      break;

    default:
      return;
  }

  const dialogRef: MatDialogRef<any, any> = this.dialog.open(dialogComponent, {
    width: type === 'pedido' ? '900px' : type === 'insumo-proveedor' ? '700px' : '500px',
    maxHeight: '90vh',
    data: dialogData
  });

  dialogRef.afterClosed().subscribe((result: any) => {
    if (result) {
      this.addItem(type, result);
    }
  });
}

openEditDialog(type: DialogType, item: any): void {
  if (type === 'detalle') {
    this.snackBar.open(`Funcionalidad de edición de ${type} en desarrollo`, 'Cerrar', {
      duration: 3000,
      panelClass: 'snackbar-warning'
    });
    return;
  }

  let dialogComponent: any;
  let dialogData: any = { item, isEdit: true, type };

  switch (type) {
    case 'proveedor':
      dialogComponent = ProveedorDialogComponent;
      break;

    case 'insumo':
      dialogComponent = InsumoDialogComponent;
      break;

    case 'producto':
      dialogComponent = ProductoDialogComponent;
      break;

    case 'insumo-proveedor':
      dialogComponent = InsumoProveedorDialogComponent;
      dialogData.proveedores = this.proveedoresDataSource.data;
      dialogData.insumos = this.insumosDataSource.data;
      // ← AGREGAR: Pasar los insumos-proveedor existentes para validación
      dialogData.insumosProveedorExistentes = this.insumosProveedorDataSource.data;
      break;

    case 'receta':
      dialogComponent = RecetaDialogComponent;
      dialogData.insumos = this.insumosDataSource.data;
      dialogData.productos = this.productosDataSource.data;
      break;

    case 'reporte':
      dialogComponent = ReporteDialogComponent;
      dialogData.detalles = this.detallesDataSource.data;
      break;

    case 'pedido':
      dialogComponent = PedidoDialogComponent;
      dialogData.proveedores = this.proveedoresDataSource.data;
      dialogData.insumosProveedor = this.insumosProveedorDataSource.data;
      break;

    default:
      return;
  }

  const dialogRef: MatDialogRef<any, any> = this.dialog.open(dialogComponent, {
    width: type === 'pedido' ? '900px' : type === 'insumo-proveedor' ? '700px' : '500px',
    maxHeight: '90vh',
    data: dialogData
  });

  dialogRef.afterClosed().subscribe((result: any) => {
    if (result) {
      this.updateItem(type, item, result);
    }
  });
}

  addItem(type: DialogType, item: any): void {
    switch (type) {
      case 'proveedor':
        // Crear en backend
        this.proveedoresService.create({
          nombre: item.nombre,
          telefono: item.telefono,
          email: item.email,
          numeroCuenta: item.numero_cuenta || item.numeroCuenta || ''
        }).subscribe({
          next: (created) => {
            const mapped: Proveedor = {
              id_proveedor: created.idProveedor,
              nombre: created.nombre,
              telefono: created.telefono,
              email: created.email,
              numero_cuenta: created.numeroCuenta
            };
            this.proveedoresDataSource.data = [...this.proveedoresDataSource.data, mapped];
            this.snackBar.open('Proveedor agregado correctamente', 'Cerrar', { duration: 3000, panelClass: 'snackbar-success' });
          },
          error: (err) => {
            console.warn('Error al crear proveedor, fallback local', err);
            const newProveedorId = Math.max(...this.proveedoresDataSource.data.map(p => p.id_proveedor), 0) + 1;
            const newProveedor = { ...item, id_proveedor: newProveedorId };
            this.proveedoresDataSource.data = [...this.proveedoresDataSource.data, newProveedor];
            this.snackBar.open('Proveedor agregado (modo offline)', 'Cerrar', { duration: 3000, panelClass: 'snackbar-warning' });
          }
        });
        break;

      case 'insumo':
        // Enviar al backend (mapeando nombres de campos del diálogo a los que espera la API)
        const createPayload = {
          nombre: item.nombre,
          descripcion: item.descripcion,
          costoUnitario: item.costo_unitario ?? item.costoUnitario ?? 0,
          cantidadActual: item.cantidad_actual ?? item.cantidadActual ?? 0
        };

        this.insumosService.create(createPayload).subscribe({
          next: (created) => {
            const mapped: Insumo = {
              id_insumo: (created as any).id ?? (created as any).idInsumo ?? (created as any).id_insumo ?? Math.max(...this.insumosDataSource.data.map(i => i.id_insumo), 0) + 1,
              nombre: (created as any).nombre,
              descripcion: (created as any).descripcion,
              costo_unitario: (created as any).costoUnitario ?? (created as any).costo_unitario ?? 0,
              cantidad_actual: (created as any).cantidadActual ?? (created as any).cantidad_actual ?? 0
            } as Insumo;
            this.insumosDataSource.data = [...this.insumosDataSource.data, mapped];
            this.snackBar.open('Insumo creado correctamente', 'Cerrar', { duration: 3000, panelClass: 'snackbar-success' });
          },
          error: (err) => {
            console.warn('Error creando insumo en API, fallback local', err);
            const newInsumoId = Math.max(...this.insumosDataSource.data.map(i => i.id_insumo), 0) + 1;
            const newInsumo = { ...item, id_insumo: newInsumoId };
            this.insumosDataSource.data = [...this.insumosDataSource.data, newInsumo];
            this.snackBar.open('Insumo agregado (modo offline)', 'Cerrar', { duration: 3000, panelClass: 'snackbar-warning' });
          }
        });
        break;

      case 'producto':
        const newProductoId = Math.max(...this.productosDataSource.data.map(p => p.id_producto), 0) + 1;
        const newProducto = { ...item, id_producto: newProductoId };
        this.productosDataSource.data = [...this.productosDataSource.data, newProducto];
        break;

      case 'insumo-proveedor':
        // crear insumo-proveedor en backend
        const localNewInsumoId = Math.max(...this.insumosProveedorDataSource.data.map(i => i.id_insumo), 0) + 1;
        const localNewInsumo: InsumoProveedor = { ...item, id_insumo: localNewInsumoId } as InsumoProveedor;
        this.insumosProveedorService.create({
          nombre: item.nombre,
          descripcion: item.descripcion,
          costoUnitario: item.costo_unitario || item.costoUnitario || 0,
          fechaVencimiento: item.fecha_vencimiento ? (item.fecha_vencimiento instanceof Date ? item.fecha_vencimiento.toISOString() : item.fecha_vencimiento) : undefined,
          cantidadDisponible: item.cantidad_disponible || item.cantidadDisponible || 0,
          idProveedor: item.id_proveedor || item.idProveedor
        }).subscribe({
          next: (created) => {
            const mapped: InsumoProveedor = {
              id_insumo: created.id,
              nombre: created.nombre,
              descripcion: created.descripcion,
              costo_unitario: created.costoUnitario,
              fecha_vencimiento: created.fechaVencimiento ? new Date(created.fechaVencimiento) : new Date(),
              cantidad_disponible: created.cantidadDisponible,
              nombre_proveedor: this.proveedoresDataSource.data.find(p => p.id_proveedor === created.idProveedor)?.nombre || '',
              id_proveedor: created.idProveedor
            };
            this.insumosProveedorDataSource.data = [...this.insumosProveedorDataSource.data, mapped];
          },
          error: (err) => {
            console.warn('Error creando insumo-proveedor en API, fallback local', err);
            this.insumosProveedorDataSource.data = [...this.insumosProveedorDataSource.data, localNewInsumo];
          }
        });
        break;

      case 'receta':
        const newRecetaId = Math.max(...this.recetasDataSource.data.map(r => r.id_receta), 0) + 1;
        const insumo = this.insumosDataSource.data.find(i => i.id_insumo == item.id_insumo);
        const producto = this.productosDataSource.data.find(p => p.id_producto == item.id_producto);
        const newReceta = {
          ...item,
          id_receta: newRecetaId,
          nombre_insumo: insumo?.nombre || '',
          nombre_producto: producto?.nombre || ''
        };
        this.recetasDataSource.data = [...this.recetasDataSource.data, newReceta];
        break;


      case 'reporte':
        const newReporteId = Math.max(...this.reportesDataSource.data.map(r => r.id_devolucion), 0) + 1;
        const newReporte = {
          ...item,
          id_devolucion: newReporteId,
          fecha_devolucion: new Date()
        };
        this.reportesDataSource.data = [...this.reportesDataSource.data, newReporte];
        break;

      case 'detalle':
        // Implementar cuando tengamos el componente
        this.snackBar.open('Funcionalidad de detalles en desarrollo', 'Cerrar', {
          duration: 3000,
          panelClass: 'snackbar-warning'
        });
        break;

      case 'pedido':
        // Intentar crear pedido en backend
        try {
          const payload = {
            nombre: item.nombre,
            descripcion: item.descripcion || '',
            fechaPedido: item.fecha_pedido && (item.fecha_pedido instanceof Date ? item.fecha_pedido.toISOString().split('T')[0] : item.fecha_pedido),
            detalles: (item.detalles || []).map((d: any) => ({
              insumoProveedorId: d.id_insumo || d.idInsumo || d.insumoProveedorId,
              cantidadInsumo: d.cantidad_insumo || d.cantidadInsumo || 0,
              precioUnitario: d.costo_unitario || (d.costo_subtotal && d.cantidad_insumo ? d.costo_subtotal / d.cantidad_insumo : 0) || 0
            }))
          };
          this.pedidosService.create(payload).subscribe({
            next: (created) => {
              const mapped: PedidoInsumo = {
                id_pedido: created.id,
                nombre: created.nombre,
                descripcion: created.descripcion || '',
                nombre_proveedor: created?.detalles?.length ? (created.detalles[0].insumo?.nombre_proveedor || '') : '',
                id_proveedor: created?.detalles?.length ? (created.detalles[0].insumo?.idProveedor || 0) : 0,
                costo_total: created.costoTotal || 0,
                fecha_pedido: created.fechaPedido ? new Date(created.fechaPedido) : new Date(),
                fecha_entrega_estimada: undefined,
                es_pagable: !!created.pago,
                estado: (created.estado as any) || 'pendiente',
                detalles: (created.detalles || []).map(d => ({
                  id_detalle: d.id,
                  id_insumo: d.insumo?.id || 0,
                  id_pedido: created.id,
                  nombre_insumo: d.insumo?.nombre || '',
                  cantidad_insumo: d.cantidadInsumo,
                  costo_unitario: (d.costoSubtotal && d.cantidadInsumo) ? (d.costoSubtotal / d.cantidadInsumo) : 0,
                  costo_subtotal: d.costoSubtotal,
                  es_devuelto: !!d.esDevuelto
                }))
              };
              this.pedidosDataSource.data = [...this.pedidosDataSource.data, mapped];
              this.snackBar.open('Pedido creado correctamente', 'Cerrar', { duration: 3000, panelClass: 'snackbar-success' });
            },
            error: (err) => {
              console.warn('Error creando pedido en API, fallback local', err);
              const newPedidoId = Math.max(...this.pedidosDataSource.data.map(p => p.id_pedido), 0) + 1;
              const proveedor = this.proveedoresDataSource.data.find(p => p.id_proveedor == item.id_proveedor);
              const newPedido = {
                ...item,
                id_pedido: newPedidoId,
                nombre_proveedor: proveedor?.nombre || item.nombre_proveedor || '',
                estado: item.estado || 'pendiente'
              };
              this.pedidosDataSource.data = [...this.pedidosDataSource.data, newPedido];
              this.snackBar.open('Pedido agregado (modo offline)', 'Cerrar', { duration: 3000, panelClass: 'snackbar-warning' });
            }
          });
        } catch (e) {
          console.warn('Exception al crear pedido, fallback local', e);
        }
      break;

    }

    if (type !== 'pedido' && type !== 'detalle') {

      this.snackBar.open(`${this.getTypeName(type)} agregado exitosamente`, 'Cerrar', {
        duration: 3000,
        panelClass: 'snackbar-success'
      });
    }
  }

  updateItem(type: DialogType, oldItem: any, newItem: any): void {
    switch (type) {
      case 'proveedor':
        // Actualizar en backend
        this.proveedoresService.update(oldItem.id_proveedor, {
          nombre: newItem.nombre,
          telefono: newItem.telefono,
          email: newItem.email,
          numeroCuenta: newItem.numero_cuenta || newItem.numeroCuenta
        }).subscribe({
          next: (updated) => {
            const idx = this.proveedoresDataSource.data.findIndex(p => p.id_proveedor === oldItem.id_proveedor);
            if (idx !== -1) {
              this.proveedoresDataSource.data[idx] = {
                id_proveedor: updated.idProveedor,
                nombre: updated.nombre,
                telefono: updated.telefono,
                email: updated.email,
                numero_cuenta: updated.numeroCuenta
              };
              this.proveedoresDataSource.data = [...this.proveedoresDataSource.data];
            }
          },
          error: (err) => {
            console.warn('Error al actualizar proveedor, fallback local', err);
            const proveedorIndex2 = this.proveedoresDataSource.data.findIndex(p => p.id_proveedor === oldItem.id_proveedor);
            if (proveedorIndex2 !== -1) {
              this.proveedoresDataSource.data[proveedorIndex2] = { ...oldItem, ...newItem };
              this.proveedoresDataSource.data = [...this.proveedoresDataSource.data];
            }
          }
        });
        break;

      case 'insumo':
        // Intentar actualizar en backend
        const updatePayload = {
          nombre: newItem.nombre,
          descripcion: newItem.descripcion,
          costoUnitario: newItem.costo_unitario ?? newItem.costoUnitario,
          cantidadActual: newItem.cantidad_actual ?? newItem.cantidadActual
        };

        this.insumosService.update(oldItem.id_insumo, updatePayload).subscribe({
          next: (updated) => {
            const idx = this.insumosDataSource.data.findIndex(i => i.id_insumo === oldItem.id_insumo);
            if (idx !== -1) {
              this.insumosDataSource.data[idx] = {
                id_insumo: (updated as any).id ?? (updated as any).idInsumo ?? oldItem.id_insumo,
                nombre: (updated as any).nombre ?? newItem.nombre,
                descripcion: (updated as any).descripcion ?? newItem.descripcion,
                costo_unitario: (updated as any).costoUnitario ?? (updated as any)['costo_unitario'] ?? newItem.costo_unitario,
                cantidad_actual: (updated as any).cantidadActual ?? (updated as any)['cantidad_actual'] ?? newItem.cantidad_actual
              } as Insumo;
              this.insumosDataSource.data = [...this.insumosDataSource.data];
              this.snackBar.open('Insumo actualizado correctamente', 'Cerrar', { duration: 3000, panelClass: 'snackbar-success' });
            }
          },
          error: (err) => {
            console.warn('Error actualizando insumo en API, fallback local', err);
            const insumoIndex = this.insumosDataSource.data.findIndex(i => i.id_insumo === oldItem.id_insumo);
            if (insumoIndex !== -1) {
              this.insumosDataSource.data[insumoIndex] = { ...oldItem, ...newItem };
              this.insumosDataSource.data = [...this.insumosDataSource.data];
              this.snackBar.open('Insumo actualizado (modo offline)', 'Cerrar', { duration: 3000, panelClass: 'snackbar-warning' });
            }
          }
        });
        break;

      case 'producto':
        const productoIndex = this.productosDataSource.data.findIndex(p => p.id_producto === oldItem.id_producto);
        if (productoIndex !== -1) {
          this.productosDataSource.data[productoIndex] = { ...oldItem, ...newItem };
          this.productosDataSource.data = [...this.productosDataSource.data];
        }
        break;

      case 'receta':
        const recetaIndex = this.recetasDataSource.data.findIndex(r => r.id_receta === oldItem.id_receta);
        if (recetaIndex !== -1) {
          const insumo = this.insumosDataSource.data.find(i => i.id_insumo == newItem.id_insumo);
          const producto = this.productosDataSource.data.find(p => p.id_producto == newItem.id_producto);
          this.recetasDataSource.data[recetaIndex] = {
            ...oldItem,
            ...newItem,
            nombre_insumo: insumo?.nombre || '',
            nombre_producto: producto?.nombre || ''
          };
          this.recetasDataSource.data = [...this.recetasDataSource.data];
        }
        break;

      case 'reporte':
        const reporteIndex = this.reportesDataSource.data.findIndex(r => r.id_devolucion === oldItem.id_devolucion);
        if (reporteIndex !== -1) {
          this.reportesDataSource.data[reporteIndex] = { ...oldItem, ...newItem };
          this.reportesDataSource.data = [...this.reportesDataSource.data];
        }
        break;

      case 'pedido':
        // Intentar actualizar en backend
        try {
          const payload = {
            nombre: newItem.nombre,
            descripcion: newItem.descripcion || '',
            fechaPedido: newItem.fecha_pedido && (newItem.fecha_pedido instanceof Date ? newItem.fecha_pedido.toISOString().split('T')[0] : newItem.fecha_pedido),
            detalles: (newItem.detalles || []).map((d: any) => ({
              insumoProveedorId: d.id_insumo || d.idInsumo || d.insumoProveedorId,
              cantidadInsumo: d.cantidad_insumo || d.cantidadInsumo || 0,
              precioUnitario: d.costo_unitario || (d.costo_subtotal && d.cantidad_insumo ? d.costo_subtotal / d.cantidad_insumo : 0) || 0
            }))
          };
          this.pedidosService.update(oldItem.id_pedido, payload).subscribe({
            next: (updated) => {
              const idx = this.pedidosDataSource.data.findIndex(p => p.id_pedido === oldItem.id_pedido);
              if (idx !== -1) {
                // mapear respuesta como en create
                const mapped = {
                  id_pedido: updated.id,
                  nombre: updated.nombre,
                  descripcion: updated.descripcion || '',
                  nombre_proveedor: updated?.detalles?.length ? (updated.detalles[0].insumo?.nombre_proveedor || '') : '',
                  id_proveedor: updated?.detalles?.length ? (updated.detalles[0].insumo?.idProveedor || 0) : 0,
                  costo_total: updated.costoTotal || 0,
                  fecha_pedido: updated.fechaPedido ? new Date(updated.fechaPedido) : new Date(),
                  fecha_entrega_estimada: undefined,
                  es_pagable: !!updated.pago,
                  estado: (updated.estado as any) || 'pendiente',
                  detalles: (updated.detalles || []).map(d => ({
                    id_detalle: d.id,
                    id_insumo: d.insumo?.id || 0,
                    id_pedido: updated.id,
                    nombre_insumo: d.insumo?.nombre || '',
                    cantidad_insumo: d.cantidadInsumo,
                    costo_unitario: (d.costoSubtotal && d.cantidadInsumo) ? (d.costoSubtotal / d.cantidadInsumo) : 0,
                    costo_subtotal: d.costoSubtotal,
                    es_devuelto: !!d.esDevuelto
                  }))
                } as PedidoInsumo;
                this.pedidosDataSource.data[idx] = mapped;
                this.pedidosDataSource.data = [...this.pedidosDataSource.data];
              }
            },
            error: (err) => {
              console.warn('Error actualizando pedido en API, fallback local', err);
              const pedidoIndex = this.pedidosDataSource.data.findIndex(p => p.id_pedido === oldItem.id_pedido);
              if (pedidoIndex !== -1) {
                const proveedor = this.proveedoresDataSource.data.find(p => p.id_proveedor == newItem.id_proveedor);
                this.pedidosDataSource.data[pedidoIndex] = {
                  ...oldItem,
                  ...newItem,
                  nombre_proveedor: proveedor?.nombre || newItem.nombre_proveedor || ''
                };
                this.pedidosDataSource.data = [...this.pedidosDataSource.data];
              }
            }
          });
        } catch (e) {
          console.warn('Exception al actualizar pedido, fallback local', e);
        }
      break;

      case 'insumo-proveedor':
        // actualizar insumo-proveedor en backend
        this.insumosProveedorService.update(oldItem.id_insumo, {
          nombre: newItem.nombre,
          descripcion: newItem.descripcion,
          costoUnitario: newItem.costo_unitario || newItem.costoUnitario,
          fechaVencimiento: newItem.fecha_vencimiento ? (newItem.fecha_vencimiento instanceof Date ? newItem.fecha_vencimiento.toISOString() : newItem.fecha_vencimiento) : undefined,
          cantidadDisponible: newItem.cantidad_disponible || newItem.cantidadDisponible,
          idProveedor: newItem.id_proveedor || newItem.idProveedor
        }).subscribe({
          next: (updated) => {
            const idx = this.insumosProveedorDataSource.data.findIndex(ip => ip.id_insumo === oldItem.id_insumo);
            if (idx !== -1) {
              this.insumosProveedorDataSource.data[idx] = {
                id_insumo: updated.id,
                nombre: updated.nombre,
                descripcion: updated.descripcion,
                costo_unitario: updated.costoUnitario,
                fecha_vencimiento: updated.fechaVencimiento ? new Date(updated.fechaVencimiento) : new Date(),
                cantidad_disponible: updated.cantidadDisponible,
                nombre_proveedor: this.proveedoresDataSource.data.find(p => p.id_proveedor === updated.idProveedor)?.nombre || '',
                id_proveedor: updated.idProveedor
              };
              this.insumosProveedorDataSource.data = [...this.insumosProveedorDataSource.data];
            }
          },
          error: (err) => {
            console.warn('Error actualizando insumo-proveedor en API, fallback local', err);
            const insumoProveedorIndex = this.insumosProveedorDataSource.data.findIndex(ip => ip.id_insumo === oldItem.id_insumo);
            if (insumoProveedorIndex !== -1) {
              const proveedor = this.proveedoresDataSource.data.find(p => p.id_proveedor == newItem.id_proveedor);
              this.insumosProveedorDataSource.data[insumoProveedorIndex] = {
                ...oldItem,
                ...newItem,
                nombre_proveedor: proveedor?.nombre || ''
              };
              this.insumosProveedorDataSource.data = [...this.insumosProveedorDataSource.data];
            }
          }
        });
        break;

      case 'detalle':
        this.snackBar.open(`Funcionalidad de edición de detalle en desarrollo`, 'Cerrar', {
          duration: 3000,
          panelClass: 'snackbar-warning'
        });
        return;
    }

  this.snackBar.open(`${this.getTypeName(type)} actualizado exitosamente`, 'Cerrar', {
    duration: 3000,
    panelClass: 'snackbar-success'
  });
}

  deleteItem(type: DialogType, item: any): void {
    if (confirm('¿Está seguro de eliminar este elemento?')) {
      switch (type) {
        case 'proveedor':
            // Borrar en backend
            this.proveedoresService.delete(item.id_proveedor).subscribe({
              next: () => {
                this.proveedoresDataSource.data = this.proveedoresDataSource.data.filter(p => p.id_proveedor !== item.id_proveedor);
              },
              error: (err) => {
                console.warn('Error al eliminar proveedor en API, fallback local', err);
                this.proveedoresDataSource.data = this.proveedoresDataSource.data.filter(p => p.id_proveedor !== item.id_proveedor);
              }
            });
            break;
        case 'insumo':
          // Intentar borrar en backend
          this.insumosService.delete(item.id_insumo).subscribe({
            next: () => {
              this.insumosDataSource.data = this.insumosDataSource.data.filter(i => i.id_insumo !== item.id_insumo);
              this.snackBar.open('Insumo eliminado correctamente', 'Cerrar', { duration: 3000, panelClass: 'snackbar-success' });
            },
            error: (err) => {
              console.warn('Error eliminando insumo en API, fallback local', err);
              this.insumosDataSource.data = this.insumosDataSource.data.filter(i => i.id_insumo !== item.id_insumo);
              this.snackBar.open('Insumo eliminado (modo offline)', 'Cerrar', { duration: 3000, panelClass: 'snackbar-warning' });
            }
          });
          break;
        case 'producto':
          this.productosDataSource.data = this.productosDataSource.data.filter(p => p.id_producto !== item.id_producto);
          break;
        case 'receta':
          this.recetasDataSource.data = this.recetasDataSource.data.filter(r => r.id_receta !== item.id_receta);
          break;
        case 'reporte':
          this.reportesDataSource.data = this.reportesDataSource.data.filter(r => r.id_devolucion !== item.id_devolucion);
          break;
        case 'insumo-proveedor':
          // intentar borrar desde API
          this.insumosProveedorService.delete(item.id_insumo).subscribe({
            next: () => {
              this.insumosProveedorDataSource.data = this.insumosProveedorDataSource.data.filter(ip => ip.id_insumo !== item.id_insumo);
            },
            error: (err) => {
              console.warn('Error eliminando insumo-proveedor en API, fallback local', err);
              this.insumosProveedorDataSource.data = this.insumosProveedorDataSource.data.filter(ip => ip.id_insumo !== item.id_insumo);
            }
          });
          break;
        case 'pedido':
          // intentar borrar en backend
          this.pedidosService.delete(item.id_pedido).subscribe({
            next: () => {
              this.pedidosDataSource.data = this.pedidosDataSource.data.filter(p => p.id_pedido !== item.id_pedido);
            },
            error: (err) => {
              console.warn('Error eliminando pedido en API, fallback local', err);
              this.pedidosDataSource.data = this.pedidosDataSource.data.filter(p => p.id_pedido !== item.id_pedido);
            }
          });
          break;
        case 'detalle':
          this.detallesDataSource.data = this.detallesDataSource.data.filter(d => d.id_detalle !== item.id_detalle);
          break;
      }

      this.snackBar.open(`${this.getTypeName(type)} eliminado exitosamente`, 'Cerrar', {
        duration: 3000,
        panelClass: 'snackbar-success'
      });
    }
  }


  getCantidadItemsPedido(pedido: PedidoInsumo): number {
  return pedido.detalles?.length || 0;
}

getEstadoPedidoColor(estado: string): string {
  const colores: Record<string, string> = {
    'pendiente': 'warn',
    'en_proceso': 'accent',
    'recibido': 'primary',
    'cancelado': 'warn'
  };
  return colores[estado] || 'basic';
}

  private getTypeName(type: DialogType): string {
    const names: Record<DialogType, string> = {
      'proveedor': 'Proveedor',
      'insumo': 'Insumo',
      'producto': 'Producto',
      'receta': 'Receta',
      'reporte': 'Reporte',
      'insumo-proveedor': 'Insumo-Proveedor',
      'pedido': 'Pedido',
      'detalle': 'Detalle'
    };
    return names[type] || type;
  }

  /**
   * Obtiene la hora de la última actualización
   */
  getLastUpdateTime(): string {
    return new Date().toLocaleTimeString('es-ES');
  }

  // Devuelve la vida útil en días para mostrar en la tabla de productos.
  // Prioriza campos explícitos, si no existe calcula a partir de una fecha de vencimiento si está disponible.
  formatVidaUtil(item: any): string {
    const direct = item?.vida_util_dias ?? item?.vidaUtilDias ?? item?.vida_util ?? item?.vidaUtil;
    if (direct !== null && direct !== undefined && direct !== '') {
      return String(direct);
    }

    const fecha = item?.fecha_vencimiento ?? item?.fechaVencimiento ?? item?.fecha_vencimiento_iso ?? item?.fechaVencimientoIso ?? null;
    if (fecha) {
      const fechaDate = new Date(fecha);
      if (!isNaN(fechaDate.getTime())) {
        const msPerDay = 1000 * 60 * 60 * 24;
        const diff = Math.ceil((fechaDate.getTime() - new Date().getTime()) / msPerDay);
        return String(diff >= 0 ? diff : 0);
      }
    }

    return '-';
  }

  /**
   * Cierra la sesión del usuario
   */
  logout(): void {
    this.notifications.showConfirm(
      '¿Está seguro de que desea cerrar sesión?',
      () => {
        // Usuario confirmó
        this.authService.logout();
        this.snackBar.open('Cerrando sesión...', 'Cerrar', {
          duration: 2000,
          panelClass: 'snackbar-success'
        });
        setTimeout(() => {
          this.router.navigate(['/auth/worker/login']);
        }, 500);
      },
      () => {
        // Usuario canceló (no hacer nada)
      }
    );
  }
}
