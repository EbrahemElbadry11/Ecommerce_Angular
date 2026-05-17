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

export function normalizeProductListResponse(raw: unknown): {
  products: ProductDto[];
  totalCount: number;
  page: number;
  pageSize: number;
} {
  const data = raw as Record<string, unknown> | null | undefined;
  const totalCount = Number(data?.['totalCount'] ?? data?.['TotalCount'] ?? 0);
  const pageSize = Number(data?.['pageSize'] ?? data?.['PageSize'] ?? 12);
  const page = Number(data?.['page'] ?? data?.['Page'] ?? 1);
  const products = (data?.['products'] ?? data?.['Products'] ?? []) as ProductDto[];
  return { products, totalCount, page, pageSize };
}

export interface ProductCardDto extends ProductDto {
  imageUrl: string;
  shortDescription: string;
  formattedPrice: string;
}
