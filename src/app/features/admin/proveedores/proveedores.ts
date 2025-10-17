import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
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
import { MatMenuModule } from '@angular/material/menu';
import { Router } from '@angular/router';
import { NotificationService } from '../../../shared/notification/notification.service';

// Importar diálogos (los crearemos por separado)
import { ProveedorDialogComponent } from './dialogs/proveedor-dialog.component';
import { InsumoDialogComponent } from './dialogs/insumo-dialog.component';
import { ProductoDialogComponent } from './dialogs/producto-dialog.component';
import { RecetaDialogComponent } from './dialogs/receta-dialog.component';
// import { PedidoDialogComponent } from './dialogs/pedido-dialog.component';
import { ReporteDialogComponent } from './dialogs/reporte-dialog.component';
import { InsumoProveedorDialogComponent } from './dialogs/insumo-proveedor-dialog.component';

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
export class AdminProveedoresComponent implements OnInit, OnDestroy {

  activeModule = 'dashboard';

  // Data Sources para las tablas
  detallesPedidosDataSource = new MatTableDataSource<PedidoDetalle>([]);
  proveedoresDataSource = new MatTableDataSource<Proveedor>([]);
  insumosProveedorDataSource = new MatTableDataSource<InsumoProveedor>([]);
  pedidosDataSource = new MatTableDataSource<PedidoInsumo>([]);
  detallesDataSource = new MatTableDataSource<DetallePedido>([]);
  reportesDataSource = new MatTableDataSource<Reporte>([]);
  recetasDataSource = new MatTableDataSource<Receta>([]);
  insumosDataSource = new MatTableDataSource<Insumo>([]);
  productosDataSource = new MatTableDataSource<Producto>([]);

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
  productosColumns: string[] = ['id_producto', 'nombre', 'descripcion', 'costo_unitario', 'fecha_vencimiento', 'categoria', 'acciones'];

  // Usuario actual
  userName: string = 'Administrador';

  constructor(
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private authService: AuthService,
    private router: Router,
    private notifications: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadUserInfo();
    this.loadAllData();
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

  setActiveModule(module: string): void {
    this.activeModule = module;
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
}

  private loadProveedores(): void {
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
    this.proveedoresDataSource.data = mockData;
  }

  private loadInsumos(): void {
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
    this.insumosDataSource.data = mockData;
  }

  private loadProductos(): void {
    const mockData: Producto[] = [
      {
        id_producto: 1,
        nombre: 'Pan Artesanal',
        descripcion: 'Pan artesanal tradicional',
        costo_unitario: 5000,
        fecha_vencimiento: new Date('2024-03-15'),
        categoria: 'Panadería'
      },
      {
        id_producto: 2,
        nombre: 'Torta de Chocolate',
        descripcion: 'Torta de chocolate con cobertura',
        costo_unitario: 25000,
        fecha_vencimiento: new Date('2024-03-10'),
        categoria: 'Repostería'
      }
    ];
    this.productosDataSource.data = mockData;
  }

  private loadInsumosProveedor(): void {
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
    this.insumosProveedorDataSource.data = mockData;
  }

  private loadPedidos(): void {
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
  this.pedidosDataSource.data = mockData;
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
    this.detallesDataSource.data = mockData;
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
    this.reportesDataSource.data = mockData;
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
    this.recetasDataSource.data = mockData;
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
        const newProveedorId = Math.max(...this.proveedoresDataSource.data.map(p => p.id_proveedor), 0) + 1;
        const newProveedor = { ...item, id_proveedor: newProveedorId };
        this.proveedoresDataSource.data = [...this.proveedoresDataSource.data, newProveedor];
        break;

      case 'insumo':
        const newInsumoId = Math.max(...this.insumosDataSource.data.map(i => i.id_insumo), 0) + 1;
        const newInsumo = { ...item, id_insumo: newInsumoId };
        this.insumosDataSource.data = [...this.insumosDataSource.data, newInsumo];
        break;

      case 'producto':
        const newProductoId = Math.max(...this.productosDataSource.data.map(p => p.id_producto), 0) + 1;
        const newProducto = { ...item, id_producto: newProductoId };
        this.productosDataSource.data = [...this.productosDataSource.data, newProducto];
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
        const newPedidoId = Math.max(...this.pedidosDataSource.data.map(p => p.id_pedido), 0) + 1;
        const proveedor = this.proveedoresDataSource.data.find(p => p.id_proveedor == item.id_proveedor);
        const newPedido = {
          ...item,
          id_pedido: newPedidoId,
          nombre_proveedor: proveedor?.nombre || item.nombre_proveedor || '',
          estado: item.estado || 'pendiente'
      };
      this.pedidosDataSource.data = [...this.pedidosDataSource.data, newPedido];
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
        const proveedorIndex = this.proveedoresDataSource.data.findIndex(p => p.id_proveedor === oldItem.id_proveedor);
        if (proveedorIndex !== -1) {
          this.proveedoresDataSource.data[proveedorIndex] = { ...oldItem, ...newItem };
          this.proveedoresDataSource.data = [...this.proveedoresDataSource.data];
        }
        break;

      case 'insumo':
        const insumoIndex = this.insumosDataSource.data.findIndex(i => i.id_insumo === oldItem.id_insumo);
        if (insumoIndex !== -1) {
          this.insumosDataSource.data[insumoIndex] = { ...oldItem, ...newItem };
          this.insumosDataSource.data = [...this.insumosDataSource.data];
        }
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
      break;

      case 'insumo-proveedor':
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
          this.proveedoresDataSource.data = this.proveedoresDataSource.data.filter(p => p.id_proveedor !== item.id_proveedor);
          break;
        case 'insumo':
          this.insumosDataSource.data = this.insumosDataSource.data.filter(i => i.id_insumo !== item.id_insumo);
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
          this.insumosProveedorDataSource.data = this.insumosProveedorDataSource.data.filter(ip => ip.id_insumo !== item.id_insumo);
          break;
        case 'pedido':
          this.pedidosDataSource.data = this.pedidosDataSource.data.filter(p => p.id_pedido !== item.id_pedido);
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
