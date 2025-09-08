import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

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
    MatNativeDateModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data.isEdit ? 'Editar' : 'Agregar' }} Insumo por Proveedor</h2>
    <mat-dialog-content>
      <form [formGroup]="form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Insumo</mat-label>
          <mat-select formControlName="id_insumo" required>
            <mat-option *ngFor="let insumo of data.insumos" [value]="insumo.id_insumo">
              {{ insumo.nombre }}
            </mat-option>
          </mat-select>
        </mat-form-field>
        
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Proveedor</mat-label>
          <mat-select formControlName="id_proveedor" required>
            <mat-option *ngFor="let proveedor of data.proveedores" [value]="proveedor.id_proveedor">
              {{ proveedor.nombre }}
            </mat-option>
          </mat-select>
        </mat-form-field>
        
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Cantidad Disponible</mat-label>
          <input matInput type="number" formControlName="cantidad_disponible" required>
        </mat-form-field>
        
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Fecha de Vencimiento</mat-label>
          <input matInput [matDatepicker]="picker" formControlName="fecha_vencimiento" required>
          <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
          <mat-datepicker #picker></mat-datepicker>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancelar</button>
      <button mat-raised-button color="primary" (click)="onSave()" [disabled]="!form.valid">
        {{ data.isEdit ? 'Actualizar' : 'Guardar' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`.full-width { width: 100%; margin-bottom: 1rem; }`]
})
export class InsumoProveedorDialogComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<InsumoProveedorDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.form = this.fb.group({
      id_insumo: [data.item?.id_insumo || '', Validators.required],
      id_proveedor: [data.item?.id_proveedor || '', Validators.required],
      cantidad_disponible: [data.item?.cantidad_disponible || '', [Validators.required, Validators.min(0)]],
      fecha_vencimiento: [data.item?.fecha_vencimiento || '', Validators.required]
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }
}