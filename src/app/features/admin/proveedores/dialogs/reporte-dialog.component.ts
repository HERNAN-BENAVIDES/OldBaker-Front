import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'app-reporte-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDialogModule,
    MatSelectModule,
    MatCheckboxModule
  ],
  template: `
    <h2 mat-dialog-title class="dialog-title">{{ data.isEdit ? 'Editar' : 'Crear' }} Reporte</h2>
    <mat-dialog-content>
      <form [formGroup]="form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Detalle del Pedido</mat-label>
          <mat-select formControlName="id_detalle" required>
            <mat-option *ngFor="let detalle of data.detalles" [value]="detalle.id_detalle">
              Detalle #{{ detalle.id_detalle }} - {{ detalle.nombre_insumo }} (Pedido #{{ detalle.id_pedido }})
            </mat-option>
          </mat-select>
        </mat-form-field>
        
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Razón del Reporte</mat-label>
          <textarea matInput formControlName="razon" rows="4" required placeholder="Describa el problema o motivo del reporte..."></textarea>
        </mat-form-field>
        
        <mat-checkbox formControlName="es_devolucion" class="full-width">
          Es una devolución (marque si requiere devolución del producto)
        </mat-checkbox>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancelar</button>
      <button mat-raised-button color="primary" (click)="onSave()" [disabled]="!form.valid">
        {{ data.isEdit ? 'Actualizar' : 'Crear Reporte' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width { width: 100%; margin-bottom: 1rem; }
    .dialog-title { margin-bottom: 1rem; }
  `]
})
export class ReporteDialogComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ReporteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.form = this.fb.group({
      id_detalle: [data.item?.id_detalle || '', Validators.required],
      razon: [data.item?.razon || '', Validators.required],
      es_devolucion: [data.item?.es_devolucion || false]
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