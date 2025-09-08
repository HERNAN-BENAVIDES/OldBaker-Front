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
  selector: 'app-producto-dialog',
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
    <h2 mat-dialog-title class="dialog-title">{{ data.isEdit ? 'Editar' : 'Agregar' }} Producto</h2>
    <mat-dialog-content>
      <form [formGroup]="form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Nombre</mat-label>
          <input matInput formControlName="nombre" required>
        </mat-form-field>
        
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Descripción</mat-label>
          <textarea matInput formControlName="descripcion" rows="3" required></textarea>
        </mat-form-field>
        
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Costo Unitario</mat-label>
          <input matInput type="number" formControlName="costo_unitario" required>
        </mat-form-field>
        
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Fecha de Vencimiento</mat-label>
          <input matInput [matDatepicker]="picker" formControlName="fecha_vencimiento" required>
          <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
          <mat-datepicker #picker></mat-datepicker>
        </mat-form-field>
        
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Categoría</mat-label>
          <mat-select formControlName="categoria" required>
            <mat-option value="Panadería">Panadería</mat-option>
            <mat-option value="Repostería">Repostería</mat-option>
            <mat-option value="Dulcería">Dulcería</mat-option>
            <mat-option value="Bebidas">Bebidas</mat-option>
          </mat-select>
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
  styles: [`
    .full-width { width: 100%; margin-bottom: 1rem; }
    .dialog-title { margin-bottom: 1rem; }
  `]
})
export class ProductoDialogComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ProductoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.form = this.fb.group({
      nombre: [data.item?.nombre || '', Validators.required],
      descripcion: [data.item?.descripcion || '', Validators.required],
      costo_unitario: [data.item?.costo_unitario || '', [Validators.required, Validators.min(0)]],
      fecha_vencimiento: [data.item?.fecha_vencimiento || '', Validators.required],
      categoria: [data.item?.categoria || '', Validators.required]
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