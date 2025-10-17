import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type NotificationType = 'success' | 'error' | 'info' | 'confirm';

export interface Notification {
  id: number;
  message: string;
  type: NotificationType;
  timeout?: number;
  onConfirm?: () => void;
  onCancel?: () => void;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  notifications$ = this.notificationsSubject.asObservable();
  private idCounter = 1;

  showSuccess(message: string, timeout = 4000) {
    this.add({ message, type: 'success', timeout });
  }
  showError(message: string, timeout = 4000) {
    this.add({ message, type: 'error', timeout });
  }
  showInfo(message: string, timeout = 4000) {
    this.add({ message, type: 'info', timeout });
  }

  showConfirm(message: string, onConfirm: () => void, onCancel?: () => void) {
    this.add({
      message,
      type: 'confirm',
      timeout: 0, // sin auto-dismiss
      onConfirm,
      onCancel
    });
  }

  private add(n: Omit<Notification, 'id'>) {
    const notification: Notification = { ...n, id: this.idCounter++ };
    this.notificationsSubject.next([...this.notificationsSubject.value, notification]);
  }

  dismiss(id: number) {
    this.notificationsSubject.next(
      this.notificationsSubject.value.filter(n => n.id !== id)
    );
  }

  confirm(id: number) {
    const notification = this.notificationsSubject.value.find(n => n.id === id);
    if (notification?.onConfirm) {
      notification.onConfirm();
    }
    this.dismiss(id);
  }

  cancel(id: number) {
    const notification = this.notificationsSubject.value.find(n => n.id === id);
    if (notification?.onCancel) {
      notification.onCancel();
    }
    this.dismiss(id);
  }
}
