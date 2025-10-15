import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';

interface Producto {
  id_producto: number;
  nombre: string;
}

interface Insumo {
  id_insumo: number;
  nombre: string;
}

interface DialogData {
  item?: any;
  isEdit: boolean;
  type: string;
  productos: Producto[];
  insumos: Insumo[];
}

@Component({
  selector: 'app-receta-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDialogModule,
    MatSelectModule
  ],
  template: `
    <h2 mat-dialog-title class="dialog-title">{{ data.isEdit ? 'Editar' : 'Agregar' }} Receta</h2>
    <mat-dialog-content>
      <form [formGroup]="form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Nombre</mat-label>
          <input matInput formControlName="nombre" required>
          <mat-error *ngIf="form.get('nombre')?.hasError('required')">
            El nombre es requerido
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Descripción</mat-label>
          <textarea matInput formControlName="descripcion" rows="3" required></textarea>
          <mat-error *ngIf="form.get('descripcion')?.hasError('required')">
            La descripción es requerida
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Producto</mat-label>
          <mat-select formControlName="id_producto" required>
            <mat-option value="">Seleccione un producto</mat-option>
            <mat-option *ngFor="let producto of productos" [value]="producto.id_producto">
              {{ producto.nombre }}
            </mat-option>
          </mat-select>
          <mat-error *ngIf="form.get('id_producto')?.hasError('required')">
            Debe seleccionar un producto
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Insumo</mat-label>
          <mat-select formControlName="id_insumo" required>
            <mat-option value="">Seleccione un insumo</mat-option>
            <mat-option *ngFor="let insumo of insumos" [value]="insumo.id_insumo">
              {{ insumo.nombre }}
            </mat-option>
          </mat-select>
          <mat-error *ngIf="form.get('id_insumo')?.hasError('required')">
            Debe seleccionar un insumo
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Cantidad de Insumo (gramos)</mat-label>
          <input matInput type="number" formControlName="cantidad_insumo" required min="1">
          <mat-error *ngIf="form.get('cantidad_insumo')?.hasError('required')">
            La cantidad es requerida
          </mat-error>
          <mat-error *ngIf="form.get('cantidad_insumo')?.hasError('min')">
            La cantidad debe ser mayor a 0
          </mat-error>
        </mat-form-field>
      </form>

      <!-- Debug info (remover en producción) -->
      <div class="debug-info" style="margin-top: 1rem; padding: 0.5rem; background: #f5f5f5; border-radius: 4px; font-size: 12px;">
        <strong>Debug:</strong><br>
        Productos disponibles: {{ productos.length || 0 }}<br>
        Insumos disponibles: {{ insumos.length || 0 }}
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancelar</button>
      <button mat-raised-button color="primary" (click)="onSave()" [disabled]="!form.valid">
        {{ data.isEdit ? 'Actualizar' : 'Guardar' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width {
      width: 100%;
      margin-bottom: 1rem;
    }
    .dialog-title {
      margin-bottom: 1rem;
      color: #2c3e50;
    }
    .debug-info {
      color: #666;
      border: 1px solid #ddd;
    }
    mat-dialog-content {
      max-height: 70vh;
      overflow-y: auto;
    }
  `]
})
export class RecetaDialogComponent implements OnInit {
  form: FormGroup;
  productos: Producto[] = [];
  insumos: Insumo[] = [];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<RecetaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    this.form = this.fb.group({
      nombre: [data.item?.nombre || '', Validators.required],
      descripcion: [data.item?.descripcion || '', Validators.required],
      id_producto: [data.item?.id_producto || '', Validators.required],
      id_insumo: [data.item?.id_insumo || '', Validators.required],
      cantidad_insumo: [data.item?.cantidad_insumo || '', [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit(): void {
    // Asignar los datos recibidos
    this.productos = this.data.productos || [];
    this.insumos = this.data.insumos || [];

    console.log('Productos recibidos:', this.productos);
    console.log('Insumos recibidos:', this.insumos);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.form.valid) {
      const formValue = this.form.value;
      console.log('Guardando receta:', formValue);
      this.dialogRef.close(formValue);
    }
  }
}
