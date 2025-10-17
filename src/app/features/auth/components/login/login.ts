import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../../../shared/notification/notification.service';
import {environment} from '../../../../../environments/environment';

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

export class Login implements OnInit {
  private readonly baseUrl = `${environment.apiUrl}/oauth2/authorization/google`;
  loginForm: FormGroup;
  hidePassword = true;
  isLoading = false;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private notifications: NotificationService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  ngOnInit() {
    // Verificar si llegamos aquí por sesión expirada
    this.route.queryParams.subscribe(params => {
      if (params['sessionExpired'] === 'true') {
        this.notifications.showError('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
      }
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

          // Mostrar notificación de éxito ANTES de navegar
          this.notifications.showSuccess(res.mensaje || 'Inicio de sesión exitoso');

          // Navegar después de un pequeño delay para que se vea la notificación
          setTimeout(() => {
            this.router.navigate(['/']);
          }, 300);

          return;
        } catch (e) {
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
    window.location.href = this.baseUrl;
  }

  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }
}
