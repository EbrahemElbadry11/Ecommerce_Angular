export interface RegisterDto {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phoneNumber?: string | null;
}
