import { HttpClientModule } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common'; // ← ضيف ده
import { ToastInfo, ToastService } from '../services/toast';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, FormsModule, HttpClientModule, ReactiveFormsModule, CommonModule], // ← ضيف CommonModule
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('Demo');
  public readonly toastService = inject(ToastService);

  handleToastConfirm(toast: ToastInfo): void {
    if (toast.onConfirm) {
      toast.onConfirm();
    }
    this.toastService.remove(toast);
  }
}