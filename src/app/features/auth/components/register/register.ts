import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../../../shared/notification/notification.service';
import {environment} from '../../../../../environments/environment';

function passwordStrength(control: AbstractControl): ValidationErrors | null {
  const value = control.value as string;
  if (!value) return null;
  const hasUpper = /[A-Z]/.test(value);
  const hasNumber = /[0-9]/.test(value);
  const minLength = value.length >= 8;
  return hasUpper && hasNumber && minLength ? null : { weakPassword: true };
}

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const pwd = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return pwd === confirm ? null : { passwordsMismatch: true };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, HttpClientModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class Register {
  private readonly baseUrl = `${environment.apiUrl}/oauth2/authorization/google`;
  registerForm: FormGroup;
  hidePassword = true;
  hideConfirmPassword = true;
  isLoading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  constructor(private fb: FormBuilder, private router: Router, private authService: AuthService, private notifications: NotificationService) {
    this.registerForm = this.fb.group({
      // Campos vacíos por defecto; los ejemplos se muestran como placeholders en la plantilla
      nombre: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, passwordStrength]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: passwordsMatch });
  }

  toggleShowPassword() { this.hidePassword = !this.hidePassword; }

  toggleShowConfirmPassword() { this.hideConfirmPassword = !this.hideConfirmPassword; }

  signUpWithGoogle() {
    // Redirige al endpoint de autorización OAuth2 para iniciar flujo con Google
    window.location.href = this.baseUrl;
  }

  onSubmit() {
    this.errorMessage = null;
    this.successMessage = null;

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const { nombre, email, password } = this.registerForm.value;

    this.isLoading = true;
    this.authService.register({ nombre, email, password }).subscribe({
      next: (res: any) => {
        this.isLoading = false;

        // Manejar caso en que el backend responda con success:false en el body
        if (res && res.success === false) {
          const msg = res.mensaje ?? res.data?.mensaje ?? 'Error en el registro';
          this.errorMessage = msg;
          this.notifications.showError(msg);
          return;
        }

        // Asumir éxito si llegamos aquí
        this.successMessage = 'Registro exitoso';
        this.notifications.showSuccess('Registro exitoso. Por favor verifica tu correo.');

        // Extraer el objeto usuario desde diferentes formatos posibles de la respuesta
        const usuario = res?.data?.usuario ?? res?.data ?? null;
        try {
          if (usuario) {
            // Guardar en localStorage para que /verify pueda leer el email
            try { localStorage.setItem('auth_user', JSON.stringify(usuario)); } catch (e) { console.warn('No se pudo guardar auth_user en localStorage', e); }

            // Guardar id en sessionStorage para el flujo de verificación
            const userId = usuario.id ?? usuario.userId ?? null;
            if (userId != null) {
              try { sessionStorage.setItem('oauth_user_id', String(userId)); } catch (e) { }
            }

          }
        } catch (e) {
          console.warn('Error procesando respuesta de registro', e);
        }

        // Navegar a /verify pasando el email como query param para mostrarlo en la vista
        const emailToShow = usuario?.email ?? email;
        this.router.navigate(['/verify'], { queryParams: { email: emailToShow } }).then(r => console.log('[Register] navigate /verify', r));
      },
      error: (err) => {
        this.isLoading = false;
        // Priorizar 'mensaje' proveniente del backend si existe
        const serverMsg = err?.error?.mensaje ?? err?.error?.message ?? err?.message ?? 'Error en el registro';
        this.errorMessage = serverMsg;
        this.notifications.showError(this.errorMessage ?? 'Error en el registro');}
    });
  }

  get nombre() { return this.registerForm.get('nombre'); }
  get email() { return this.registerForm.get('email'); }
  get password() { return this.registerForm.get('password'); }
  get confirmPassword() { return this.registerForm.get('confirmPassword'); }
}
