export interface UserProfile {
  fullName: string;
  email: string;
  phoneNumber?: string | null;
  address?: string | null;
  imagePath?: string | null;
  role: string;
  createdAt: string;
}

export interface UpdateProfileRequest {
  fullName?: string | null;
  phoneNumber?: string | null;
  address?: string | null;
  image?: File | null;
}

export interface ApiResponse<T> {
  isSuccess: boolean;
  data: T;
}
