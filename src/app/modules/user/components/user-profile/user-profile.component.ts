import { ChangeDetectorRef, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '.././../services/user.service'; // تأكد من صحة مسار الخدمة
import { UserProfile, UpdateProfileRequest } from '.././../models/user-profile.model'; // تأكد من صحة مسار الموديل

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
 
   constructor(private cd : ChangeDetectorRef) { }
  // 1. رابط الباك-إند الأساسي لدمج مسار الصور (قم بتعديله حسب البورت عندك)
  readonly backendBaseUrl = 'https://ecommerceiti.runasp.net/api'; 

  // Signals State المتوافقة تماماً مع الـ HTML الخاص بك
  readonly profile = signal<UserProfile | null>(null);
  readonly userImageUrl = signal<string>('assets/images/default-avatar.png'); // صورة افتراضية
  readonly loading = signal<boolean>(true);
  readonly saving = signal<boolean>(false);
  readonly message = signal<string | null>(null);
  readonly success = signal<boolean>(true);
  
  form!: FormGroup;
  selectedFile: File | null = null;

  ngOnInit(): void {
    this.initForm();
    this.loadUserProfile();
    this.cd.markForCheck(); // تأكد من تحديث العرض بعد تحميل البيانات والتهيئة
  }

  // تهيئة الـ Form بالـ Validators المطلوبة في الـ HTML
  private initForm(): void {
    this.form = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      phoneNumber: ['', [Validators.required]],
      address: ['', [Validators.maxLength(100)]]
    });
  }

  // جلب بيانات البروفايل عند فتح الصفحة
  loadUserProfile(): void {
    this.loading.set(true);
    this.userService.getProfile().subscribe({
      next: (response) => {
        if (response.isSuccess && response.data) {
          this.profile.set(response.data);
          
          // ملء الـ Form بالبيانات القادمة من السيرفر
          this.form.patchValue({
            fullName: response.data.fullName,
            phoneNumber: response.data.phoneNumber,
            address: response.data.address
          });

          // دمج رابط السيرفر مع الـ ImagePath المخزن في قاعدة البيانات
          if (response.data.imagePath) {
            this.userImageUrl.set(`${this.backendBaseUrl}/${response.data.imagePath}`);
          }
        }
        this.loading.set(false);
        this.cd.markForCheck();
      },
      error: (err) => {
        console.error('Error loading profile:', err);
        this.loading.set(false);
        this.message.set('Failed to load profile data.');
        this.success.set(false);
      }
    });
  }

  // معالجة اختيار صورة جديدة من جهاز المستخدم (Preview محلي)
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;

      // عمل عرض مؤقت للصورة المختارة في الواجهة قبل الرفع
      const reader = new FileReader();
      reader.onload = () => {
        this.userImageUrl.set(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  // دالة تحديد لون الـ Badge بناءً على الـ Role
  getRoleBadgeColor(): string {
    const role = this.profile()?.role?.toLowerCase();
    if (role === 'admin') return '#ef4444'; // أحمر للأدمن
    if (role === 'seller') return '#10b981'; // أخضر للبائع
    return '#3b82f6'; // أزرق للمستخدم العادي
  }

  // إرسال البيانات المحدثة والصورة إلى الباك-إند
  submit(): void {
    if (this.form.invalid) return;

    this.saving.set(true);
    this.message.set(null);

    // تجهيز الـ Payload المتوافق مع الـ Service والـ FormData
    const updatePayload: UpdateProfileRequest = {
      fullName: this.form.value.fullName,
      phoneNumber: this.form.value.phoneNumber,
      address: this.form.value.address,
      image: this.selectedFile || undefined
    };

    this.userService.updateProfile(updatePayload).subscribe({
      next: (response) => {
        this.saving.set(false);
        this.selectedFile = null; // تصفير الملف المختار بعد النجاح
        this.message.set('Profile updated successfully!');
        this.success.set(true);
        
        // إعادة جلب البيانات لتحديث الـ Sidebar بالكامل بالصورة والاسم الجديد من السيرفر
        this.loadUserProfile(); 
      },
      error: (err) => {
        console.error('Error updating profile:', err);
        this.saving.set(false);
        this.message.set(err.error?.message || 'Error updating profile. Please try again.');
        this.success.set(false);
      }
    });
  };
}