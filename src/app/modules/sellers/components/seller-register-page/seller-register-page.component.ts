import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SellerResponseDto } from '../../models/seller.model';
import { SellerFormComponent } from '../seller-form/seller-form.component';

@Component({
  selector: 'app-seller-register-page',
  standalone: true,
  imports: [CommonModule, RouterLink, SellerFormComponent],
  templateUrl: './seller-register-page.component.html',
  styleUrls: ['./seller-register-page.component.css'],
})
export class SellerRegisterPageComponent {
  successMessage: string = '';
  errorMessage: string = '';
  createdSeller: SellerResponseDto | null = null;

  onSaved(seller: SellerResponseDto): void {
    this.createdSeller = seller;
  }

  onSuccess(message: string): void {
    this.successMessage = message;
    this.errorMessage = '';
  }

  onError(message: string): void {
    this.errorMessage = message;
    if (message) {
      this.successMessage = '';
    }
  }

  getLogoUrl(logoBase64?: string): string {
    if (!logoBase64) {
      return '';
    }

    return logoBase64.startsWith('data:image')
      ? logoBase64
      : `data:image/png;base64,${logoBase64}`;
  }
}