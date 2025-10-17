import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

interface Producto {
  id_producto: number;
  nombre: string;
  descripcion?: string;
  categoria?: string;
}

interface Insumo {
  id_insumo: number;
  nombre: string;
  descripcion?: string;
  costo_unitario?: number;
  cantidad_actual?: number;
}

interface InsumoReceta {
  id_insumo: number;
  nombre_insumo: string;
  cantidad: number;
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
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDialogModule,
    MatSelectModule,
    MatIconModule,
    MatTableModule,
    MatTooltipModule
  ],
  template: `
    <h2 mat-dialog-title class="dialog-title">
      <mat-icon class="title-icon">restaurant</mat-icon>
      {{ data.isEdit ? 'Editar' : 'Crear' }} Receta
    </h2>

    <mat-dialog-content class="dialog-content">
      <form [formGroup]="form" class="form-container">

        <!-- Información Básica -->
        <div class="section-header">
          <mat-icon>info</mat-icon>
          <h3>Información Básica</h3>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Nombre de la Receta</mat-label>
          <input matInput formControlName="nombre" placeholder="Ej: Pan Integral Casero">
          <mat-icon matSuffix>edit</mat-icon>
          <mat-error *ngIf="form.get('nombre')?.hasError('required')">
            El nombre es requerido
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Descripción</mat-label>
          <textarea
            matInput
            formControlName="descripcion"
            rows="3"
            placeholder="Describe los pasos de preparación..."></textarea>
          <mat-error *ngIf="form.get('descripcion')?.hasError('required')">
            La descripción es requerida
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Producto Final</mat-label>
          <mat-select formControlName="id_producto" placeholder="Seleccione el producto que se obtendrá">
            <mat-option *ngFor="let producto of productos" [value]="producto.id_producto">
              {{ producto.nombre }}
              <span class="option-detail" *ngIf="producto.categoria">
                - {{ producto.categoria }}
              </span>
            </mat-option>
          </mat-select>
          <mat-icon matSuffix>cake</mat-icon>
          <mat-error *ngIf="form.get('id_producto')?.hasError('required')">
            Debe seleccionar un producto
          </mat-error>
        </mat-form-field>

        <!-- Sección de Insumos -->
        <div class="section-header">
          <mat-icon>inventory_2</mat-icon>
          <h3>Ingredientes e Insumos</h3>
        </div>

        <div class="add-insumo-container">
          <mat-form-field appearance="outline" class="insumo-select">
            <mat-label>Seleccionar Insumo</mat-label>
            <mat-select [(value)]="selectedInsumo" placeholder="Elija un ingrediente">
              <mat-option
                *ngFor="let insumo of insumosDisponibles"
                [value]="insumo.id_insumo"
                [disabled]="isInsumoAgregado(insumo.id_insumo)">
                {{ insumo.nombre }}
                <span class="option-detail" *ngIf="insumo.cantidad_actual !== undefined">
                  (Stock: {{ insumo.cantidad_actual }})
                </span>
              </mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="cantidad-input">
            <mat-label>Cantidad (g)</mat-label>
            <input matInput type="number" [(ngModel)]="cantidadInsumo" [ngModelOptions]="{standalone: true}" min="1" placeholder="500">
            <mat-icon matSuffix>scale</mat-icon>
          </mat-form-field>

          <button
            mat-raised-button
            color="primary"
            type="button"
            (click)="agregarInsumo()"
            [disabled]="!selectedInsumo || !cantidadInsumo || cantidadInsumo <= 0"
            class="add-btn">
            <mat-icon>add_circle</mat-icon>
            Agregar
          </button>
        </div>

        <!-- Tabla de Insumos Agregados -->
        <div class="insumos-agregados" *ngIf="insumosAgregados.length > 0">
          <h4>
            <mat-icon>playlist_add_check</mat-icon>
            Ingredientes de la Receta ({{ insumosAgregados.length }})
          </h4>

          <table class="insumos-table">
            <thead>
              <tr>
                <th>Insumo</th>
                <th>Cantidad</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let insumo of insumosAgregados; let i = index" class="insumo-row">
                <td class="insumo-name">
                  <mat-icon class="ingredient-icon">restaurant_menu</mat-icon>
                  {{ insumo.nombre_insumo }}
                </td>
                <td class="insumo-cantidad">
                  <span class="cantidad-badge">{{ insumo.cantidad }}g</span>
                </td>
                <td class="insumo-actions">
                  <button
                    mat-icon-button
                    color="warn"
                    type="button"
                    (click)="eliminarInsumo(i)"
                    matTooltip="Eliminar ingrediente">
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>

          <div class="total-section">
            <strong>Total de ingredientes:</strong> {{ calcularTotalGramos() }}g
          </div>
        </div>

        <!-- Advertencia si no hay insumos -->
        <div class="warning-box" *ngIf="insumosAgregados.length === 0">
          <mat-icon>warning</mat-icon>
          <p>Debe agregar al menos un ingrediente a la receta</p>
        </div>

      </form>

      <!-- Info Panel -->
      <div class="info-panel">
        <div class="info-item">
          <mat-icon>check_circle</mat-icon>
          <span>{{ productos.length }} productos disponibles</span>
        </div>
        <div class="info-item">
          <mat-icon>inventory</mat-icon>
          <span>{{ insumos.length }} insumos disponibles</span>
        </div>
        <div class="info-item">
          <mat-icon>add_shopping_cart</mat-icon>
          <span>{{ insumosAgregados.length }} ingredientes en receta</span>
        </div>
      </div>

    </mat-dialog-content>

    <mat-dialog-actions align="end" class="dialog-actions">
      <button mat-button (click)="onCancel()" class="cancel-btn">
        <mat-icon>close</mat-icon>
        Cancelar
      </button>
      <button
        mat-raised-button
        color="primary"
        (click)="onSave()"
        [disabled]="!form.valid || insumosAgregados.length === 0"
        class="save-btn">
        <mat-icon>save</mat-icon>
        {{ data.isEdit ? 'Actualizar' : 'Guardar' }} Receta
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-title {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      color: #2c4a9e;
      font-weight: 600;
      margin: 0;
      padding: 1.5rem 1.5rem 1rem 1.5rem;
      border-bottom: 2px solid #f0f0f0;
    }

    .title-icon {
      color: #2c4a9e !important;
      font-size: 1.8rem !important;
    }

    .dialog-content {
      padding: 1.5rem;
      max-height: 70vh;
      overflow-y: auto;
    }

    .form-container {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 1.5rem 0 1rem 0;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid #e3f2fd;
    }

    .section-header mat-icon {
      color: #2c4a9e !important;
    }

    .section-header h3 {
      margin: 0;
      font-size: 1.1rem;
      color: #2c4a9e;
      font-weight: 600;
    }

    .full-width {
      width: 100%;
    }

    .add-insumo-container {
      display: grid;
      grid-template-columns: 2fr 1fr auto;
      gap: 1rem;
      align-items: start;
      margin-bottom: 1.5rem;
    }

    .insumo-select,
    .cantidad-input {
      margin: 0 !important;
    }

    .add-btn {
      height: 56px;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .option-detail {
      font-size: 0.875rem;
      color: #666;
      margin-left: 0.5rem;
    }

    .insumos-agregados {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 1rem;
      margin-top: 1rem;
    }

    .insumos-agregados h4 {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0 0 1rem 0;
      color: #2c4a9e;
      font-weight: 600;
    }

    .insumos-table {
      width: 100%;
      border-collapse: collapse;
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }

    .insumos-table thead {
      background: #2c4a9e;
      color: white;
    }

    .insumos-table th {
      padding: 0.75rem;
      text-align: left;
      font-weight: 600;
      font-size: 0.9rem;
    }

    .insumos-table td {
      padding: 0.75rem;
      border-bottom: 1px solid #e0e0e0;
    }

    .insumo-row:hover {
      background: #f5f5f5;
    }

    .insumo-name {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .ingredient-icon {
      color: #ff9800 !important;
      font-size: 1.2rem !important;
    }

    .cantidad-badge {
      background: #e3f2fd;
      color: #1976d2;
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-weight: 600;
      font-size: 0.9rem;
    }

    .insumo-actions {
      text-align: center;
    }

    .total-section {
      margin-top: 1rem;
      padding: 0.75rem;
      background: white;
      border-radius: 8px;
      text-align: right;
      font-size: 1.1rem;
      color: #2c4a9e;
      border: 2px solid #e3f2fd;
    }

    .warning-box {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: #fff3cd;
      border: 1px solid #ffc107;
      border-radius: 8px;
      margin-top: 1rem;
    }

    .warning-box mat-icon {
      color: #856404 !important;
      font-size: 1.5rem !important;
    }

    .warning-box p {
      margin: 0;
      color: #856404;
      font-weight: 500;
    }

    .info-panel {
      margin-top: 1.5rem;
      padding: 1rem;
      background: #e3f2fd;
      border-radius: 8px;
      display: flex;
      gap: 1.5rem;
      flex-wrap: wrap;
      justify-content: space-around;
    }

    .info-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
      color: #1976d2;
      font-weight: 500;
    }

    .info-item mat-icon {
      font-size: 1.2rem !important;
      color: #1976d2 !important;
    }

    .dialog-actions {
      padding: 1rem 1.5rem;
      border-top: 1px solid #f0f0f0;
      gap: 1rem;
    }

    .cancel-btn {
      color: #666;
    }

    .save-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    /* Scrollbar */
    .dialog-content::-webkit-scrollbar {
      width: 8px;
    }

    .dialog-content::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 4px;
    }

    .dialog-content::-webkit-scrollbar-thumb {
      background: #2c4a9e;
      border-radius: 4px;
    }

    .dialog-content::-webkit-scrollbar-thumb:hover {
      background: #1e3478;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .add-insumo-container {
        grid-template-columns: 1fr;
      }

      .info-panel {
        flex-direction: column;
        gap: 0.75rem;
      }
    }
  `]
})
export class RecetaDialogComponent implements OnInit {
  form: FormGroup;
  productos: Producto[] = [];
  insumos: Insumo[] = [];
  insumosAgregados: InsumoReceta[] = [];

  selectedInsumo: number | null = null;
  cantidadInsumo: number | null = null;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<RecetaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      descripcion: ['', Validators.required],
      id_producto: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    console.log('🔍 RecetaDialog - Datos recibidos:', this.data);

    // Cargar productos e insumos
    this.productos = this.data.productos || [];
    this.insumos = this.data.insumos || [];

    console.log('✅ Productos cargados:', this.productos);
    console.log('✅ Insumos cargados:', this.insumos);

    // Si estamos editando, cargar los datos
    if (this.data.isEdit && this.data.item) {
      console.log('📝 Modo edición - Item:', this.data.item);
      this.form.patchValue({
        nombre: this.data.item.nombre || '',
        descripcion: this.data.item.descripcion || '',
        id_producto: this.data.item.id_producto || ''
      });

      // Si tiene insumos guardados, cargarlos
      if (this.data.item.insumos && Array.isArray(this.data.item.insumos)) {
        this.insumosAgregados = this.data.item.insumos;
      } else if (this.data.item.id_insumo && this.data.item.cantidad_insumo) {
        // Compatibilidad con formato anterior (un solo insumo)
        const insumoAntiguo = this.insumos.find(i => i.id_insumo === this.data.item.id_insumo);
        if (insumoAntiguo) {
          this.insumosAgregados.push({
            id_insumo: insumoAntiguo.id_insumo,
            nombre_insumo: insumoAntiguo.nombre,
            cantidad: this.data.item.cantidad_insumo
          });
        }
      }
    }
  }

  get insumosDisponibles(): Insumo[] {
    return this.insumos;
  }

  isInsumoAgregado(id_insumo: number): boolean {
    return this.insumosAgregados.some(i => i.id_insumo === id_insumo);
  }

  agregarInsumo(): void {
    if (!this.selectedInsumo || !this.cantidadInsumo || this.cantidadInsumo <= 0) {
      return;
    }

    // Verificar que no esté ya agregado
    if (this.isInsumoAgregado(this.selectedInsumo)) {
      alert('Este insumo ya ha sido agregado a la receta');
      return;
    }

    // Buscar el insumo
    const insumo = this.insumos.find(i => i.id_insumo === this.selectedInsumo);
    if (!insumo) {
      return;
    }

    // Agregar a la lista
    this.insumosAgregados.push({
      id_insumo: insumo.id_insumo,
      nombre_insumo: insumo.nombre,
      cantidad: this.cantidadInsumo
    });

    console.log('✅ Insumo agregado:', this.insumosAgregados);

    // Limpiar campos
    this.selectedInsumo = null;
    this.cantidadInsumo = null;
  }

  eliminarInsumo(index: number): void {
    if (confirm('¿Está seguro de eliminar este ingrediente?')) {
      this.insumosAgregados.splice(index, 1);
      console.log('🗑️ Insumo eliminado. Lista actual:', this.insumosAgregados);
    }
  }

  calcularTotalGramos(): number {
    return this.insumosAgregados.reduce((total, insumo) => total + insumo.cantidad, 0);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (!this.form.valid) {
      console.warn('❌ Formulario inválido');
      Object.keys(this.form.controls).forEach(key => {
        this.form.get(key)?.markAsTouched();
      });
      return;
    }

    if (this.insumosAgregados.length === 0) {
      alert('Debe agregar al menos un ingrediente a la receta');
      return;
    }

    const recetaData = {
      ...this.form.value,
      insumos: this.insumosAgregados,
      // Para compatibilidad con el formato anterior (primer insumo)
      id_insumo: this.insumosAgregados[0].id_insumo,
      cantidad_insumo: this.insumosAgregados[0].cantidad
    };

    console.log('💾 Guardando receta:', recetaData);
    this.dialogRef.close(recetaData);
  }
}
