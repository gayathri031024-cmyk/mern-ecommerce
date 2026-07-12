import User from '@models/User';
import Category from '@models/Category';
import Product from '@models/Product';
import { ROLES, Role } from '@constants/roles';
import { signAccessToken } from '@services/token.service';

let counter = 0;
function unique(prefix: string): string {
  counter += 1;
  return `${prefix}${Date.now()}${counter}`;
}

interface CreateUserOptions {
  name?: string;
  email?: string;
  password?: string;
  role?: Role;
  isEmailVerified?: boolean;
}

/** Creates a persisted user and returns it alongside a valid access token. */
export async function createUser(options: CreateUserOptions = {}) {
  const user = await User.create({
    name: options.name ?? 'Test User',
    email: options.email ?? `${unique('user')}@example.com`,
    password: options.password ?? 'Password123!',
    role: options.role ?? ROLES.CUSTOMER,
    isEmailVerified: options.isEmailVerified ?? true,
  });

  const accessToken = signAccessToken({ sub: user.id as string, role: user.role, email: user.email });
  return { user, accessToken };
}

export function authHeader(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}

export async function createCategory(overrides: Partial<{ name: string; slug: string }> = {}) {
  const suffix = unique('cat');
  return Category.create({
    name: overrides.name ?? `Category ${suffix}`,
    slug: overrides.slug ?? `category-${suffix}`,
  });
}

interface CreateProductOptions {
  title?: string;
  slug?: string;
  sku?: string;
  price?: number;
  stock?: number;
  categoryId?: string;
  isActive?: boolean;
  vendor?: string;
}

export async function createProduct(options: CreateProductOptions = {}) {
  const category = options.categoryId ? { _id: options.categoryId } : await createCategory();
  const suffix = unique('prod');

  return Product.create({
    title: options.title ?? `Product ${suffix}`,
    slug: options.slug ?? `product-${suffix}`,
    description: 'A great test product',
    price: options.price ?? 29.99,
    currency: 'USD',
    stock: options.stock ?? 10,
    sku: options.sku ?? `SKU-${suffix}`,
    category: category._id,
    isActive: options.isActive ?? true,
    vendor: options.vendor,
  });
}
