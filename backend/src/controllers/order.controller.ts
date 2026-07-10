import { Request, Response } from 'express';
import { FilterQuery } from 'mongoose';
import Order, { IOrder, OrderStatus } from '@models/Order';
import Cart from '@models/Cart';
import Product from '@models/Product';
import User from '@models/User';
import { ROLES } from '@constants/roles';
import { asyncHandler } from '@utils/asyncHandler';
import { AppError } from '@utils/AppError';
import { getPagination, buildMeta, buildSort } from '@utils/queryHelpers';

const SORTABLE_FIELDS = ['createdAt', 'total', 'status'];
const FLAT_SHIPPING_FEE = 5;
const TAX_RATE = 0.08;

// Statuses an order may transition *from* to reach a given next status, used
// to reject nonsensical jumps like pending -> delivered.
const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: ['refunded'],
  cancelled: [],
  refunded: [],
};

function generateOrderNumber(): string {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `ORD-${datePart}-${randomPart}`;
}

export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const { shippingAddressId, paymentMethod } = req.body as { shippingAddressId: string; paymentMethod: string };
  const userId = req.user!.id;

  const [user, cart] = await Promise.all([User.findById(userId), Cart.findOne({ user: userId }).populate('items.product')]);
  if (!user) throw AppError.notFound('User not found');
  if (!cart || cart.items.length === 0) throw AppError.badRequest('Your cart is empty');

  const address = user.addresses.id(shippingAddressId);
  if (!address) throw AppError.badRequest('shippingAddressId does not match any saved address');

  // Re-validate stock at checkout time (it may have changed since items were added to the cart).
  for (const item of cart.items) {
    const product = item.product as unknown as { stock: number; title: string };
    if (!product || product.stock < item.quantity) {
      throw AppError.badRequest(`Insufficient stock for "${product?.title ?? 'a product'}"`);
    }
  }

  const subtotal = Math.round(cart.items.reduce((sum, i) => sum + i.priceAtAdd * i.quantity, 0) * 100) / 100;
  const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
  const shippingFee = subtotal > 0 ? FLAT_SHIPPING_FEE : 0;
  const total = Math.round((subtotal + tax + shippingFee) * 100) / 100;

  const order = await Order.create({
    orderNumber: generateOrderNumber(),
    user: userId,
    items: cart.items.map((i) => {
      const product = i.product as unknown as { _id: unknown; title: string; images: { url: string }[] };
      return {
        product: product._id,
        title: product.title,
        image: product.images?.[0]?.url,
        quantity: i.quantity,
        unitPrice: i.priceAtAdd,
      };
    }),
    shippingAddress: {
      label: address.label,
      line1: address.line1,
      line2: address.line2,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
    },
    paymentMethod,
    subtotal,
    shippingFee,
    tax,
    total,
  });

  // Decrement stock for each purchased product.
  await Promise.all(
    cart.items.map((i) => Product.findByIdAndUpdate(i.product, { $inc: { stock: -i.quantity } })),
  );

  cart.items = [] as never;
  await cart.save();

  res.status(201).json({ success: true, message: 'Order placed successfully', data: order });
});

export const getMyOrders = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req);
  const sort = buildSort(req.query.sort, SORTABLE_FIELDS);
  const { status } = req.query;

  const filter: FilterQuery<IOrder> = { user: req.user!.id };
  if (status) filter.status = status as string;

  const [items, totalItems] = await Promise.all([
    Order.find(filter).sort(sort).skip(skip).limit(limit),
    Order.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    message: 'Orders retrieved successfully',
    data: { items, meta: buildMeta(page, limit, totalItems) },
  });
});

export const getAllOrders = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = getPagination(req);
  const sort = buildSort(req.query.sort, SORTABLE_FIELDS);
  const { status, user, search } = req.query;

  const filter: FilterQuery<IOrder> = {};
  if (status) filter.status = status as string;
  if (user) filter.user = user as string;
  if (search) filter.orderNumber = new RegExp(search as string, 'i');

  const [items, totalItems] = await Promise.all([
    Order.find(filter).populate('user', 'name email').sort(sort).skip(skip).limit(limit),
    Order.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    message: 'Orders retrieved successfully',
    data: { items, meta: buildMeta(page, limit, totalItems) },
  });
});

export const getOrderById = asyncHandler(async (req: Request, res: Response) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (!order) throw AppError.notFound('Order not found');

  const isOwner = String(order.user) === req.user!.id || String((order.user as unknown as { _id: unknown })._id) === req.user!.id;
  if (!isOwner && req.user!.role !== ROLES.ADMIN) {
    throw AppError.forbidden('You do not have permission to view this order');
  }

  res.status(200).json({ success: true, message: 'Order retrieved successfully', data: order });
});

export const updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status, note } = req.body as { status: OrderStatus; note?: string };

  const order = await Order.findById(req.params.id);
  if (!order) throw AppError.notFound('Order not found');

  if (!ALLOWED_TRANSITIONS[order.status].includes(status)) {
    throw AppError.badRequest(`Cannot transition order from "${order.status}" to "${status}"`);
  }

  order.status = status;
  if (note) order.statusHistory[order.statusHistory.length - 1].note = note;
  await order.save();

  res.status(200).json({ success: true, message: 'Order status updated', data: order });
});

export const cancelOrder = asyncHandler(async (req: Request, res: Response) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw AppError.notFound('Order not found');

  const isOwner = String(order.user) === req.user!.id;
  if (!isOwner && req.user!.role !== ROLES.ADMIN) {
    throw AppError.forbidden('You do not have permission to cancel this order');
  }
  if (!ALLOWED_TRANSITIONS[order.status].includes('cancelled')) {
    throw AppError.badRequest(`Order in status "${order.status}" can no longer be cancelled`);
  }

  order.status = 'cancelled';
  await order.save();

  // Restock cancelled items.
  await Promise.all(order.items.map((i) => Product.findByIdAndUpdate(i.product, { $inc: { stock: i.quantity } })));

  res.status(200).json({ success: true, message: 'Order cancelled', data: order });
});

export const deleteOrder = asyncHandler(async (req: Request, res: Response) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw AppError.notFound('Order not found');

  await order.softDelete(req.user?.id);

  res.status(200).json({ success: true, message: 'Order archived successfully' });
});

export const bulkUpdateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const { ids, status } = req.body as { ids: string[]; status: OrderStatus };

  const orders = await Order.find({ _id: { $in: ids } });
  const updatable = orders.filter((o) => ALLOWED_TRANSITIONS[o.status].includes(status));

  await Promise.all(
    updatable.map((o) => {
      o.status = status;
      return o.save();
    }),
  );

  res.status(200).json({
    success: true,
    message: `${updatable.length} order${updatable.length === 1 ? '' : 's'} updated`,
    data: {
      updatedCount: updatable.length,
      skipped: orders.filter((o) => !updatable.includes(o)).map((o) => o.id),
    },
  });
});