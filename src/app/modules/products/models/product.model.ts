/**
 * Product models matching backend DTOs
 * Located in E-CommerceApi/Core/DTOs/Product/
 */

// Main product DTO returned from API
export interface ProductDto {
  productId: number;
  name: string;
  description: string | null;
  price: number;
  stockQuantity: number;
  categoryName: string;
  storeName: string;
  createdAt: string; // ISO date
  imagesNames: string[];
}

// DTO for creating a new product
export interface AddProductDto {
  name: string;
  description?: string;
  price: number;
  stockQuantity: number;
  categoryId: number;
  sellerId: number;
}

// DTO for updating an existing product
export interface UpdateProductDto {
  productId: number;
  name?: string;
  description?: string;
  price?: number;
  stockQuantity?: number;
  categoryId?: number;
}

// Query filter DTO for listing products
export interface ProductFilterDto {
  search?: string;
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'name' | 'price' | 'createdAt'; // Backend: sortBy field
  order?: 'asc' | 'desc'; // Backend: Order field
  page?: number; // Default: 1
  pageSize?: number; // Default: 12
}
