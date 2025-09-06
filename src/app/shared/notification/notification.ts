import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { NotificationService, Notification } from './notification.service';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification.html',
  styleUrls: ['./notification.css']
})
export class NotificationComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  private sub: Subscription | null = null;

  // track timers/progress per notification
  private timerMap = new Map<number, number>();
  progress = new Map<number, number>();

  // manejador de teclado para ESC y ENTER
  private keyHandler = (e: KeyboardEvent) => {
    try {
      // solo actuar si el foco está dentro de una notificación (overlay)
      const active = document.activeElement as HTMLElement | null;
      if (!active || !active.closest) { return; }
      if (!active.closest('.sb-overlay')) { return; }

      if (!this.notifications || this.notifications.length === 0) { return; }
      const top = this.notifications[this.notifications.length - 1]; // la notificación más reciente
      if (!top) { return; }
      if (e.key === 'Escape') {
        e.preventDefault();
        this.dismiss(top.id);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        // simular acción del botón Aceptar -> dismiss
        this.dismiss(top.id);
      }
    } catch (err) {
      // ignore
    }
  }

  constructor(private notificationsService: NotificationService) {}

  ngOnInit(): void {
    // registrar listener global de teclado
    document.addEventListener('keydown', this.keyHandler);
    this.sub = this.notificationsService.notifications$.subscribe((list: Notification[]) => {
      // start timers for new notifications
      const prevIds = new Set(this.notifications.map(n => n.id));
      const newIds = new Set(list.map((n: Notification) => n.id));

      for (const n of list) {
        if (!prevIds.has(n.id)) {
          this.startTimer(n);
        }
      }

      // clear timers for removed
      for (const id of prevIds) {
        if (!newIds.has(id)) {
          this.clearTimer(id);
        }
      }

      this.notifications = list;

      // si hay notificaciones, enfocar automáticamente el último overlay para que Enter/Escape actúen sobre ella
      try {
        if (this.notifications && this.notifications.length > 0) {
          setTimeout(() => {
            const els = document.querySelectorAll('.sb-overlay');
            const el = els[els.length - 1] as HTMLElement | undefined;
            if (el) { el.focus(); }
          }, 0);
        }
      } catch (e) { /* ignore */ }
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    for (const id of Array.from(this.timerMap.keys())) {
      this.clearTimer(id);
    }
    // limpiar listener de teclado
    document.removeEventListener('keydown', this.keyHandler);
  }

  trackById(_i: number, item: Notification) {
    return item.id;
  }

  dismiss(id: number) {
    this.notificationsService.dismiss(id);
    this.clearTimer(id);
  }

  private startTimer(n: Notification) {
    const timeout = n.timeout ?? 4000;
    if (!timeout || timeout <= 0) { return; }
    this.progress.set(n.id, 0);
    const start = Date.now();
    const end = start + timeout;
    const tick = 100;
    const timerId = window.setInterval(() => {
      const now = Date.now();
      const pct = Math.min(100, Math.round(((now - start) / (end - start)) * 100));
      this.progress.set(n.id, pct);
      if (pct >= 100) {
        this.notificationsService.dismiss(n.id);
        this.clearTimer(n.id);
      }
    }, tick) as unknown as number;

    this.timerMap.set(n.id, timerId);
  }

  private clearTimer(id: number) {
    const t = this.timerMap.get(id);
    if (t != null) {
      clearInterval(t);
      this.timerMap.delete(id);
    }
    this.progress.delete(id);
  }

  pause(id: number) {
    const t = this.timerMap.get(id);
    if (t != null) {
      clearInterval(t);
      this.timerMap.delete(id);
    }
  }

  resume(n: Notification) {
    // resume with remaining time based on current progress
    const pct = this.progress.get(n.id) ?? 0;
    const timeout = n.timeout ?? 4000;
    const remaining = Math.max(0, Math.round(((100 - pct) / 100) * timeout));
    if (remaining <= 0) {
      this.notificationsService.dismiss(n.id);
      this.clearTimer(n.id);
      return;
    }

    const start = Date.now();
    const end = start + remaining;
    const tick = 100;
    const timerId = window.setInterval(() => {
      const now = Date.now();
      const newPct = Math.min(100, Math.round(((now - start) / (end - start)) * 100) + pct);
      this.progress.set(n.id, newPct);
      if (newPct >= 100) {
        this.notificationsService.dismiss(n.id);
        this.clearTimer(n.id);
      }
    }, tick) as unknown as number;

    this.timerMap.set(n.id, timerId);
  }

  icon(type: Notification['type']) {
    switch (type) {
      case 'success': return '✔';
      case 'error': return '✖';
      default: return 'ℹ';
    }
  }

  progressFor(id: number) {
    return this.progress.get(id) ?? 0;
  }
}
