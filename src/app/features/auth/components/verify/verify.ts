import { Component, AfterViewInit, ViewChildren, ElementRef, QueryList } from '@angular/core';
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
export class Verify implements AfterViewInit {
  verifyForm: FormGroup;
  isLoading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  userId: number | null = null;
  emailToShow: string | null = null;

  // helper indices para iterar en la plantilla
  readonly indices = [0, 1, 2, 3, 4, 5];

  // referencias a los inputs OTP
  @ViewChildren('otp') otpInputs!: QueryList<ElementRef<HTMLInputElement>>;

  constructor(private fb: FormBuilder, private route: ActivatedRoute, public router: Router, private authService: AuthService, protected notifications: NotificationService) {
    this.verifyForm = this.fb.group({
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
          if (user && user.email) { this.emailToShow = user.email; }
        }
      } catch (e) {}
    }
  }

  ngAfterViewInit(): void {
    // focus al primer input
    setTimeout(() => {
      const first = this.otpInputs?.first;
      if (first && first.nativeElement) { first.nativeElement.focus(); }
    }, 50);
  }

  private buildCodeFromInputs(): string {
    if (!this.otpInputs || this.otpInputs.length === 0) { return this.verifyForm.value.codigo || ''; }
    return this.otpInputs.toArray().map(el => (el.nativeElement.value || '')).join('');
  }

  onInput(e: Event, index: number) {
    const input = e.target as HTMLInputElement;
    const digit = (input.value || '').replace(/[^0-9]/g, '').slice(0, 1);
    input.value = digit;

    if (digit.length > 0) {
      const arr = this.otpInputs.toArray();
      const next = arr[index + 1];
      if (next) { next.nativeElement.focus(); }
    }

    const code = this.buildCodeFromInputs();
    this.verifyForm.get('codigo')?.setValue(code);
  }

  onKeyDown(e: KeyboardEvent, index: number) {
    const key = e.key;
    const arr = this.otpInputs.toArray();
    const input = arr[index]?.nativeElement;

    if (key === 'Backspace') {
      if (input && input.value === '') {
        const prev = arr[index - 1];
        if (prev) {
          prev.nativeElement.focus();
          prev.nativeElement.value = '';
          const code = this.buildCodeFromInputs();
          this.verifyForm.get('codigo')?.setValue(code);
          e.preventDefault();
        }
      }
    }
  }

  onPaste(e: ClipboardEvent) {
    e.preventDefault();
    const text = e.clipboardData?.getData('text') || '';
    const digits = text.replace(/\D/g, '').slice(0, 6).split('');
    const arr = this.otpInputs.toArray();
    for (let i = 0; i < arr.length; i++) { arr[i].nativeElement.value = digits[i] ?? ''; }
    const code = this.buildCodeFromInputs();
    this.verifyForm.get('codigo')?.setValue(code);
    const last = Math.min(digits.length - 1, arr.length - 1);
    if (last >= 0) { arr[last].nativeElement.focus(); }
  }

  resendCode() {
    // placeholder: mostrar notificación. Implementar llamada al backend si se dispone
    this.notifications.showInfo('Se ha reenviado el código al correo');
  }

  onSubmit() {
    this.errorMessage = null;
    this.successMessage = null;

    const code = this.buildCodeFromInputs();
    this.verifyForm.get('codigo')?.setValue(code);

    if (this.verifyForm.invalid || !this.userId) {
      this.verifyForm.markAllAsTouched();
      if (!this.userId) {
        this.errorMessage = 'No se encontró información del usuario para verificar.';
        this.notifications.showError(this.errorMessage ?? 'No se encontró información del usuario para verificar.');
      }
      return;
    }

    this.isLoading = true;

    // Enviar idUsuario como string en el JSON al backend
    const idUsuario = String(this.userId);
    console.log('[Verify] submitting', { idUsuario, codigo: code });
    this.authService.verifyCode({ idUsuario, codigo: code }).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        console.log('[Verify] response', res);
        if (res?.success) {
          this.successMessage = res?.mensaje || 'Verificación exitosa';
          this.notifications.showSuccess(this.successMessage ?? 'Verificación exitosa');
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

  // getter para obtener email directamente desde localStorage si no está en emailToShow
  get storedEmail(): string | null {
    try {
      const raw = localStorage.getItem('auth_user');
      if (!raw) return null;
      const u = JSON.parse(raw);
      return (u && u.email) ? String(u.email) : null;
    } catch (e) {
      return null;
    }
  }
}
