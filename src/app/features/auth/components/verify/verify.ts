import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../../../shared/notification/notification.service';

@Component({
  selector: 'app-verify',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, HttpClientModule],
  templateUrl: './verify.html',
  styleUrls: ['./verify.css']
})
export class Verify {
  verifyForm: FormGroup;
  isLoading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  userId: number | null = null;
  emailToShow: string | null = null;

  constructor(private fb: FormBuilder, private route: ActivatedRoute, public router: Router, private authService: AuthService, private notifications: NotificationService) {
    this.verifyForm = this.fb.group({
      codigo: ['', [Validators.required, Validators.pattern('^[0-9]{6}$')]]
    });

    // Try to get id from route param first
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.userId = Number(idParam);
    } else {
      // Fallback: try sessionStorage (set by oauth-callback or register flow)
      try {
        const stored = sessionStorage.getItem('oauth_user_id');
        if (stored) {
          this.userId = Number(stored);
          // remove it after reading
          sessionStorage.removeItem('oauth_user_id');
        }
      } catch (e) {
        // ignore
      }
    }

    // Try to get email to show: query param, route state, or localStorage auth_user
    const qpEmail = this.route.snapshot.queryParamMap.get('email');
    if (qpEmail) {
      this.emailToShow = qpEmail;
    } else {
      try {
        const userRaw = localStorage.getItem('auth_user');
        if (userRaw) {
          const user = JSON.parse(userRaw);
          if (user && user.email) { this.emailToShow = user.email; }
        }
      } catch (e) {
        // ignore
      }
    }
  }

  onSubmit() {
    this.errorMessage = null;
    this.successMessage = null;

    if (this.verifyForm.invalid || !this.userId) {
      this.verifyForm.markAllAsTouched();
      if (!this.userId) {
        this.errorMessage = 'No se encontró información del usuario para verificar.';
        this.notifications.showError(this.errorMessage);
      }
      return;
    }

    const codigo = this.verifyForm.value.codigo;
    this.isLoading = true;
    console.log('[Verify] submitting', { id: this.userId, codigo });
    this.authService.verifyCode({ id: this.userId, codigo }).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        console.log('[Verify] response', res);
        if (res?.success) {
          this.successMessage = res?.mensaje || 'Verificación exitosa';
          this.notifications.showSuccess(this.successMessage ?? 'Verificación exitosa');
          // redirigir a landing
          this.router.navigate(['/']);
        } else {
          this.errorMessage = res?.mensaje || 'Código inválido';
          this.notifications.showError(this.errorMessage ?? 'Código inválido');
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('[Verify] error', err);
        this.errorMessage = err?.error?.message || 'Error al verificar el código';
        this.notifications.showError(this.errorMessage ?? 'Error al verificar el código');
      }
    });
  }

  get codigo() { return this.verifyForm.get('codigo'); }
}
