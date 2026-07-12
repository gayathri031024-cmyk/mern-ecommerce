import { Request, Response } from 'express';
import Order from '@models/Order';
import Product from '@models/Product';
import User from '@models/User';
import Review from '@models/Review';
import { asyncHandler } from '@utils/asyncHandler';
import { toCsv } from '@utils/csv';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Aggregated numbers for the admin dashboard: headline stats, revenue over
 * the last 30 days, order counts by status, and top-selling products.
 */
export const getDashboardStats = asyncHandler(async (_req: Request, res: Response) => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * DAY_MS);

  const [
    totalRevenueAgg,
    totalOrders,
    totalProducts,
    totalCustomers,
    ordersByStatus,
    revenueByDay,
    topProducts,
    recentSignups,
  ] = await Promise.all([
    Order.aggregate([
      { $match: { status: { $nin: ['cancelled'] } } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
    Order.countDocuments(),
    Product.countDocuments(),
    User.countDocuments({ role: 'customer' }),
    Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Order.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo }, status: { $nin: ['cancelled'] } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Order.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          title: { $first: '$items.title' },
          unitsSold: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.quantity', '$items.unitPrice'] } },
        },
      },
      { $sort: { unitsSold: -1 } },
      { $limit: 5 },
    ]),
    User.countDocuments({ role: 'customer', createdAt: { $gte: thirtyDaysAgo } }),
  ]);

  const statusCounts: Record<string, number> = {};
  for (const entry of ordersByStatus as { _id: string; count: number }[]) {
    statusCounts[entry._id] = entry.count;
  }

  res.status(200).json({
    success: true,
    message: 'Dashboard statistics retrieved successfully',
    data: {
      totals: {
        revenue: totalRevenueAgg[0]?.total ?? 0,
        orders: totalOrders,
        products: totalProducts,
        customers: totalCustomers,
        recentSignups,
      },
      ordersByStatus: statusCounts,
      revenueByDay: (revenueByDay as { _id: string; revenue: number; orders: number }[]).map((r) => ({
        date: r._id,
        revenue: r.revenue,
        orders: r.orders,
      })),
      topProducts: (topProducts as { _id: unknown; title: string; unitsSold: number; revenue: number }[]).map(
        (p) => ({
          productId: String(p._id),
          title: p.title,
          unitsSold: p.unitsSold,
          revenue: p.revenue,
        }),
      ),
    },
  });
});

export const exportOrdersCsv = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.query;
  const filter: Record<string, unknown> = {};
  if (status) filter.status = status as string;

  const orders = await Order.find(filter).populate('user', 'name email').sort({ createdAt: -1 });

  const csv = toCsv(orders, [
    { header: 'Order Number', accessor: (o) => o.orderNumber },
    { header: 'Customer', accessor: (o) => (o.user as unknown as { name?: string })?.name ?? '' },
    { header: 'Email', accessor: (o) => (o.user as unknown as { email?: string })?.email ?? '' },
    { header: 'Status', accessor: (o) => o.status },
    { header: 'Items', accessor: (o) => o.items.length },
    { header: 'Subtotal', accessor: (o) => o.subtotal },
    { header: 'Shipping', accessor: (o) => o.shippingFee },
    { header: 'Tax', accessor: (o) => o.tax },
    { header: 'Total', accessor: (o) => o.total },
    { header: 'Payment Method', accessor: (o) => o.paymentMethod },
    { header: 'Placed At', accessor: (o) => o.createdAt.toISOString() },
  ]);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="orders-export-${Date.now()}.csv"`);
  res.status(200).send(csv);
});

export const exportProductsCsv = asyncHandler(async (req: Request, res: Response) => {
  const { category } = req.query;
  const filter: Record<string, unknown> = {};
  if (category) filter.category = category as string;

  const products = await Product.find(filter).populate('category', 'name').sort({ createdAt: -1 });

  const csv = toCsv(products, [
    { header: 'Title', accessor: (p) => p.title },
    { header: 'SKU', accessor: (p) => p.sku },
    { header: 'Category', accessor: (p) => (p.category as unknown as { name?: string })?.name ?? '' },
    { header: 'Price', accessor: (p) => p.price },
    { header: 'Compare At Price', accessor: (p) => p.compareAtPrice ?? '' },
    { header: 'Stock', accessor: (p) => p.stock },
    { header: 'Rating', accessor: (p) => p.rating },
    { header: 'Review Count', accessor: (p) => p.reviewCount },
    { header: 'Active', accessor: (p) => p.isActive },
    { header: 'Created At', accessor: (p) => p.createdAt.toISOString() },
  ]);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="products-export-${Date.now()}.csv"`);
  res.status(200).send(csv);
});

export const exportUsersCsv = asyncHandler(async (req: Request, res: Response) => {
  const { role } = req.query;
  const filter: Record<string, unknown> = {};
  if (role) filter.role = role as string;

  const users = await User.find(filter).sort({ createdAt: -1 });
  const reviewCounts = await Review.aggregate([{ $group: { _id: '$user', count: { $sum: 1 } } }]);
  const reviewCountByUser = new Map(
    (reviewCounts as { _id: unknown; count: number }[]).map((r) => [String(r._id), r.count]),
  );

  const csv = toCsv(users, [
    { header: 'Name', accessor: (u) => u.name },
    { header: 'Email', accessor: (u) => u.email },
    { header: 'Role', accessor: (u) => u.role },
    { header: 'Email Verified', accessor: (u) => u.isEmailVerified },
    { header: 'Reviews Written', accessor: (u) => reviewCountByUser.get(String(u._id)) ?? 0 },
    { header: 'Joined At', accessor: (u) => u.createdAt.toISOString() },
  ]);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="users-export-${Date.now()}.csv"`);
  res.status(200).send(csv);
});