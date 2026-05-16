import { CommonModule } from '@angular/common';

import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component
} from '@angular/core';

import { RouterLink } from '@angular/router';

import { SellerResponseDto } from '../../models/seller.model';

import { SellerFormComponent } from '../seller-form/seller-form.component';
import { SellerService } from '../../services/seller.service';

@Component({
  selector: 'app-seller-register-page',

  standalone: true,

  imports: [
    CommonModule,
    RouterLink,
    SellerFormComponent
  ],

  templateUrl:
    './seller-register-page.component.html',

  styleUrls: [
    './seller-register-page.component.css'
  ],

  changeDetection:
    ChangeDetectionStrategy.OnPush,
})

export class SellerRegisterPageComponent {

  successMessage = '';

  errorMessage = '';

  createdSeller:
    SellerResponseDto | null =
    null;

  constructor(private cdr: ChangeDetectorRef, public sellerService: SellerService) { }


  onSaved(
    seller: SellerResponseDto
  ): void {

    this.createdSeller = seller;

    this.cdr.detectChanges();
  }

  onSuccess(
    message: string
  ): void {

    this.successMessage = message;

    this.errorMessage = '';

    this.cdr.detectChanges();
  }

  onError(
    message: string
  ): void {

    this.errorMessage = message;

    if (message) {

      this.successMessage = '';
    }

    this.cdr.detectChanges();
  }

}
