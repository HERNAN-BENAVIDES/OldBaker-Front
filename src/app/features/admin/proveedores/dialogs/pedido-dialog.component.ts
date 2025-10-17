import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';

interface Proveedor {
  id_proveedor: number;
  nombre: string;
  telefono?: string;
  email?: string;
}

interface InsumoProveedor {
  id_insumo: number;
  nombre: string;
  descripcion: string;
  costo_unitario: number;
  cantidad_disponible: number;
  id_proveedor: number;
  nombre_proveedor: string;
}

interface DetallePedidoForm {
  id_insumo: number;
  nombre_insumo: string;
  cantidad_insumo: number;
  costo_unitario: number;
  costo_subtotal: number;
}

interface DialogData {
  item?: any;
  isEdit: boolean;
  type: string;
  proveedores: Proveedor[];
  insumosProveedor: InsumoProveedor[];
}

@Component({
  selector: 'app-pedido-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDialogModule,
    MatSelectModule,
    MatIconModule,
    MatCheckboxModule,
    MatTableModule,
    MatCardModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatChipsModule,
    MatDividerModule,
    MatTooltipModule
  ],
  templateUrl: './pedido-dialog.component.html',
  styleUrls: ['./pedido-dialog.component.css']
})
export class PedidoDialogComponent implements OnInit {
  form: FormGroup;
  proveedores: Proveedor[] = [];
  insumosProveedor: InsumoProveedor[] = [];
  insumosDisponibles: InsumoProveedor[] = [];
  detallesPedido: DetallePedidoForm[] = [];
  
  proveedorSeleccionado: Proveedor | null = null;
  selectedInsumoId: number | null = null;
  cantidadInsumo: number = 1;
  costoTotal: number = 0;
  
  // Alertas
  alertaSinInsumos: boolean = false;
  alertaStockInsuficiente: boolean = false;
  insumosConStockBajo: string[] = [];

  detalleColumns = ['nombre', 'cantidad', 'costo_unitario', 'subtotal', 'acciones'];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<PedidoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    // Fecha mínima: hoy
    const hoy = new Date();
    const fechaEntregaMinima = new Date(hoy);
    fechaEntregaMinima.setDate(hoy.getDate() + 1); // Mínimo mañana

    this.form = this.fb.group({
      nombre: [data.item?.nombre || '', Validators.required],
      descripcion: [data.item?.descripcion || '', Validators.required],
      id_proveedor: [data.item?.id_proveedor || '', Validators.required],
      fecha_pedido: [data.item?.fecha_pedido || hoy, Validators.required],
      fecha_entrega_estimada: [data.item?.fecha_entrega_estimada || fechaEntregaMinima, Validators.required],
      es_pagable: [data.item?.es_pagable !== undefined ? data.item.es_pagable : true],
      estado: [data.item?.estado || 'pendiente']
    });
  }

  ngOnInit(): void {
    this.proveedores = this.data.proveedores || [];
    this.insumosProveedor = this.data.insumosProveedor || [];
    
    // Si estamos editando, cargar los detalles existentes
    if (this.data.isEdit && this.data.item?.detalles) {
      this.detallesPedido = [...this.data.item.detalles];
      this.calcularTotal();
      
      // Cargar proveedor si existe
      if (this.data.item.id_proveedor) {
        this.onProveedorChange(this.data.item.id_proveedor);
      }
    }
  }

  onProveedorChange(proveedorId?: number): void {
    const idProveedor = proveedorId || this.form.get('id_proveedor')?.value;
    
    if (idProveedor) {
      // Filtrar insumos del proveedor seleccionado
      this.insumosDisponibles = this.insumosProveedor.filter(
        insumo => insumo.id_proveedor === idProveedor
      );
      
      // Cargar información del proveedor
      this.proveedorSeleccionado = this.proveedores.find(p => p.id_proveedor === idProveedor) || null;
      
      // Verificar disponibilidad
      this.verificarDisponibilidad();
    } else {
      this.insumosDisponibles = [];
      this.proveedorSeleccionado = null;
    }
    
    this.selectedInsumoId = null;
    this.alertaSinInsumos = this.insumosDisponibles.length === 0;
  }

  verificarDisponibilidad(): void {
    this.insumosConStockBajo = [];
    this.alertaStockInsuficiente = false;

    this.detallesPedido.forEach(detalle => {
      const insumo = this.insumosDisponibles.find(i => i.id_insumo === detalle.id_insumo);
      if (insumo && insumo.cantidad_disponible < detalle.cantidad_insumo) {
        this.insumosConStockBajo.push(detalle.nombre_insumo);
        this.alertaStockInsuficiente = true;
      }
    });
  }

  getInsumoDisponible(insumoId: number): InsumoProveedor | undefined {
    return this.insumosDisponibles.find(i => i.id_insumo === insumoId);
  }

  agregarInsumoAPedido(): void {
    if (!this.selectedInsumoId || !this.cantidadInsumo || this.cantidadInsumo <= 0) {
      return;
    }

    const insumo = this.insumosDisponibles.find(i => i.id_insumo === this.selectedInsumoId);
    if (!insumo) return;

    // Verificar si ya existe en el pedido
    const existeIndex = this.detallesPedido.findIndex(d => d.id_insumo === this.selectedInsumoId);
    
    if (existeIndex >= 0) {
      // Si existe, sumar la cantidad
      this.detallesPedido[existeIndex].cantidad_insumo += this.cantidadInsumo;
      this.actualizarSubtotal(existeIndex);
    } else {
      // Si no existe, agregar nuevo
      const nuevoDetalle: DetallePedidoForm = {
        id_insumo: insumo.id_insumo,
        nombre_insumo: insumo.nombre,
        cantidad_insumo: this.cantidadInsumo,
        costo_unitario: insumo.costo_unitario,
        costo_subtotal: insumo.costo_unitario * this.cantidadInsumo
      };
      
      this.detallesPedido.push(nuevoDetalle);
    }

    // Limpiar selección
    this.selectedInsumoId = null;
    this.cantidadInsumo = 1;
    this.calcularTotal();
    this.verificarDisponibilidad();
  }

  actualizarSubtotal(index: number): void {
    const detalle = this.detallesPedido[index];
    detalle.costo_subtotal = detalle.costo_unitario * detalle.cantidad_insumo;
    this.calcularTotal();
    this.verificarDisponibilidad();
  }

  eliminarInsumo(index: number): void {
    this.detallesPedido.splice(index, 1);
    this.calcularTotal();
    this.verificarDisponibilidad();
  }

  calcularTotal(): void {
    this.costoTotal = this.detallesPedido.reduce(
      (total, detalle) => total + detalle.costo_subtotal, 
      0
    );
  }

  getCantidadTotalItems(): number {
    return this.detallesPedido.reduce((total, detalle) => total + detalle.cantidad_insumo, 0);
  }

  getStockDisponible(insumoId: number): number {
    const insumo = this.getInsumoDisponible(insumoId);
    return insumo?.cantidad_disponible || 0;
  }

  tieneStockSuficiente(detalle: DetallePedidoForm): boolean {
    const stock = this.getStockDisponible(detalle.id_insumo);
    return stock >= detalle.cantidad_insumo;
  }

  getMensajeValidacion(): string {
    if (this.detallesPedido.length === 0) {
      return 'Debe agregar al menos un insumo al pedido';
    }
    if (this.alertaStockInsuficiente) {
      return `Stock insuficiente para: ${this.insumosConStockBajo.join(', ')}`;
    }
    return '';
  }

  puedeGuardar(): boolean {
    return this.form.valid && 
           this.detallesPedido.length > 0 && 
           !this.alertaStockInsuficiente;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.puedeGuardar()) {
      const proveedorNombre = this.proveedores.find(p => p.id_proveedor === this.form.get('id_proveedor')?.value)?.nombre || '';
      
      const pedidoData = {
        ...this.form.value,
        nombre_proveedor: proveedorNombre,
        costo_total: this.costoTotal,
        detalles: this.detallesPedido.map(detalle => ({
          id_insumo: detalle.id_insumo,
          nombre_insumo: detalle.nombre_insumo,
          cantidad_insumo: detalle.cantidad_insumo,
          costo_unitario: detalle.costo_unitario,
          costo_subtotal: detalle.costo_subtotal,
          es_devuelto: false
        }))
      };
      
      console.log('Guardando pedido:', pedidoData);
      this.dialogRef.close(pedidoData);
    }
  }
}