import { HttpClientModule } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../services/toast';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, FormsModule, HttpClientModule, ReactiveFormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('Demo');
  public readonly toastService = inject(ToastService);
}
