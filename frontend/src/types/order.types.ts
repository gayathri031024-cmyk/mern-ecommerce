import { Address } from './user.types';
import { Product } from './product.types';

export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type PaymentMethod = 'card' | 'cod' | 'paypal';

export interface OrderItem {
  product: Pick<Product, 'id' | 'title' | 'images' | 'slug'>;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  items: OrderItem[];
  shippingAddress: Address;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  subtotal: number;
  shippingFee: number;
  tax: number;
  total: number;
  createdAt: string;
}

export interface CreateOrderPayload {
  shippingAddressId: string;
  paymentMethod: PaymentMethod;
}