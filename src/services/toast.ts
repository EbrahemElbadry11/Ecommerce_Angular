import { Injectable, signal } from '@angular/core';

export interface ToastInfo {
  message: string;
  type: 'success' | 'danger' | 'warning' | 'info';
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  toasts = signal<ToastInfo[]>([]);

  show(message: string, type: 'success' | 'danger' | 'warning' | 'info' = 'success') {
    const newToast: ToastInfo = { message, type };
    
    this.toasts.update(all => [...all, newToast]);

    setTimeout(() => {
      this.toasts.update(all => all.filter(t => t !== newToast));
    }, 4000);
  }

  remove(toast: ToastInfo) {
    this.toasts.update(all => all.filter(t => t !== toast));
  }
}