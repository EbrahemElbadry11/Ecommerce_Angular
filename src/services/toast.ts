import { Injectable, signal } from '@angular/core';

export interface ToastInfo {
  id?: number; // ← ضيف ده
  message: string;
  type: 'success' | 'danger' | 'warning' | 'info';
  isConfirm?: boolean;
  onConfirm?: () => void;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  toasts = signal<ToastInfo[]>([]);
  private idCounter = 0; // ← عداد

  show(configOrMessage: ToastInfo | string, type: 'success' | 'danger' | 'warning' | 'info' = 'success') {
    let newToast: ToastInfo;

    if (typeof configOrMessage === 'string') {
      newToast = { message: configOrMessage, type };
    } else {
      newToast = configOrMessage;
    }

    newToast.id = ++this.idCounter; // ← كل toast ليه ID فريد

    // لو confirm، امسح القديم الأول
    if (newToast.isConfirm) {
      this.toasts.update(all => all.filter(t => !t.isConfirm));
    }

    this.toasts.update(all => [...all, newToast]);

    if (!newToast.isConfirm) {
      setTimeout(() => {
        this.remove(newToast); // ← استخدم remove عشان يكون consistent
      }, 4000);
    }
  }

  remove(toast: ToastInfo) {
    this.toasts.update(all => all.filter(t => t.id !== toast.id)); // ← filter بالـ ID مش الـ reference
  }
}