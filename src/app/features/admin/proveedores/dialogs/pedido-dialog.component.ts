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

interface Proveedor {
  id_proveedor: number;
  nombre: string;
}

interface InsumoProveedor {
  id_insumo: number;
  nombre: string;
  descripcion: string;
  costo_unitario: number;
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
    MatCardModule
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
  
  selectedInsumoId: number | null = null;
  cantidadInsumo: number = 1;
  costoTotal: number = 0;

  detalleColumns = ['nombre', 'cantidad', 'costo_unitario', 'subtotal', 'acciones'];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<PedidoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    this.form = this.fb.group({
      nombre: [data.item?.nombre || '', Validators.required],
      descripcion: [data.item?.descripcion || '', Validators.required],
      id_proveedor: [data.item?.id_proveedor || '', Validators.required],
      es_pagable: [data.item?.es_pagable || true]
    });
  }

  ngOnInit(): void {
    this.proveedores = this.data.proveedores || [];
    this.insumosProveedor = this.data.insumosProveedor || [];
    
    if (this.data.isEdit && this.data.item?.detalles) {
      this.detallesPedido = [...this.data.item.detalles];
      this.calcularTotal();
    }
  }

  onProveedorChange(): void {
    const proveedorId = this.form.get('id_proveedor')?.value;
    if (proveedorId) {
      this.insumosDisponibles = this.insumosProveedor.filter(
        insumo => insumo.id_proveedor === proveedorId
      );
    } else {
      this.insumosDisponibles = [];
    }
    this.selectedInsumoId = null;
  }

  agregarInsumoAPedido(): void {
    if (!this.selectedInsumoId || !this.cantidadInsumo || this.cantidadInsumo <= 0) {
      return;
    }

    const insumo = this.insumosDisponibles.find(i => i.id_insumo === this.selectedInsumoId);
    if (!insumo) return;

    const existeIndex = this.detallesPedido.findIndex(d => d.id_insumo === this.selectedInsumoId);
    
    if (existeIndex >= 0) {
      this.detallesPedido[existeIndex].cantidad_insumo += this.cantidadInsumo;
      this.actualizarSubtotal(existeIndex);
    } else {
      const nuevoDetalle: DetallePedidoForm = {
        id_insumo: insumo.id_insumo,
        nombre_insumo: insumo.nombre,
        cantidad_insumo: this.cantidadInsumo,
        costo_unitario: insumo.costo_unitario,
        costo_subtotal: insumo.costo_unitario * this.cantidadInsumo
      };
      
      this.detallesPedido.push(nuevoDetalle);
    }

    this.selectedInsumoId = null;
    this.cantidadInsumo = 1;
    this.calcularTotal();
  }

  actualizarSubtotal(index: number): void {
    const detalle = this.detallesPedido[index];
    detalle.costo_subtotal = detalle.costo_unitario * detalle.cantidad_insumo;
    this.calcularTotal();
  }

  eliminarInsumo(index: number): void {
    this.detallesPedido.splice(index, 1);
    this.calcularTotal();
  }

  calcularTotal(): void {
    this.costoTotal = this.detallesPedido.reduce(
      (total, detalle) => total + detalle.costo_subtotal, 
      0
    );
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.form.valid && this.detallesPedido.length > 0) {
      const pedidoData = {
        ...this.form.value,
        costo_total: this.costoTotal,
        fecha_pedido: new Date(),
        detalles: this.detallesPedido.map(detalle => ({
          id_insumo: detalle.id_insumo,
          cantidad_insumo: detalle.cantidad_insumo,
          costo_subtotal: detalle.costo_subtotal,
          es_devuelto: false
        }))
      };
      
      console.log('Guardando pedido:', pedidoData);
      this.dialogRef.close(pedidoData);
    }
  }
}