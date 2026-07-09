import { Product } from './product.types';

export interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
  priceAtAdd: number;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  itemCount: number;
}
