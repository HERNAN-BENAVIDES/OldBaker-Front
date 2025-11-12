import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';

export interface DevolucionDialogData {
  pedido: any;
  detalle: any;
}

@Component({
  selector: 'app-devolucion-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule
  ],
  template: `
    <div class="dialog-header">
      <h2 mat-dialog-title>
        <mat-icon>assignment_return</mat-icon>
        Reportar Devolución de Insumo
      </h2>
      <button mat-icon-button mat-dialog-close>
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content>
      <div class="detalle-info">
        <h3>Información del Insumo</h3>
        <div class="info-grid">
          <div class="info-item">
            <label>Pedido:</label>
            <span>P#{{ data.pedido.id_pedido }} - {{ data.pedido.nombre }}</span>
          </div>
          <div class="info-item">
            <label>Insumo:</label>
            <span>{{ data.detalle.insumo.nombre }}</span>
          </div>
          <div class="info-item">
            <label>Cantidad:</label>
            <span>{{ data.detalle.cantidadInsumo }} unidades</span>
          </div>
          <div class="info-item">
            <label>Valor a devolver:</label>
            <span>\${{ data.detalle.costoSubtotal | number:'1.2-2' }}</span>
          </div>
        </div>
      </div>

      <form [formGroup]="reporteForm" class="reporte-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Razón de la devolución *</mat-label>
          <textarea 
            matInput 
            formControlName="razon" 
            placeholder="Describa el motivo de la devolución..."
            rows="4"
            maxlength="500">
          </textarea>
          <mat-hint align="end">{{ reporteForm.get('razon')?.value?.length || 0 }}/500</mat-hint>
          <mat-error *ngIf="reporteForm.get('razon')?.hasError('required')">
            La razón es obligatoria
          </mat-error>
          <mat-error *ngIf="reporteForm.get('razon')?.hasError('minlength')">
            Mínimo 10 caracteres
          </mat-error>
        </mat-form-field>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>
        <mat-icon>cancel</mat-icon>
        Cancelar
      </button>
      <button 
        mat-raised-button 
        color="warn"
        [disabled]="reporteForm.invalid"
        (click)="confirmarDevolucion()">
        <mat-icon>assignment_return</mat-icon>
        Confirmar Devolución
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: -24px -24px 20px -24px;
      padding: 20px 24px;
      background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
      color: white;
    }

    .dialog-header h2 {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0;
      font-size: 1.3rem;
      font-weight: 600;
    }

    .dialog-header button {
      color: white;
    }

    .detalle-info {
      background: #f8f9fa;
      border: 1px solid #dee2e6;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 24px;
    }

    .detalle-info h3 {
      margin: 0 0 12px 0;
      color: #2c4a9e;
      font-size: 1.1rem;
      font-weight: 600;
    }

    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .info-item label {
      font-weight: 600;
      color: #666;
      font-size: 0.9rem;
    }

    .info-item span {
      color: #333;
      font-size: 1rem;
    }

    .reporte-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .full-width {
      width: 100%;
    }

    mat-dialog-content {
      max-height: 70vh;
      overflow-y: auto;
      min-width: 500px;
    }

    mat-dialog-actions {
      padding: 16px 0 0 0;
      margin: 0;
    }

    button mat-icon {
      margin-right: 8px;
    }
  `]
})
export class DevolucionDialogComponent {
  reporteForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<DevolucionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DevolucionDialogData
  ) {
    this.reporteForm = this.fb.group({
      razon: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]]
    });
  }

  confirmarDevolucion(): void {
    if (this.reporteForm.valid) {
      const reporteData = {
        detalleId: this.data.detalle.id,
        razon: this.reporteForm.get('razon')?.value
      };
      
      this.dialogRef.close(reporteData);
    }
  }
}