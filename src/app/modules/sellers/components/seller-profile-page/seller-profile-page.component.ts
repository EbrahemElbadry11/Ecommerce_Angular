import { CommonModule } from '@angular/common';

import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';

import {
  Router,
  RouterLink
} from '@angular/router';

import {
  finalize,
  Subject,
  takeUntil
} from 'rxjs';

import { SellerResponseDto } from '../../models/seller.model';

import { SellerService } from '../../services/seller.service';

import { SellerFormComponent } from '../seller-form/seller-form.component';

import { ToastService } from '../../../../../services/toast';

@Component({
  selector: 'app-seller-profile-page',

  standalone: true,

  imports: [
    CommonModule,
    RouterLink,
    SellerFormComponent
  ],

  templateUrl:
    './seller-profile-page.component.html',

  styleUrls: [
    './seller-profile-page.component.css'
  ],

  changeDetection:
    ChangeDetectionStrategy.OnPush,
})

export class SellerProfilePageComponent
  implements OnInit, OnDestroy {

  seller: SellerResponseDto | null =
    null;

  isLoading = false;

  isDeleting = false;

  successMessage = '';

  errorMessage = '';

  private destroy$ =
    new Subject<void>();

  constructor(
    public sellerService: SellerService,
    private toastService: ToastService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {

    this.loadSellerProfile();
  }

  ngOnDestroy(): void {

    this.destroy$.next();

    this.destroy$.complete();
  }

  private loadSellerProfile(): void {

    this.isLoading = true;

    this.errorMessage = '';

    this.cdr.markForCheck();

    this.sellerService

      .getCurrentSellerProfile()

      .pipe(

        takeUntil(this.destroy$),

        finalize(() => {

          this.isLoading = false;

          this.cdr.detectChanges();
        })
      )

      .subscribe({

        next: (response) => {

          if (
            response.isSuccess &&
            response.data
          ) {

            this.seller =
              response.data;
          }
          else {

            this.seller = null;

            this.errorMessage =
              'Seller profile not found. Register your store first.';
          }

          this.cdr.detectChanges();
        },

        error: (error) => {

          console.error(
            'Failed to load seller profile:',
            error
          );

          this.seller = null;

          this.errorMessage =
            'Failed to load seller profile. Please try again.';

          this.cdr.detectChanges();
        },
      });
  }

  onSaved(
    updatedSeller: SellerResponseDto
  ): void {

    this.seller = updatedSeller;

    this.errorMessage = '';

    this.cdr.detectChanges();
  }

  onSuccess(message: string): void {

    this.successMessage = '';

    this.errorMessage = '';

    if (message) {

      this.toastService.show(
        message,
        'success'
      );
    }

    this.cdr.detectChanges();
  }

  onError(message: string): void {

    this.errorMessage = message;

    if (message) {

      this.successMessage = '';

      this.toastService.show(
        message,
        'danger'
      );
    }

    this.cdr.detectChanges();
  }

  retry(): void {

    this.loadSellerProfile();
  }

  deleteProfile(): void {

    this.toastService.show({
      message:
        'Delete your seller profile? This action cannot be undone.',
      type: 'danger',
      isConfirm: true,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: () =>
        this.confirmDeleteProfile(),
    });
  }

  private confirmDeleteProfile(): void {

    this.isDeleting = true;

    this.errorMessage = '';

    this.cdr.markForCheck();

    this.sellerService

      .deleteSellerProfile()

      .pipe(

        takeUntil(this.destroy$),

        finalize(() => {

          this.isDeleting = false;

          this.cdr.detectChanges();
        })
      )

      .subscribe({

        next: (response) => {

          if (response.isSuccess) {

            this.seller = null;

            this.successMessage =
              'Seller profile deleted successfully.';

            this.toastService.show(
              'Seller profile deleted successfully.',
              'success'
            );
          }
          else {

            this.errorMessage =
              'Unable to delete seller profile.';

            this.toastService.show(
              'Unable to delete seller profile.',
              'danger'
            );
          }

          this.cdr.detectChanges();

          if (response.isSuccess) {

            setTimeout(() => {

              this.router.navigate([
                '/home'
              ]);

            }, 1200);
          }
        },

        error: (error) => {

          console.error(
            'Failed to delete seller profile:',
            error
          );

          this.errorMessage =
            'Failed to delete seller profile. Please try again.';

          this.toastService.show(
            'Failed to delete seller profile. Please try again.',
            'danger'
          );

          this.cdr.detectChanges();
        },
      });
  }

  formatCurrency(
    value: number
  ): string {

    return new Intl.NumberFormat(
      'en-US',
      {
        style: 'currency',
        currency: 'USD',
      }
    ).format(value || 0);
  }
}
