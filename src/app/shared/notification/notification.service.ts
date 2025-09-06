import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type NotificationType = 'success' | 'error' | 'info';

export interface Notification {
  id: number;
  message: string;
  type: NotificationType;
  timeout?: number;
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

  private add(n: Omit<Notification, 'id'>) {
    const notification: Notification = { ...n, id: this.idCounter++ };
    this.notificationsSubject.next([...this.notificationsSubject.value, notification]);
  }

  dismiss(id: number) {
    this.notificationsSubject.next(
      this.notificationsSubject.value.filter(n => n.id !== id)
    );
  }
}

