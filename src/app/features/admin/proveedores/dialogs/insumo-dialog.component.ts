import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-insumo-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDialogModule
  ],
  template: `
    <h2 mat-dialog-title class="dialog-title">{{ data.isEdit ? 'Editar' : 'Agregar' }} Insumo</h2>
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
          <mat-label>Cantidad Actual</mat-label>
          <input matInput type="number" formControlName="cantidad_actual" required>
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
export class InsumoDialogComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<InsumoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.form = this.fb.group({
      nombre: [data.item?.nombre || '', Validators.required],
      descripcion: [data.item?.descripcion || '', Validators.required],
      costo_unitario: [data.item?.costo_unitario || '', [Validators.required, Validators.min(0)]],
      cantidad_actual: [data.item?.cantidad_actual || '', [Validators.required, Validators.min(0)]]
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