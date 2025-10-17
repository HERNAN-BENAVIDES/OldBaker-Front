import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';

interface Insumo {
  id_insumo: number;
  nombre: string;
  descripcion: string;
  costo_unitario: number;
}

interface Proveedor {
  id_proveedor: number;
  nombre: string;
  telefono: string;
  email: string;
}

interface InsumoProveedor {
  id_insumo: number;
  id_proveedor: number;
  nombre: string;
  descripcion: string;
  costo_unitario: number;
  cantidad_disponible: number;
  fecha_vencimiento: Date;
  nombre_proveedor: string;
}

interface DialogData {
  item: InsumoProveedor | null;
  isEdit: boolean;
  insumos: Insumo[];
  proveedores: Proveedor[];
  insumosProveedorExistentes: InsumoProveedor[];
}

@Component({
  selector: 'app-insumo-proveedor-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDialogModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatCardModule,
    MatDividerModule,
    MatChipsModule
  ],
  templateUrl: './insumo-proveedor-dialog.component.html',
  styleUrls: ['./insumo-proveedor-dialog.component.css']
})
export class InsumoProveedorDialogComponent implements OnInit {
  form: FormGroup;
  insumoSeleccionado: Insumo | null = null;
  proveedorSeleccionado: Proveedor | null = null;
  precioBase: number = 0;
  diasHastaVencimiento: number = 0;
  alertaVencimiento: boolean = false;
  alertaStockBajo: boolean = false;
  existeCombinacion: boolean = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<InsumoProveedorDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    this.form = this.fb.group({
      id_insumo: [data.item?.id_insumo || '', Validators.required],
      nombre: [data.item?.nombre || ''],
      descripcion: [data.item?.descripcion || ''],
      id_proveedor: [data.item?.id_proveedor || '', Validators.required],
      nombre_proveedor: [data.item?.nombre_proveedor || ''],
      costo_unitario: [data.item?.costo_unitario || '', [Validators.required, Validators.min(0)]],
      cantidad_disponible: [data.item?.cantidad_disponible || '', [Validators.required, Validators.min(0)]],
      fecha_vencimiento: [data.item?.fecha_vencimiento || '', Validators.required]
    });
  }

  ngOnInit(): void {
    // Si estamos editando, cargar la información inicial
    if (this.data.isEdit && this.data.item) {
      this.onInsumoChange(this.data.item.id_insumo);
      this.onProveedorChange(this.data.item.id_proveedor);
      this.calcularDiasVencimiento();
      this.verificarAlertas();
    }

    // Escuchar cambios en la fecha para calcular días
    this.form.get('fecha_vencimiento')?.valueChanges.subscribe(() => {
      this.calcularDiasVencimiento();
      this.verificarAlertas();
    });

    // Escuchar cambios en cantidad para alertas
    this.form.get('cantidad_disponible')?.valueChanges.subscribe(() => {
      this.verificarAlertas();
    });

    // Validar combinación única al cambiar insumo o proveedor
    this.form.get('id_insumo')?.valueChanges.subscribe(() => {
      this.validarCombinacionUnica();
    });

    this.form.get('id_proveedor')?.valueChanges.subscribe(() => {
      this.validarCombinacionUnica();
    });
  }

  onInsumoChange(insumoId: number): void {
    this.insumoSeleccionado = this.data.insumos.find(i => i.id_insumo === insumoId) || null;
    
    if (this.insumoSeleccionado) {
      this.precioBase = this.insumoSeleccionado.costo_unitario;
      this.form.patchValue({
        nombre: this.insumoSeleccionado.nombre,
        descripcion: this.insumoSeleccionado.descripcion,
        costo_unitario: this.insumoSeleccionado.costo_unitario
      });
    }

    this.validarCombinacionUnica();
  }

  onProveedorChange(proveedorId: number): void {
    this.proveedorSeleccionado = this.data.proveedores.find(p => p.id_proveedor === proveedorId) || null;
    
    if (this.proveedorSeleccionado) {
      this.form.patchValue({
        nombre_proveedor: this.proveedorSeleccionado.nombre
      });
    }

    this.validarCombinacionUnica();
  }

  validarCombinacionUnica(): void {
    const insumoId = this.form.get('id_insumo')?.value;
    const proveedorId = this.form.get('id_proveedor')?.value;

    if (!insumoId || !proveedorId) {
      this.existeCombinacion = false;
      return;
    }

    // Si estamos editando, permitir la misma combinación
    if (this.data.isEdit && this.data.item) {
      if (this.data.item.id_insumo === insumoId && this.data.item.id_proveedor === proveedorId) {
        this.existeCombinacion = false;
        return;
      }
    }

    // Verificar si ya existe esta combinación
    this.existeCombinacion = this.data.insumosProveedorExistentes.some(
      ip => ip.id_insumo === insumoId && ip.id_proveedor === proveedorId
    );
  }

  calcularDiasVencimiento(): void {
    const fechaVencimiento = this.form.get('fecha_vencimiento')?.value;
    
    if (fechaVencimiento) {
      const hoy = new Date();
      const vencimiento = new Date(fechaVencimiento);
      const diferencia = vencimiento.getTime() - hoy.getTime();
      this.diasHastaVencimiento = Math.ceil(diferencia / (1000 * 60 * 60 * 24));
    }
  }

  verificarAlertas(): void {
    // Alerta de vencimiento (menos de 30 días)
    this.alertaVencimiento = this.diasHastaVencimiento > 0 && this.diasHastaVencimiento <= 30;
    
    // Alerta de stock bajo (menos de 20 unidades)
    const cantidad = this.form.get('cantidad_disponible')?.value || 0;
    this.alertaStockBajo = cantidad > 0 && cantidad < 20;
  }

  getDiferenciaPrecio(): number {
    const precioActual = this.form.get('costo_unitario')?.value || 0;
    return precioActual - this.precioBase;
  }

  getPorcentajeDiferencia(): number {
    if (this.precioBase === 0) return 0;
    const diferencia = this.getDiferenciaPrecio();
    return (diferencia / this.precioBase) * 100;
  }

  getColorDiferencia(): string {
    const diferencia = this.getDiferenciaPrecio();
    if (diferencia > 0) return 'warn'; // Más caro
    if (diferencia < 0) return 'accent'; // Más barato
    return 'primary'; // Igual
  }

  getAlertaVencimientoTexto(): string {
    if (this.diasHastaVencimiento <= 0) return 'Vencido';
    if (this.diasHastaVencimiento <= 7) return `¡Vence en ${this.diasHastaVencimiento} días!`;
    if (this.diasHastaVencimiento <= 30) return `Vence en ${this.diasHastaVencimiento} días`;
    return `${this.diasHastaVencimiento} días hasta vencimiento`;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.form.valid && !this.existeCombinacion) {
      const formData = this.form.value;
      
      // Asegurarnos de que los datos de relación estén completos
      const insumo = this.data.insumos.find(i => i.id_insumo === formData.id_insumo);
      const proveedor = this.data.proveedores.find(p => p.id_proveedor === formData.id_proveedor);
      
      const resultado = {
        ...formData,
        nombre: insumo?.nombre || formData.nombre,
        descripcion: insumo?.descripcion || formData.descripcion,
        nombre_proveedor: proveedor?.nombre || formData.nombre_proveedor
      };
      
      this.dialogRef.close(resultado);
    }
  }
}