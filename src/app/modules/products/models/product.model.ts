/**
 * Product models matching backend DTOs
 */

export interface ProductDto {
  productId: number;

  name: string;

  description: string | null;

  price: number;

  stockQuantity: number;

  categoryName: string;

  storeName: string;

  createdAt: string;

  imagesNames: string[];

  mainImage?: string | null;
}

export interface AddProductDto {
  name: string;
  description?: string;
  price: number;
  stockQuantity: number;
  categoryId: number;
  sellerId: number;
}

export interface UpdateProductDto {
  productId: number;

  name?: string;

  description?: string;

  price?: number;

  stockQuantity?: number;

  categoryId?: number;
}

export interface ProductFilterDto {
  search?: string;

  categoryId?: number;

  minPrice?: number;

  maxPrice?: number;

  sortBy?: 'name' | 'price' | 'createdAt';

  order?: 'asc' | 'desc';

  page?: number;

  pageSize?: number;
}

export interface ProductListResponse {
  totalCount: number;

  page: number;

  pageSize: number;

  products: ProductDto[];
}
export interface ProductCardDto extends ProductDto {
  imageUrl: string;
  shortDescription: string;
  formattedPrice: string;
}
