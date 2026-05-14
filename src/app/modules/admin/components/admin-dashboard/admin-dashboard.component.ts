import { Component, OnInit, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../services/admin.service';
import { AdminDashboardStats } from '../../models/user-admin.model';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../../../services/toast';



@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, RouterLink,CommonModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: '../admin-shared.css',
})
export class AdminDashboardComponent implements OnInit {
  readonly stats   = signal<AdminDashboardStats | null>(null);
  readonly loading = signal(true);

  constructor(private adminService: AdminService , private toast:ToastService) {}

  ngOnInit(): void {
    this.adminService.getDashboard().subscribe({
      next:     (res) => this.stats.set(res.data ?? null),
      complete: ()    => this.loading.set(false),

    });
  }

  getStatusClass(status: string): string {
    const s = status.toLowerCase();
    if (['delivered', 'completed'].includes(s)) return 'badge-success';
    if (['pending', 'processing', 'confirmed'].includes(s)) return 'badge-warning';
    if (s === 'cancelled') return 'badge-danger';
    if (s === 'shipped')   return 'badge-info';
    return 'badge-neutral';
  }
}
