import { Injectable, signal } from '@angular/core';

export interface ToastInfo {
  id?: number;
  message: string;
  type: 'success' | 'danger' | 'warning' | 'info';
  isConfirm?: boolean;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  duration?: number; // مدة ظهور التوست (لغير التأكيد)
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  toasts = signal<ToastInfo[]>([]);
  private idCounter = 0;
  private timeouts: Map<number, any> = new Map(); // لتخزين timeouts

  /**
   * Show a toast message
   * @param configOrMessage - Either a string message or ToastInfo object
   * @param type - Toast type (only used if first param is string)
   */
  show(configOrMessage: ToastInfo | string, type: 'success' | 'danger' | 'warning' | 'info' = 'success'): number {
    let newToast: ToastInfo;

    if (typeof configOrMessage === 'string') {
      newToast = { 
        message: configOrMessage, 
        type,
        duration: 4000
      };
    } else {
      newToast = { 
        ...configOrMessage,
        duration: configOrMessage.duration || (configOrMessage.isConfirm ? undefined : 4000)
      };
    }

    newToast.id = ++this.idCounter;
    newToast.confirmText = newToast.confirmText || 'Confirm';
    newToast.cancelText = newToast.cancelText || 'Cancel';

    // For confirm toasts, remove any existing confirm toasts first
    if (newToast.isConfirm) {
      const existingConfirm = this.toasts().find(t => t.isConfirm);
      if (existingConfirm && existingConfirm.id) {
        this.clearTimeout(existingConfirm.id);
      }
      this.toasts.update(all => all.filter(t => !t.isConfirm));
    }

    this.toasts.update(all => [...all, newToast]);

    // Auto remove only for non-confirm toasts
    if (!newToast.isConfirm && newToast.duration && newToast.id) {
      const timeoutId = setTimeout(() => {
        this.remove(newToast);
      }, newToast.duration);
      this.timeouts.set(newToast.id, timeoutId);
    }

    return newToast.id;
  }

  /**
   * Remove a specific toast
   */
  remove(toast: ToastInfo): void {
    if (toast.id) {
      this.clearTimeout(toast.id);
      this.toasts.update(all => all.filter(t => t.id !== toast.id));
    }
  }

  /**
   * Remove all toasts
   */
  clearAll(): void {
    this.timeouts.forEach((timeoutId, toastId) => {
      clearTimeout(timeoutId);
    });
    this.timeouts.clear();
    this.toasts.set([]);
  }

  /**
   * Clear timeout for a specific toast
   */
  private clearTimeout(toastId: number): void {
    const timeoutId = this.timeouts.get(toastId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.timeouts.delete(toastId);
    }
  }

  /**
   * Handle confirm action
   */
  confirm(toast: ToastInfo): void {
    if (toast.onConfirm) {
      toast.onConfirm();
    }
    this.remove(toast);
  }

  /**
   * Handle cancel action
   */
  cancel(toast: ToastInfo): void {
    if (toast.onCancel) {
      toast.onCancel();
    }
    this.remove(toast);
  }

  /**
   * Show success toast
   */
  success(message: string, duration: number = 4000): number {
    return this.show({ message, type: 'success', duration });
  }

  /**
   * Show error toast
   */
  error(message: string, duration: number = 4000): number {
    return this.show({ message, type: 'danger', duration });
  }

  /**
   * Show warning toast
   */
  warning(message: string, duration: number = 4000): number {
    return this.show({ message, type: 'warning', duration });
  }

  /**
   * Show info toast
   */
  info(message: string, duration: number = 4000): number {
    return this.show({ message, type: 'info', duration });
  }

  /**
   * Show confirmation dialog
   */
  confirmDialog(options: {
    message: string;
    title?: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel?: () => void;
  }): number {
    return this.show({
      message: options.message,
      type: 'warning',
      isConfirm: true,
      confirmText: options.confirmText || 'Confirm',
      cancelText: options.cancelText || 'Cancel',
      onConfirm: options.onConfirm,
      onCancel: options.onCancel
    });
  }
}