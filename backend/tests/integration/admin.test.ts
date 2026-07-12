import request from 'supertest';
import app from '../../src/app';
import Order from '@models/Order';
import { connectTestDB, clearTestDB, closeTestDB } from '../helpers/db';
import { createUser, createProduct, authHeader } from '../helpers/factories';
import { ROLES } from '@constants/roles';

beforeAll(async () => {
  await connectTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

afterAll(async () => {
  await closeTestDB();
});

interface CreateOrderOptions {
  status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  total?: number;
  createdAt?: Date;
}

/** Creates an order document directly (bypassing checkout) with a given status/total/date for aggregation tests. */
async function createOrderFor(userId: string, productId: string, options: CreateOrderOptions = {}) {
  const order = await Order.create({
    orderNumber: `ORD-TEST-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    user: userId,
    items: [{ product: productId, title: 'Test product', quantity: 2, unitPrice: 20 }],
    shippingAddress: {
      line1: '1 Test St',
      city: 'Metropolis',
      state: 'NY',
      postalCode: '10001',
      country: 'US',
    },
    subtotal: 40,
    tax: 3.2,
    shippingFee: 5,
    total: options.total ?? 48.2,
    paymentMethod: 'card',
    status: options.status ?? 'pending',
  });

  if (options.createdAt) {
    await Order.collection.updateOne({ _id: order._id }, { $set: { createdAt: options.createdAt } });
  }
  return order;
}

/** Parses a small CSV string (no embedded commas/newlines in these tests) into header + rows. */
function parseCsv(csv: string): { header: string[]; rows: string[][] } {
  const lines = csv.trim().split('\n');
  return { header: lines[0].split(','), rows: lines.slice(1).map((l) => l.split(',')) };
}

describe('admin routes', () => {
  it('requires authentication on every endpoint', async () => {
    const res = await request(app).get('/api/admin/stats');
    expect(res.status).toBe(401);
  });

  it('rejects a non-admin (customer) with 403', async () => {
    const { accessToken } = await createUser();
    const res = await request(app).get('/api/admin/stats').set(authHeader(accessToken));
    expect(res.status).toBe(403);
  });

  describe('GET /api/admin/stats', () => {
    it('computes totals, per-status counts, and top products, excluding cancelled orders from revenue', async () => {
      const admin = await createUser({ role: ROLES.ADMIN });
      const buyer = await createUser();
      const product = await createProduct();

      await createOrderFor(buyer.user.id, product.id, { status: 'delivered', total: 100 });
      await createOrderFor(buyer.user.id, product.id, { status: 'processing', total: 50 });
      await createOrderFor(buyer.user.id, product.id, { status: 'cancelled', total: 9999 });

      const res = await request(app).get('/api/admin/stats').set(authHeader(admin.accessToken));

      expect(res.status).toBe(200);
      expect(res.body.data.totals.revenue).toBe(150); // cancelled order excluded
      expect(res.body.data.totals.orders).toBe(3);
      expect(res.body.data.totals.products).toBe(1);
      expect(res.body.data.ordersByStatus.delivered).toBe(1);
      expect(res.body.data.ordersByStatus.processing).toBe(1);
      expect(res.body.data.ordersByStatus.cancelled).toBe(1);
      expect(res.body.data.topProducts[0].productId).toBe(product.id);
      expect(res.body.data.topProducts[0].unitsSold).toBe(6); // 2 units x 3 orders
    });

    it('excludes orders older than 30 days from revenueByDay', async () => {
      const admin = await createUser({ role: ROLES.ADMIN });
      const buyer = await createUser();
      const product = await createProduct();

      const oldDate = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000);
      await createOrderFor(buyer.user.id, product.id, { status: 'delivered', total: 100, createdAt: oldDate });

      const res = await request(app).get('/api/admin/stats').set(authHeader(admin.accessToken));

      expect(res.status).toBe(200);
      expect(res.body.data.revenueByDay).toEqual([]);
    });

    it('counts only customers in totals.customers, not admins', async () => {
      const admin = await createUser({ role: ROLES.ADMIN });
      await createUser({ role: ROLES.CUSTOMER });
      await createUser({ role: ROLES.CUSTOMER });
      await createUser({ role: ROLES.ADMIN });

      const res = await request(app).get('/api/admin/stats').set(authHeader(admin.accessToken));

      expect(res.status).toBe(200);
      // 2 explicit customers created above + the admin's own accounts don't count
      expect(res.body.data.totals.customers).toBe(2);
    });
  });

  describe('GET /api/admin/export/orders', () => {
    it('returns a CSV with the correct headers and content-type', async () => {
      const admin = await createUser({ role: ROLES.ADMIN });
      const buyer = await createUser({ name: 'Jane Buyer' });
      const product = await createProduct();
      await createOrderFor(buyer.user.id, product.id, { status: 'delivered', total: 48.2 });

      const res = await request(app).get('/api/admin/export/orders').set(authHeader(admin.accessToken));

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.headers['content-disposition']).toContain('attachment');

      const { header, rows } = parseCsv(res.text);
      expect(header).toContain('Order Number');
      expect(header).toContain('Customer');
      expect(rows).toHaveLength(1);
      expect(rows[0][header.indexOf('Customer')]).toBe('Jane Buyer');
      expect(rows[0][header.indexOf('Status')]).toBe('delivered');
    });

    it('filters by status query param', async () => {
      const admin = await createUser({ role: ROLES.ADMIN });
      const buyer = await createUser();
      const product = await createProduct();
      await createOrderFor(buyer.user.id, product.id, { status: 'delivered' });
      await createOrderFor(buyer.user.id, product.id, { status: 'pending' });

      const res = await request(app)
        .get('/api/admin/export/orders')
        .query({ status: 'pending' })
        .set(authHeader(admin.accessToken));

      const { rows, header } = parseCsv(res.text);
      expect(rows).toHaveLength(1);
      expect(rows[0][header.indexOf('Status')]).toBe('pending');
    });

    it('rejects a non-admin with 403', async () => {
      const { accessToken } = await createUser();
      const res = await request(app).get('/api/admin/export/orders').set(authHeader(accessToken));
      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/admin/export/products', () => {
    it('returns a CSV listing product fields', async () => {
      const admin = await createUser({ role: ROLES.ADMIN });
      await createProduct({ title: 'Wireless Mouse', price: 29.99, stock: 15 });

      const res = await request(app).get('/api/admin/export/products').set(authHeader(admin.accessToken));

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      const { header, rows } = parseCsv(res.text);
      expect(header).toContain('SKU');
      expect(rows.some((r) => r[header.indexOf('Title')] === 'Wireless Mouse')).toBe(true);
    });

    it('rejects a non-admin with 403', async () => {
      const { accessToken } = await createUser();
      const res = await request(app).get('/api/admin/export/products').set(authHeader(accessToken));
      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/admin/export/users', () => {
    it('returns a CSV listing users with a computed reviews-written count', async () => {
      const admin = await createUser({ role: ROLES.ADMIN });
      const { user } = await createUser({ name: 'Review Writer' });

      const res = await request(app).get('/api/admin/export/users').set(authHeader(admin.accessToken));

      expect(res.status).toBe(200);
      const { header, rows } = parseCsv(res.text);
      expect(header).toContain('Reviews Written');
      const row = rows.find((r) => r[header.indexOf('Email')] === user.email);
      expect(row).toBeDefined();
      expect(row![header.indexOf('Reviews Written')]).toBe('0');
    });

    it('filters by role query param', async () => {
      const admin = await createUser({ role: ROLES.ADMIN });
      await createUser({ role: ROLES.CUSTOMER });

      const res = await request(app)
        .get('/api/admin/export/users')
        .query({ role: 'admin' })
        .set(authHeader(admin.accessToken));

      const { header, rows } = parseCsv(res.text);
      expect(rows.every((r) => r[header.indexOf('Role')] === 'admin')).toBe(true);
    });

    it('rejects a non-admin with 403', async () => {
      const { accessToken } = await createUser();
      const res = await request(app).get('/api/admin/export/users').set(authHeader(accessToken));
      expect(res.status).toBe(403);
    });
  });
});
