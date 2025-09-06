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
  token: string | null = null;

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

    try { this.token = localStorage.getItem('reset_token'); } catch (e) { this.token = null; }
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
    if (!this.token) {
      this.notifications.showError('Token de restablecimiento no encontrado. Solicita de nuevo el código.');
      return;
    }

    this.isLoading = true;
    const pwd = this.password?.value;
    this.authService.resetPassword(this.token, pwd).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        console.log('[ResetPassword] response:', res);
        try { localStorage.removeItem('reset_token'); } catch (e) {}
        this.notifications.showSuccess(res?.mensaje ?? 'Contraseña restablecida correctamente.');
        this.router.navigate(['/login']);
      },
      error: (err: any) => {
        this.isLoading = false;
        console.log('[ResetPassword] error:', err);
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
