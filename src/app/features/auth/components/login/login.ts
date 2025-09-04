import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../../../shared/notification/notification.service';

interface AuthResponse {
  success: boolean;
  mensaje?: string;
  data?: {
    accessToken?: string;
    refreshToken?: string;
    tokenType?: string;
    usuario?: {
      id?: number;
      email?: string;
      nombre?: string;
      rol?: string;
      verificado?: boolean | string;
      [key: string]: any;
    } | null;
    [key: string]: any;
  } | null;
  timestamp?: number;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, HttpClientModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login {
  loginForm: FormGroup;
  hidePassword = true;
  isLoading = false;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private notifications: NotificationService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  toggleShowPassword() {
    this.hidePassword = !this.hidePassword;
  }

  onSubmit(): void {
    this.errorMessage = null;

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { email, password } = this.loginForm.value;
    this.isLoading = true;

    this.authService.login({ email, password }).subscribe({
      next: (res: AuthResponse) => {
        this.isLoading = false;

        if (!res) {
          this.notifications.showError('Respuesta inválida del servidor.');
          return;
        }

        // Caso lógico de fallo comunicado por el backend (success false)
        if (res.success !== true) {
          this.notifications.showError(res.mensaje || 'Credenciales inválidas');
          return;
        }

        // Éxito: delegar guardado de tokens/usuario al servicio
        try {
          // llamar directamente al método del servicio (existe en AuthService)
          this.authService.saveAuthResponse(res);
          // verificar guardado y loguear para depuración
          try {
            const token = localStorage.getItem('auth_token');
            const refresh = localStorage.getItem('refresh_token');
            const user = localStorage.getItem('auth_user');
            console.log('[Login] saved to localStorage', { tokenPresent: !!token, refreshPresent: !!refresh, userPresent: !!user });
            console.log('[Login] auth_user', user);
          } catch (e) {
            console.warn('[Login] error reading localStorage after save', e);
          }
          this.router.navigate(['/']);
          this.notifications.showSuccess(res.mensaje || 'Inicio de sesión exitoso');
          return;
        } catch (e) {
          console.error('[Login] error saving auth response', e);
          this.notifications.showError('Error al procesar la respuesta de autenticación.');
          return;
        }


      },
      error: (err: any) => {
        this.isLoading = false;
        let msg = 'Error al iniciar sesión';
        try {
          const body = err?.error;
          if (body) {
            if (typeof body === 'string') {
              try {
                const parsed = JSON.parse(body);
                msg = parsed?.mensaje || parsed?.message || parsed?.error || body || msg;
              } catch (e) {
                msg = body || msg;
              }
            } else if (typeof body === 'object') {
              msg = body.mensaje || body.message || body.error || msg;
            }
          } else {
            msg = err?.message || msg;
          }
        } catch (e) {
          // fallback silencioso
        }

        this.notifications.showError(msg);
        console.warn('Login error', msg, err);
      }
    });
  }

  signInWithGoogle() {
    // Redirigir al backend para iniciar OAuth con Google
    window.location.href = 'https://localhost:8443/oauth2/authorization/google';
  }

  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }
}
