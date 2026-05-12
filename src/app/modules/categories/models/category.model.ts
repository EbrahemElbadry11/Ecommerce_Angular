/**
 * Category models matching backend DTOs
 * Located in E-CommerceApi/Core/DTOs/Category/
 */

export interface CategoryDto {
  categoryId: number;
  name: string;
  icon: string; // Base64 or image path
}

export interface AddCategoryDto {
  name: string;
  icon: File; // Form file
}
