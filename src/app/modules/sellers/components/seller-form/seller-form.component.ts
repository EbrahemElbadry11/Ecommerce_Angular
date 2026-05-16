import { CommonModule } from '@angular/common';

import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
} from '@angular/core';

import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  finalize,
  Subject,
  takeUntil
} from 'rxjs';

import { SellerResponseDto } from '../../models/seller.model';

import { SellerService } from '../../services/seller.service';

type SellerFormMode =
  | 'register'
  | 'edit';

@Component({
  selector: 'app-seller-form',

  standalone: true,

  imports: [
    CommonModule,
    ReactiveFormsModule
  ],

  templateUrl:
    './seller-form.component.html',

  styleUrls: [
    './seller-form.component.css'
  ],

  changeDetection:
    ChangeDetectionStrategy.OnPush,
})

export class SellerFormComponent
  implements OnChanges, OnDestroy {

  @Input()
  mode: SellerFormMode =
    'register';

  @Input()
  seller: SellerResponseDto | null =
    null;

  @Output()
  onSaved =
    new EventEmitter<SellerResponseDto>();

  @Output()
  onSuccess =
    new EventEmitter<string>();

  @Output()
  onError =
    new EventEmitter<string>();

  form!: FormGroup;

  isSubmitting = false;

  logoPreviewUrl = '';

  selectedLogoName = '';

  private destroy$ =
    new Subject<void>();

  constructor(
    private fb: FormBuilder,
    public sellerService: SellerService,
    private cdr: ChangeDetectorRef
  ) {

    this.constructorInit();
  }

  private constructorInit(): void {

    this.form = this.fb.group({

      storeName: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(100)
        ]
      ],

      description: [
        '',
        [Validators.maxLength(500)]
      ],

      logo: [null as File | null],
    });
  }

  ngOnChanges(
    changes: SimpleChanges
  ): void {

    if (changes['seller']) {

      this.patchFormFromSeller();

      this.cdr.detectChanges();
    }
  }

  ngOnDestroy(): void {

    this.destroy$.next();

    this.destroy$.complete();
  }

  private patchFormFromSeller(): void {

    if (
      !this.seller ||
      this.mode !== 'edit'
    ) {
      return;
    }

    this.form.patchValue({

      storeName:
        this.seller.storeName ?? '',

      description:
        this.seller.description ?? '',

      logo: null,
    });

    this.selectedLogoName = '';

    this.logoPreviewUrl = '';

    this.cdr.detectChanges();
  }

  onFileSelected(
    event: Event
  ): void {

    const input =
      event.target as HTMLInputElement;

    const file =
      input.files &&
        input.files.length > 0
        ? input.files[0]
        : null;

    this.form.patchValue({
      logo: file
    });

    this.form
      .get('logo')
      ?.updateValueAndValidity();

    if (!file) {

      this.selectedLogoName = '';

      this.logoPreviewUrl = '';

      this.cdr.detectChanges();

      return;
    }

    this.selectedLogoName =
      file.name;

    const reader =
      new FileReader();

    reader.onload = () => {

      this.logoPreviewUrl =
        String(
          reader.result || ''
        );

      this.cdr.detectChanges();
    };

    reader.readAsDataURL(file);
  }

  clearLogo(): void {

    this.form.patchValue({
      logo: null
    });

    this.selectedLogoName = '';

    this.logoPreviewUrl = '';

    this.cdr.detectChanges();
  }

  submit(): void {

    if (this.form.invalid) {

      this.form.markAllAsTouched();

      this.cdr.detectChanges();

      return;
    }

    const storeName =
      this.form.value
        .storeName?.trim() || '';

    const description =
      this.form.value
        .description?.trim() || '';

    const logo =
      this.form.value.logo ||
      undefined;

    this.isSubmitting = true;

    this.onError.emit('');

    this.cdr.markForCheck();

    const request$ =

      this.mode === 'edit'

        ? this.sellerService
          .updateSellerProfile({
            storeName,
            description,
            logo
          })

        : this.sellerService
          .registerSeller({
            storeName,
            description,
            logo
          });

    request$

      .pipe(

        takeUntil(this.destroy$),

        finalize(() => {

          this.isSubmitting = false;

          this.cdr.detectChanges();
        })
      )

      .subscribe({

        next: (response) => {

          if (
            response.isSuccess &&
            response.data
          ) {

            const updatedSeller = {

              ...this.seller,

              ...response.data,
            };

            this.onSaved.emit(
              updatedSeller
            );

            this.onSuccess.emit(

              this.mode === 'edit'

                ? 'Seller profile updated successfully.'

                : 'Seller registration completed successfully.'
            );

            if (
              this.mode === 'register'
            ) {

              this.form.patchValue({

                description: '',

                logo: null
              });

              this.form.markAsPristine();

              this.selectedLogoName = '';

              this.logoPreviewUrl = '';
            }

            this.cdr.detectChanges();

            return;
          }

          this.onError.emit(
            'Unable to save seller profile.'
          );

          this.cdr.detectChanges();
        },

        error: (error) => {

          console.error(
            'Failed to save seller profile:',
            error
          );

          this.onError.emit(
            'Failed to save seller profile. Please try again.'
          );

          this.cdr.detectChanges();
        },
      });
  }

  hasError(
    controlName:
      | 'storeName'
      | 'description'
  ): boolean {

    const control =
      this.form.get(controlName);

    return !!control &&
      control.invalid &&
      (
        control.dirty ||
        control.touched
      );
  }

  getErrorMessage(
    controlName:
      | 'storeName'
      | 'description'
  ): string {

    const control =
      this.form.get(controlName);

    if (
      !control ||
      !control.errors
    ) {

      return '';
    }

    if (
      control.errors['required']
    ) {

      return 'This field is required.';
    }

    if (
      control.errors['minlength']
    ) {

      return 'Must be at least 3 characters long.';
    }

    if (
      control.errors['maxlength']
    ) {

      return controlName ===
        'storeName'

        ? 'Store name cannot exceed 100 characters.'

        : 'Description cannot exceed 500 characters.';
    }

    return 'Invalid value.';
  }
}
