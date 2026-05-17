import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
  signal
} from '@angular/core';

import { CommonModule, DatePipe } from '@angular/common';

import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { UserService } from '../../services/user.service';

import {
  UserProfile,
  UpdateProfileRequest
} from '../../models/user-profile.model';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePipe],
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})

export class UserProfileComponent implements OnInit {

  private userService = inject(UserService);
  private fb = inject(FormBuilder);

  constructor(private cd: ChangeDetectorRef) { }

  readonly profile = signal<UserProfile | null>(null);

  readonly userImageUrl = signal<string>(
    'assets/images/default-avatar.png'
  );

  readonly loading = signal<boolean>(true);
  readonly saving = signal<boolean>(false);

  readonly message = signal<string | null>(null);

  readonly success = signal<boolean>(true);

  form!: FormGroup;

  selectedFile: File | null = null;

  ngOnInit(): void {
    this.initForm();
    this.loadUserProfile();
    this.cd.markForCheck();
  }

  private initForm(): void {

    this.form = this.fb.group({
      fullName: ['', [
        Validators.required,
        Validators.minLength(3)
      ]],

      phoneNumber: ['', [Validators.required]],

      address: ['', [
        Validators.maxLength(100)
      ]]
    });
  }

  loadUserProfile(): void {

    this.loading.set(true);

    this.userService.getProfile().subscribe({

      next: (response) => {

        if (response.isSuccess && response.data) {

          this.profile.set(response.data);

          this.form.patchValue({
            fullName: response.data.fullName,
            phoneNumber: response.data.phoneNumber,
            address: response.data.address
          });

          if (response.data.imagePath) {

            this.userImageUrl.set(
              this.userService.getUserImageUrl(
                response.data.imagePath
              )
            );
          }
        }

        this.loading.set(false);

        this.cd.markForCheck();
      },

      error: (err) => {

        console.error(
          'Error loading profile:',
          err
        );

        this.loading.set(false);

        this.message.set(
          'Failed to load profile data.'
        );

        this.success.set(false);

        this.cd.markForCheck();
      }
    });
  }

  onFileSelected(event: any): void {

    const file = event.target.files[0];

    if (!file) return;

    this.selectedFile = file;

    const reader = new FileReader();

    reader.onload = () => {
      this.userImageUrl.set(
        reader.result as string
      );
    };

    reader.readAsDataURL(file);
  }

  getRoleBadgeColor(): string {

    const role =
      this.profile()?.role?.toLowerCase();

    if (role === 'admin') return '#ef4444';

    if (role === 'seller') return '#10b981';

    return '#3b82f6';
  }

  submit(): void {

    if (this.form.invalid) return;

    this.saving.set(true);

    this.message.set(null);

    const updatePayload: UpdateProfileRequest = {
      fullName: this.form.value.fullName,
      phoneNumber: this.form.value.phoneNumber,
      address: this.form.value.address,
      image: this.selectedFile || undefined
    };

    this.userService
      .updateProfile(updatePayload)

      .subscribe({

        next: () => {

          this.saving.set(false);

          this.selectedFile = null;

          this.message.set(
            'Profile updated successfully!'
          );

          this.success.set(true);

          this.loadUserProfile();

          this.cd.markForCheck();
        },

        error: (err) => {

          console.error(
            'Error updating profile:',
            err
          );

          this.saving.set(false);

          this.message.set(
            err.error?.message ||
            'Error updating profile. Please try again.'
          );

          this.success.set(false);

          this.cd.markForCheck();
        }
      });
  }
}
