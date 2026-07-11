import { Request, Response } from 'express';
import Cart from '@models/Cart';
import Product from '@models/Product';
import { asyncHandler } from '@utils/asyncHandler';
import { AppError } from '@utils/AppError';
import { logActivity } from '@services/activity.service';

async function getOrCreateCart(userId: string) {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) cart = await Cart.create({ user: userId, items: [] });
  return cart;
}

export const getCart = asyncHandler(async (req: Request, res: Response) => {
  const cart = await (await getOrCreateCart(req.user!.id)).populate('items.product', 'title slug images stock price');

  res.status(200).json({ success: true, message: 'Cart retrieved successfully', data: cart });
});

export const addCartItem = asyncHandler(async (req: Request, res: Response) => {
  const { productId, quantity = 1 } = req.body as { productId: string; quantity?: number };

  const product = await Product.findById(productId);
  if (!product || !product.isActive) throw AppError.notFound('Product not found');
  if (product.stock < quantity) throw AppError.badRequest('Not enough stock available');

  const cart = await getOrCreateCart(req.user!.id);
  const existingItem = cart.items.find((item) => String(item.product) === productId);

  if (existingItem) {
    existingItem.quantity = Math.min(99, existingItem.quantity + quantity);
    existingItem.priceAtAdd = product.price;
  } else {
    cart.items.push({ product: product._id, quantity, priceAtAdd: product.price } as never);
  }

  await cart.save();
  await cart.populate('items.product', 'title slug images stock price');

  void logActivity({
    user: req.user!.id,
    type: 'added_to_cart',
    description: `Added "${product.title}" to cart`,
    entityType: 'product',
    entityId: product.id,
  });

  res.status(200).json({ success: true, message: 'Item added to cart', data: cart });
});

export const updateCartItem = asyncHandler(async (req: Request, res: Response) => {
  const { productId } = req.params;
  const { quantity } = req.body as { quantity: number };

  const cart = await getOrCreateCart(req.user!.id);
  const item = cart.items.find((i) => String(i.product) === productId);
  if (!item) throw AppError.notFound('Item not found in cart');

  const product = await Product.findById(productId);
  if (product && product.stock < quantity) throw AppError.badRequest('Not enough stock available');

  item.quantity = quantity;
  await cart.save();
  await cart.populate('items.product', 'title slug images stock price');

  res.status(200).json({ success: true, message: 'Cart item updated', data: cart });
});

export const removeCartItem = asyncHandler(async (req: Request, res: Response) => {
  const { productId } = req.params;

  const cart = await getOrCreateCart(req.user!.id);
  const lengthBefore = cart.items.length;
  cart.items = cart.items.filter((i) => String(i.product) !== productId) as never;
  if (cart.items.length === lengthBefore) throw AppError.notFound('Item not found in cart');

  await cart.save();
  await cart.populate('items.product', 'title slug images stock price');

  res.status(200).json({ success: true, message: 'Item removed from cart', data: cart });
});

export const clearCart = asyncHandler(async (req: Request, res: Response) => {
  const cart = await getOrCreateCart(req.user!.id);
  cart.items = [] as never;
  await cart.save();

  res.status(200).json({ success: true, message: 'Cart cleared', data: cart });
});

/** Merges a guest/local cart (e.g. from localStorage) into the user's server cart on login. */
export const mergeCart = asyncHandler(async (req: Request, res: Response) => {
  const { items } = req.body as { items: { productId: string; quantity: number }[] };

  const products = await Product.find({ _id: { $in: items.map((i) => i.productId) }, isActive: true });
  const productMap = new Map(products.map((p) => [p.id as string, p]));

  const cart = await getOrCreateCart(req.user!.id);

  for (const { productId, quantity } of items) {
    const product = productMap.get(productId);
    if (!product) continue;

    const existing = cart.items.find((i) => String(i.product) === productId);
    if (existing) {
      existing.quantity = Math.min(99, existing.quantity + quantity);
      existing.priceAtAdd = product.price;
    } else {
      cart.items.push({ product: product._id, quantity: Math.min(99, quantity), priceAtAdd: product.price } as never);
    }
  }

  await cart.save();
  await cart.populate('items.product', 'title slug images stock price');

  res.status(200).json({ success: true, message: 'Cart merged successfully', data: cart });
});