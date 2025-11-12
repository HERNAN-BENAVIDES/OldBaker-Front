import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { ProveedoresService } from '../proveedores.service';

export interface ReporteDialogData {
  reporte?: any;
  isEdit?: boolean;
}

@Component({
  selector: 'app-reporte-manual-dialog',
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
        <mat-icon>assignment</mat-icon>
        {{ data && data.isEdit ? 'Editar' : 'Crear' }} Reporte Manual
      </h2>
      <button mat-icon-button mat-dialog-close>
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content>
      <form [formGroup]="reporteForm" class="reporte-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Proveedor *</mat-label>
          <mat-select formControlName="proveedorId" [disabled]="!!(data && data.isEdit)">
            <mat-option *ngFor="let proveedor of proveedores" [value]="proveedor.idProveedor">
              {{ proveedor.nombre }}
            </mat-option>
          </mat-select>
          <mat-error *ngIf="reporteForm.get('proveedorId')?.hasError('required')">
            Debe seleccionar un proveedor
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Razón del reporte *</mat-label>
          <textarea 
            matInput 
            formControlName="razon" 
            placeholder="Describa el motivo del reporte..."
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

        <div class="info-notice" *ngIf="!(data && data.isEdit)">
          <mat-icon>info</mat-icon>
          <div>
            <strong>Nota:</strong> Este será un reporte manual sin detalle de insumo asociado.
            Los campos como ID detalle y nombre de insumo aparecerán como (-) ya que no aplican.
          </div>
        </div>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>
        <mat-icon>cancel</mat-icon>
        Cancelar
      </button>
      <button 
        mat-raised-button 
        color="primary"
        [disabled]="reporteForm.invalid"
        (click)="guardarReporte()">
        <mat-icon>save</mat-icon>
        {{ data && data.isEdit ? 'Actualizar' : 'Crear' }} Reporte
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
      background: linear-gradient(135deg, #2c4a9e 0%, #1a237e 100%);
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

    .reporte-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .full-width {
      width: 100%;
    }

    .info-notice {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 16px;
      background: #e3f2fd;
      border: 1px solid #2196f3;
      border-radius: 8px;
      color: #1565c0;
    }

    .info-notice mat-icon {
      color: #2196f3;
      margin-top: 2px;
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
export class ReporteManualDialogComponent implements OnInit {
  reporteForm: FormGroup;
  proveedores: any[] = [];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ReporteManualDialogComponent>,
    private proveedoresService: ProveedoresService,
    @Inject(MAT_DIALOG_DATA) public data: ReporteDialogData
  ) {
    this.reporteForm = this.fb.group({
      proveedorId: ['', [Validators.required]],
      razon: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]]
    });
  }

  ngOnInit(): void {
    this.loadProveedores();
    
    // Si es edición, cargar datos existentes
    if (this.data?.isEdit && this.data?.reporte) {
      this.reporteForm.patchValue({
        proveedorId: this.data.reporte.proveedorId,
        razon: this.data.reporte.razon
      });
    }
  }

  loadProveedores(): void {
    // Cargar lista de proveedores
    this.proveedoresService.list().subscribe({
      next: (proveedores) => {
        this.proveedores = proveedores;
      },
      error: (err) => {
        console.error('Error cargando proveedores:', err);
        // Fallback con mock data
        this.proveedores = [
          { idProveedor: 1, nombre: 'Distribuidora Central' },
          { idProveedor: 2, nombre: 'Lácteos del Valle' },
          { idProveedor: 3, nombre: 'Harinas Premium' }
        ] as any;
      }
    });
  }

  guardarReporte(): void {
    if (this.reporteForm.valid) {
      const reporteData = {
        detalleId: null, // Reportes manuales no tienen detalle asociado
        razon: this.reporteForm.get('razon')?.value,
        idProveedor: this.reporteForm.get('proveedorId')?.value // Cambiar de proveedorId a idProveedor para coincidir con el backend
      };
      
      console.log('📝 Reporte manual a crear:', reporteData);
      this.dialogRef.close(reporteData);
    }
  }
}