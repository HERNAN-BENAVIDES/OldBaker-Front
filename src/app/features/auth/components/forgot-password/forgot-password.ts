import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../../../shared/notification/notification.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './forgot-password.html',
  styleUrls: ['./forgot-password.css']
})
export class ForgotPasswordComponent {
  isLoading = false;
  successMessage: string | null = null;
  errorMessage: string | null = null;
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private notifications: NotificationService,
    private router: Router
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  get email() { return this.form.get('email'); }

  onSubmit() {
    this.errorMessage = null;
    this.successMessage = null;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const email = this.form.value.email as string;
    this.isLoading = true;

    this.authService.requestPasswordReset(email).subscribe({
      next: (res: any) => {
        try { localStorage.setItem('reset_email', email as string); } catch (e) {}
        this.isLoading = false;
        const msg = res?.mensaje ?? 'Si el email existe, se ha enviado un enlace para restablecer la contraseña.';
        this.successMessage = msg;
        this.notifications.showSuccess(msg);
        // Redirigir a la página de código de recuperación tras mostrar la notificación
        setTimeout(() => {
          this.router.navigate(['/code-password']);
        }, 300);
      },
      error: (err: any) => {
        this.isLoading = false;
        const msg = err?.error?.mensaje ?? err?.error?.message ?? 'Error al solicitar recuperación';
        this.errorMessage = msg;
        this.notifications.showError(msg);
      }
    });
  }

  backToLogin() {
    this.router.navigate(['/login']);
  }
}
