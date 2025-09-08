import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../../../shared/notification/notification.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './reset-password.html',
  styleUrls: ['./reset-password.css']
})
export class ResetPasswordComponent {
  form: FormGroup;
  isLoading = false;

  // propiedades para mostrar/ocultar contraseña usadas en la plantilla
  showPassword = false;
  showConfirm = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private notifications: NotificationService,
    private router: Router
  ) {
    this.form = this.fb.group({
      // añadir patrón para obligar mayúscula y número
      password: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[A-Z])(?=.*\d).{8,}$/)]],
      confirm: ['', [Validators.required]]
    }, { validators: this.matchPasswords });
  }

  private matchPasswords(group: FormGroup) {
    const p = group.get('password')?.value;
    const c = group.get('confirm')?.value;
    return p === c ? null : { mismatch: true };
  }

  get password() { return this.form.get('password'); }
  get confirm() { return this.form.get('confirm'); }

  toggleShowPassword() {
    this.showPassword = !this.showPassword;
  }

  toggleShowConfirm() {
    this.showConfirm = !this.showConfirm;
  }

  onInputFocus() {
    // placeholder for focus behaviour if needed
  }

  onInputBlur() {
    // placeholder for blur behaviour if needed
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // Obtener email desde localStorage (está guardado en el flujo de 'forgot') o desde auth_user
    let email: string | null = null;
    try {
      email = localStorage.getItem('reset_email') || null;
      if (!email) {
        const raw = localStorage.getItem('auth_user');
        if (raw) {
          const u = JSON.parse(raw);
          email = u?.email ?? null;
        }
      }
    } catch (e) {
      console.warn('[ResetPassword] error leyendo localStorage', e);
      email = null;
    }

    if (!email) {
      this.notifications.showError('No se encontró el correo asociado al restablecimiento. Vuelve a solicitar el código.');
      return;
    }

    this.isLoading = true;
    const newPassword = this.password?.value as string;
    this.authService.resetPassword(email, newPassword).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        try { localStorage.removeItem('reset_token'); } catch (e) {}
        try { localStorage.removeItem('reset_email'); } catch (e) {}
        this.notifications.showSuccess(res?.mensaje ?? 'Contraseña restablecida correctamente.');
        this.router.navigate(['/login']);
      },
      error: (err: any) => {
        this.isLoading = false;
        const msg = err?.error?.mensaje || err?.error?.message || 'Error al restablecer la contraseña.';
        this.notifications.showError(msg);
      }
    });
  }

  cancel() {
    this.router.navigate(['/login']);
  }

  guardar() {
    // alias para mantener compatibilidad con la plantilla
    this.onSubmit();
  }
}
