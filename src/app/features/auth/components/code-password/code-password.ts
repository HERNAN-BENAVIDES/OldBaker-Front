import { Component, AfterViewInit, ViewChildren, ElementRef, QueryList } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../../../shared/notification/notification.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-code-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './code-password.html',
  styleUrls: ['./code-password.css']
})
export class CodePassword implements AfterViewInit {
  codeForm: FormGroup;
  isLoading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  userId: number | null = null;
  emailToShow: string | null = null;
  public resetEmail: string | null = null;
  readonly indices = [0, 1, 2, 3, 4, 5];
  @ViewChildren('otp') otpInputs!: QueryList<ElementRef<HTMLInputElement>>;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    public router: Router,
    private authService: AuthService,
    protected notifications: NotificationService
  ) {
    this.codeForm = this.fb.group({
      codigo: ['', [Validators.required, Validators.pattern('^[0-9]{6}$')]]
    });
    // id desde param o sessionStorage
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) { this.userId = Number(idParam); }
    else {
      try {
        const stored = sessionStorage.getItem('oauth_user_id');
        if (stored) { this.userId = Number(stored); sessionStorage.removeItem('oauth_user_id'); }
      } catch (e) {}
    }
    // email desde query param o localStorage
    const qpEmail = this.route.snapshot.queryParamMap.get('email');
    if (qpEmail) { this.emailToShow = qpEmail; }
    else {
      try {
        const userRaw = localStorage.getItem('auth_user');
        if (userRaw) {
          const user = JSON.parse(userRaw);
          this.emailToShow = user?.email || null;
        }
      } catch (e) {}
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      const first = this.otpInputs?.first;
      if (first) first.nativeElement.focus();
    }, 100);
  }

  get codigo() { return this.codeForm.get('codigo'); }

  onInput(event: any, idx: number) {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');
    if (value.length > 1) value = value.charAt(value.length - 1);
    input.value = value;
    const arr = this.codigo?.value?.split('') || Array(6).fill('');
    arr[idx] = value;
    this.codigo?.setValue(arr.join(''), { emitEvent: false });
    if (value && idx < 5) {
      const next = this.otpInputs.toArray()[idx + 1];
      if (next) next.nativeElement.focus();
    }
  }

  onKeyDown(event: KeyboardEvent, idx: number) {
    const input = event.target as HTMLInputElement;
    if (event.key === 'Backspace' && !input.value && idx > 0) {
      const prev = this.otpInputs.toArray()[idx - 1];
      if (prev) prev.nativeElement.focus();
    }
  }

  onPaste(event: ClipboardEvent) {
    event.preventDefault();
    const data = event.clipboardData?.getData('text') || '';
    if (!/^[0-9]{6}$/.test(data)) return;
    const arr = data.split('');
    this.otpInputs.forEach((input, i) => {
      input.nativeElement.value = arr[i] || '';
    });
    this.codigo?.setValue(data);
    const last = this.otpInputs.toArray()[5];
    if (last) last.nativeElement.focus();
  }

  onSubmit() {
    this.errorMessage = null;
    this.successMessage = null;
    this.codeForm.markAllAsTouched();
    if (this.codeForm.invalid) return;

    const code = this.codigo?.value;
    this.isLoading = true;

    if (this.userId) {
      // Verificación de registro (usuario conocido)
      this.authService.verifyCode({ idUsuario: String(this.userId), codigo: code }).subscribe({
        next: (res: any) => {
          this.isLoading = false;
          console.log('[CodePassword] verifyCode response:', res);
          this.successMessage = res?.mensaje || 'Código verificado correctamente.';
          this.notifications.showSuccess(this.successMessage ?? 'Código verificado correctamente.');
          this.router.navigate(['/']);
        },
        error: (err: any) => {
          this.isLoading = false;
          console.log('[CodePassword] verifyCode error:', err);
          const msg = err?.error?.mensaje || err?.error?.message || 'Error al verificar el código.';
          this.errorMessage = msg;
          this.notifications.showError(msg);
        }
      });
    } else {
      // Verificación de reset: enviar el código como texto plano al endpoint /auth/reset/verify
      this.authService.verifyResetCode(String(code)).subscribe({
        next: (res: any) => {
          this.isLoading = false;
          console.log('[CodePassword] verifyResetCode response:', res);
          // respuesta esperada: { success: true, mensaje: '...', data: '<JWT>' }
          const token = res?.data ?? null;
          try { if (token) localStorage.setItem('reset_token', token); } catch (e) {}
          // redirigir a la pantalla para introducir nueva contraseña
          this.router.navigate(['/reset-password']);
        },
        error: (err: any) => {
          this.isLoading = false;
          console.log('[CodePassword] verifyResetCode error:', err);
          const msg = err?.error?.mensaje || err?.error?.message || 'Error al verificar el código.';
          this.errorMessage = msg;
          this.notifications.showError(msg);
        }
      });
    }
  }

  public resendCode(): void {

    this.notifications.showInfo('Funcionalidad de reenvío no implementada.');
  }
}
