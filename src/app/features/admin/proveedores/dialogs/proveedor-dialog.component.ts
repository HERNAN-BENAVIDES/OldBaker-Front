import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-proveedor-dialog',
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
    <h2 mat-dialog-title class="dialog-title">{{ data.isEdit ? 'Editar' : 'Agregar' }} Proveedor</h2>
    <mat-dialog-content>
      <form [formGroup]="form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Nombre</mat-label>
          <input matInput formControlName="nombre" required>
        </mat-form-field>
        
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Teléfono</mat-label>
          <input matInput formControlName="telefono" required>
        </mat-form-field>
        
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Email</mat-label>
          <input matInput formControlName="email" type="email" required>
        </mat-form-field>
        
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Número de Cuenta</mat-label>
          <input matInput formControlName="numero_cuenta" required>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancelar</button>
      <button mat-raised-button color="primary" class="save-btn" (click)="onSave()" [disabled]="!form.valid">
        {{ data.isEdit ? 'Actualizar' : 'Guardar' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width { width: 100%; margin-bottom: 1rem; }
    .dialog-title { margin-bottom: 1rem; }
  `]
})
export class ProveedorDialogComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ProveedorDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.form = this.fb.group({
      nombre: [data.item?.nombre || '', Validators.required],
      telefono: [data.item?.telefono || '', Validators.required],
      email: [data.item?.email || '', [Validators.required, Validators.email]],
      numero_cuenta: [data.item?.numero_cuenta || '', Validators.required]
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