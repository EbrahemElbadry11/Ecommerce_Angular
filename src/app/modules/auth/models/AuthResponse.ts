export interface AuthResponse {
  token: string;
  refreshToken?: string;
  fullName?: string;
  email?: string;
  role?: string;
  isBlocked?: boolean;
  isDeleted?: boolean;
}

export interface ApiResponse<T> {
  isSuccess: boolean;
  data: T;
}

export interface VerifyCodeDto {
  email: string;
  verificationCode: string;
}

export interface ResetPasswordDto {
  email: string;
  newPassword: string;
  confirmNewPassword: string;
}
