import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth/services/auth.service';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../../shared/notification/notification.service';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-mi-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="perfil-root">
      <div class="perfil-card">
        <button class="btn-back" (click)="goBack()">← Volver</button>
        <h1>Mi cuenta</h1>

        <div *ngIf="usuario; else noUser" class="perfil-grid">
          <div class="avatar-large">{{ avatarInitial(usuario) }}</div>
          <div class="perfil-info">
            <div class="field">
              <label>Nombre</label>
              <div *ngIf="!editMode">{{ usuario.nombre }}</div>
              <input *ngIf="editMode" [(ngModel)]="form.nombre" type="text" />
            </div>

            <div class="field">
              <label>Correo</label>
              <div>{{ usuario.email }}</div>
            </div>

            <div class="field"><label>Rol</label><div>{{ usuario.rol || usuario.role || '-' }}</div></div>

            <!-- Dirección completa -->
            <div class="direccion-section">
              <h3>Dirección</h3>

              <div *ngIf="!editMode" class="direccion-display">
                <div *ngIf="usuario.direccion; else noDireccion">
                  <p><strong>Ciudad:</strong> {{ usuario.direccion.ciudad }}</p>
                  <p><strong>Barrio:</strong> {{ usuario.direccion.barrio }}</p>
                  <p><strong>Dirección:</strong> Carrera {{ usuario.direccion.carrera }} # {{ usuario.direccion.calle }} - {{ usuario.direccion.numero }}</p>
                  <p><strong>Teléfono:</strong> {{ usuario.direccion.numeroTelefono }}</p>
                </div>
                <ng-template #noDireccion>
                  <p class="no-data">No hay dirección registrada</p>
                </ng-template>
              </div>

              <div *ngIf="editMode" class="direccion-form">
                <div class="form-row">
                  <div class="form-field">
                    <label>Ciudad</label>
                    <input [(ngModel)]="form.direccion.ciudad" type="text" placeholder="Ej: Bogotá" />
                  </div>
                  <div class="form-field">
                    <label>Barrio</label>
                    <input [(ngModel)]="form.direccion.barrio" type="text" placeholder="Ej: Chapinero" />
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-field">
                    <label>Carrera</label>
                    <input [(ngModel)]="form.direccion.carrera" type="text" placeholder="Ej: 45" />
                  </div>
                  <div class="form-field">
                    <label>Calle</label>
                    <input [(ngModel)]="form.direccion.calle" type="text" placeholder="Ej: 12" />
                  </div>
                  <div class="form-field">
                    <label>Número</label>
                    <input [(ngModel)]="form.direccion.numero" type="text" placeholder="Ej: 23" />
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-field">
                    <label>Teléfono</label>
                    <input [(ngModel)]="form.direccion.numeroTelefono" type="tel" placeholder="Ej: 3001234567" />
                  </div>
                </div>
              </div>
            </div>

            <div class="actions-row">
              <button *ngIf="!editMode" class="btn-primary" (click)="enterEdit()">Editar</button>
              <div *ngIf="editMode" class="edit-controls">
                <button class="btn-primary" (click)="save()">Guardar</button>
                <button class="btn" (click)="cancel()">Cancelar</button>
              </div>
              <button class="btn-danger" (click)="confirmDeactivate()">Desactivar cuenta</button>
            </div>
          </div>
        </div>

        <ng-template #noUser>
          <p>No se encontró información del usuario.</p>
        </ng-template>
      </div>
    </div>
  `,
  styles: [`
    .perfil-root { max-width: 960px; margin: 2rem auto; padding: 1rem; }
    .perfil-card { background: #fff; border-radius: 20px; padding: 2rem; box-shadow: 0 10px 40px rgba(15, 23, 42, 0.1), 0 4px 16px rgba(15, 23, 42, 0.08); border: 1px solid #e2e8f0; }
    h1 { margin: 0 0 1rem 0; font-size: 1.25rem; color: #0b2540; }
    h3 { margin: 1rem 0 0.5rem 0; font-size: 1rem; color: #475569; font-weight: 600; }
    .perfil-grid { display: flex; gap: 1.5rem; align-items: flex-start; }
    .avatar-large { width: 96px; height: 96px; border-radius: 12px; background: #eef2ff; color: #1e3a8a; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 2rem; flex-shrink: 0; }
    .perfil-info { display: flex; flex-direction: column; gap: 0.75rem; flex: 1; min-width: 320px; }
    .field label { display:block; font-weight:600; color:#475569; font-size:0.85rem; margin-bottom:0.25rem; }
    .field div { background:#f8fafc; padding:0.5rem 0.75rem; border-radius:6px; color:#0b2540; }
    .field input { width: 100%; padding:0.5rem 0.6rem; border-radius:6px; border:1px solid #e6eef8; background:#fff; color:#0b2540; box-sizing: border-box; }

    .direccion-section { background: linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%); padding: 1rem; border-radius: 12px; margin-top: 0.5rem; border: 2px solid #e0e7ff; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.08); }
    .direccion-display p { margin: 0.4rem 0; color: #0b2540; }
    .no-data { color: #94a3b8; font-style: italic; }

    .direccion-form { display: flex; flex-direction: column; gap: 0.75rem; }
    .form-row { display: flex; gap: 0.75rem; }
    .form-field { flex: 1; display: flex; flex-direction: column; }
    .form-field label { display:block; font-weight:600; color:#475569; font-size:0.85rem; margin-bottom:0.25rem; }
    .form-field input { width: 100%; padding:0.5rem 0.6rem; border-radius:6px; border:1px solid #cbd5e1; background:#fff; color:#0b2540; box-sizing: border-box; }
    .form-field input:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1); }

    .actions-row { display:flex; gap:0.5rem; align-items:center; margin-top:1rem; }
    .btn-primary { background: linear-gradient(90deg, #2563eb, #1e40af); color:#fff; border:none; padding:0.625rem 1rem; border-radius:8px; cursor:pointer; font-weight: 700; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3); transition: all 0.3s ease; }
    .btn-primary:hover { background: linear-gradient(90deg, #1e40af, #1e3a8a); transform: translateY(-2px); box-shadow: 0 6px 16px rgba(37, 99, 235, 0.4); }
    .btn { background:transparent; border:1px solid #cbd5e1; padding:0.45rem 0.6rem; border-radius:6px; cursor:pointer; font-weight: 600; }
    .btn:hover { background:#f1f5f9; }
    .btn-danger { background:#ef4444; color:#fff; border:none; padding:0.45rem 0.6rem; border-radius:6px; margin-left:auto; cursor:pointer; font-weight: 600; }
    .btn-danger:hover { background:#dc2626; }
    .edit-controls { display:flex; gap:0.5rem; }

    .btn-back {
      background: transparent;
      border: 2px solid #e2e8f0;
      color: #2563eb;
      padding: 0.625rem 1.25rem;
      border-radius: 10px;
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 600;
      margin-bottom: 1rem;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }
    .btn-back:hover {
      background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
      border-color: #3b82f6;
      transform: translateX(-4px);
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.15);
    }

    @media (max-width: 768px) {
      .perfil-grid { flex-direction: column; align-items: center; }
      .form-row { flex-direction: column; }
    }
  `]
})
export class PerfilComponent implements OnInit {
  usuario: any = null;
  editMode = false;
  form: any = {
    nombre: '',
    direccion: {
      ciudad: '',
      barrio: '',
      carrera: '',
      calle: '',
      numero: '',
      numeroTelefono: ''
    }
  };

  constructor(private auth: AuthService, private notifications: NotificationService, private router: Router) {}

  ngOnInit(): void {
    // intenta obtener usuario desde observable o método sync
    try {
      this.usuario = this.auth.getCurrentUser() || null;
      if (!this.usuario) {
        // si existe un observable currentUser$, suscríbelo de forma segura
        const obs: any = (this.auth as any).currentUser$;
        if (obs && typeof obs.subscribe === 'function') {
          obs.subscribe((u: any) => { if (u) this.usuario = u; });
        }
      }

      // Cargar la dirección del usuario desde el backend si tiene ID
      if (this.usuario && this.usuario.id) {
        this.loadDireccionUsuario(this.usuario.id);
      }
    } catch (e) {
      this.usuario = null;
    }
  }

  loadDireccionUsuario(idUsuario: number) {
    this.auth.getDireccionUsuario(idUsuario).subscribe({
      next: (direccion: any) => {
        if (direccion) {
          // Actualizar el objeto usuario con la dirección obtenida
          if (!this.usuario) this.usuario = {};
          this.usuario.direccion = direccion;
          console.log('Dirección cargada:', direccion);
        }
      },
      error: (err: any) => {
        console.warn('Error al cargar dirección del usuario:', err);
        // No mostrar error al usuario si no tiene dirección registrada
        if (err.status !== 404) {
          const msg = err?.error?.mensaje ?? err?.message ?? 'Error al cargar dirección';
          this.notifications.showError(msg);
        }
      }
    });
  }

  enterEdit() {
    this.editMode = true;
    this.form.nombre = this.usuario?.nombre ?? '';
    // Cargar dirección existente o inicializar vacía
    if (this.usuario?.direccion) {
      this.form.direccion = {
        ciudad: this.usuario.direccion.ciudad ?? '',
        barrio: this.usuario.direccion.barrio ?? '',
        carrera: this.usuario.direccion.carrera ?? '',
        calle: this.usuario.direccion.calle ?? '',
        numero: this.usuario.direccion.numero ?? '',
        numeroTelefono: this.usuario.direccion.numeroTelefono ?? ''
      };
    } else {
      this.form.direccion = {
        ciudad: '',
        barrio: '',
        carrera: '',
        calle: '',
        numero: '',
        numeroTelefono: ''
      };
    }
  }

  cancel() {
    this.editMode = false;
  }

  save() {
    const payload: any = {};
    if (this.form.nombre !== undefined) payload.nombre = this.form.nombre;

    // Solo enviar dirección si al menos un campo está lleno
    const hasAddress = Object.values(this.form.direccion).some(val => val && String(val).trim() !== '');
    if (hasAddress) {
      payload.direccion = this.form.direccion;
    }

    this.auth.updateProfile(payload).subscribe({
      next: (res: any) => {
        this.notifications.showSuccess(res?.mensaje ?? 'Perfil actualizado');
        // actualizar usuario local en caso de que updateProfile no lo haya hecho
        const updated = this.auth.getCurrentUser() || null;
        if (updated) { this.usuario = updated; }
        this.editMode = false;
      },
      error: (err: any) => {
        const msg = err?.error?.mensaje ?? err?.message ?? 'Error al actualizar perfil';
        this.notifications.showError(msg);
      }
    });
  }

  confirmDeactivate() {
    this.notifications.showConfirm(
      '¿Estás seguro que deseas desactivar tu cuenta? Esta acción cerrará tu sesión.',
      () => {
        // Callback de confirmación
        this.deactivateAccount();
      },
      () => {
        // Callback de cancelación (opcional)
        console.log('Desactivación cancelada');
      }
    );
  }

  deactivateAccount() {
    const userId = this.usuario?.id;
    if (!userId) {
      this.notifications.showError('No se pudo obtener el ID del usuario');
      return;
    }

    this.auth.deactivateAccount(userId).subscribe({
      next: (res: any) => {
        this.notifications.showSuccess(res?.mensaje ?? 'Cuenta desactivada');
        // navegar al home
        try { this.router.navigate(['/']); } catch (e) {}
      },
      error: (err: any) => {
        const msg = err?.error?.mensaje ?? err?.message ?? 'Error al desactivar cuenta';
        this.notifications.showError(msg);
      }
    });
  }

  avatarInitial(user: any) {
    if (!user) return '';
    const name = user.nombre ?? user.name ?? user.email ?? '';
    return String(name).trim().charAt(0).toUpperCase() || '';
  }

  goBack() {
    this.router.navigate(['..']);
  }
}
