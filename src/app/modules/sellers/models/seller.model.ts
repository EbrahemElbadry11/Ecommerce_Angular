/**
 * Seller models matching backend DTOs
 * Located in E-CommerceApi/Core/DTOs/Seller/
 */

export interface SellerResponseDto {
  id: number;
  userId: string;
  fullName: string;
  email: string;
  storeName: string;
  description: string;
  logo?: string; // Base64 encoded image or null
  isApproved: boolean;
  totalEarnings: number;
  totalProducts: number;
}

export interface RegisterSellerDto {
  storeName: string;
  description: string;
  logo?: File; // Optional image file
}

export interface UpdateSellerDto {
  storeName?: string;
  description?: string;
  logo?: File; // Optional image file
}
