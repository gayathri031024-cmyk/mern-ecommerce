import { Category } from './category.types';

export interface ProductImage {
  id: string;
  url: string;
  alt?: string;
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  currency: string;
  stock: number;
  sku: string;
  brand?: string;
  rating: number;
  reviewCount: number;
  images: ProductImage[];
  category: Category;
  tags: string[];
  isFeatured?: boolean;
  createdAt: string;
}

export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  brand?: string;
  rating?: number;
  inStock?: boolean;
}

export interface ProductFormValues {
  title: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  sku: string;
  brand?: string;
  categoryId: string;
  tags: string;
  images: string[];
}
