import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AdminService } from '../../../services/admin.service';
import { AdminUser } from '../../../models/user-admin.model';
import { SlicePipe } from '@angular/common';
@Component({
  selector: 'app-seller-approval',
  standalone: true,
  imports: [DatePipe, FormsModule, RouterLink,SlicePipe],
  templateUrl: './seller-approval.html',
  styleUrls: ['./seller-approval.css']
})
export class SellerApprovalComponent implements OnInit {
  private adminService = inject(AdminService);

  // State
  readonly pendingSellers = signal<AdminUser[]>([]);
  readonly approvedSellers = signal<AdminUser[]>([]);
  readonly loading = signal(true);
  readonly actionLoading = signal<string | null>(null);
  readonly activeTab = signal<'pending' | 'approved'>('pending');
  readonly alertMessage = signal<string | null>(null);
  readonly alertType = signal<'success' | 'danger' | 'warning' | 'info'>('info');

  // Search
  readonly searchTerm = signal('');

  // Computed filtered pending sellers
  readonly filteredPendingSellers = computed(() => {
    let filtered = this.pendingSellers();
    const search = this.searchTerm().toLowerCase();
    
    if (search) {
      filtered = filtered.filter(seller =>
        seller.fullName.toLowerCase().includes(search) ||
        seller.email.toLowerCase().includes(search)
      );
    }
    
    return filtered;
  });

  ngOnInit(): void {
    this.loadSellers();
  }

  loadSellers(): void {
    this.loading.set(true);
    this.adminService.getUsers()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => {
          if (res.isSuccess && res.data) {
            // فصل التجار المعلقين عن المعتمدين
            const allSellers = res.data.filter(user => user.role === 'Seller');
            
            const pending = allSellers.filter(seller => !seller.isSellerApproved);
            const approved = allSellers.filter(seller => seller.isSellerApproved);
            
            this.pendingSellers.set(pending);
            this.approvedSellers.set(approved);
            
            console.log(`Pending sellers: ${pending.length}, Approved sellers: ${approved.length}`);
          }
        },
        error: (err) => {
          this.showAlert('Failed to load sellers', 'danger');
          console.error('Error:', err);
        }
      });
  }

  // ✅ الميثود المهمة - قبول البائع
  approveSeller(seller: AdminUser): void {
    if (!confirm(`Approve ${seller.fullName} as a seller? They will be able to sell products on the platform.`)) return;

    this.actionLoading.set(seller.id);
    
    // تحويل الـ id من string لـ number
    const sellerId = parseInt(seller.id, 10);
    
    this.adminService.approveSeller(sellerId)
      .pipe(finalize(() => this.actionLoading.set(null)))
      .subscribe({
        next: () => {
          this.showAlert(`${seller.fullName} has been approved as a seller!`, 'success');
          
          // نقل التاجر من المعلقين للمعتمدين
          this.pendingSellers.update(pending => 
            pending.filter(s => s.id !== seller.id)
          );
          this.approvedSellers.update(approved => 
            [...approved, { ...seller, isSellerApproved: true }]
          );
        },
        error: (err) => {
          console.error('Approve error:', err);
          this.showAlert('Failed to approve seller', 'danger');
        }
      });
  }

  rejectSeller(seller: AdminUser): void {
    if (!confirm(`Reject ${seller.fullName}? They will need to reapply.`)) return;
    
    // يمكنك إضافة ميثود للرفض في الـ Service
    this.showAlert(`Rejected ${seller.fullName}`, 'warning');
    this.pendingSellers.update(pending => 
      pending.filter(s => s.id !== seller.id)
    );
  }

  refreshSellers(): void {
    this.loadSellers();
    this.showAlert('Refreshing seller list...', 'info');
  }

  setTab(tab: 'pending' | 'approved'): void {
    this.activeTab.set(tab);
    this.searchTerm.set('');
  }

  getUserInitial(name: string): string {
    return name?.charAt(0).toUpperCase() || '?';
  }

  private showAlert(message: string, type: 'success' | 'danger' | 'warning' | 'info'): void {
    this.alertMessage.set(message);
    this.alertType.set(type);
    setTimeout(() => this.alertMessage.set(null), 4000);
  }

  clearAlert(): void {
    this.alertMessage.set(null);
  }
}