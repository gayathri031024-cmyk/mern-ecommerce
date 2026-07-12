import request from 'supertest';
import app from '../../src/app';
import { connectTestDB, clearTestDB, closeTestDB } from '../helpers/db';
import { createUser, createProduct, createCategory, authHeader } from '../helpers/factories';
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

// The route uses a process-local, in-memory GET cache keyed by full URL
// (path + query string). Each test below uses a query string unique to
// itself (via a unique category/brand) so cached responses from one test
// can never leak into another.

describe('GET /api/products', () => {
  it('lists only active products', async () => {
    const category = await createCategory();
    await createProduct({ categoryId: category.id, isActive: true });
    await createProduct({ categoryId: category.id, isActive: false });

    const res = await request(app).get('/api/products').query({ category: category.id });

    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(1);
  });

  it('paginates results using page/limit/meta', async () => {
    const category = await createCategory();
    await Promise.all(Array.from({ length: 5 }, () => createProduct({ categoryId: category.id })));

    const res = await request(app).get('/api/products').query({ category: category.id, page: 1, limit: 2 });

    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(2);
    expect(res.body.data.meta).toEqual({ page: 1, limit: 2, totalItems: 5, totalPages: 3 });
  });

  it('filters by minPrice/maxPrice', async () => {
    const category = await createCategory();
    await createProduct({ categoryId: category.id, price: 10 });
    await createProduct({ categoryId: category.id, price: 500 });

    const res = await request(app)
      .get('/api/products')
      .query({ category: category.id, minPrice: 100, maxPrice: 1000 });

    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].price).toBe(500);
  });

  it('sorts by price ascending', async () => {
    const category = await createCategory();
    await createProduct({ categoryId: category.id, price: 50, sku: `SORT-HIGH-${category.id}` });
    await createProduct({ categoryId: category.id, price: 5, sku: `SORT-LOW-${category.id}` });

    const res = await request(app)
      .get('/api/products')
      .query({ category: category.id, sort: 'price_asc' });

    expect(res.status).toBe(200);
    const prices = res.body.data.items.map((p: { price: number }) => p.price);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });
});

describe('GET /api/products/:id', () => {
  it('returns a single product by id', async () => {
    const product = await createProduct();
    const res = await request(app).get(`/api/products/${product.id}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(product.id);
  });

  it('returns 404 for a well-formed but nonexistent id', async () => {
    const res = await request(app).get('/api/products/507f1f77bcf86cd799439011');
    expect(res.status).toBe(404);
  });

  it('returns 400 for a malformed id', async () => {
    const res = await request(app).get('/api/products/not-a-valid-id');
    expect(res.status).toBe(400);
  });
});

describe('GET /api/products/slug/:slug', () => {
  it('returns a product by slug', async () => {
    const product = await createProduct({ slug: 'unique-slug-test' });
    const res = await request(app).get('/api/products/slug/unique-slug-test');

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(product.id);
  });

  it('returns 404 for an unknown slug', async () => {
    const res = await request(app).get('/api/products/slug/does-not-exist');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/products', () => {
  it('rejects unauthenticated requests with 401', async () => {
    const res = await request(app).post('/api/products').send({});
    expect(res.status).toBe(401);
  });

  it('rejects customers with 403', async () => {
    const { accessToken } = await createUser({ role: ROLES.CUSTOMER });
    const res = await request(app).post('/api/products').set(authHeader(accessToken)).send({});
    expect(res.status).toBe(403);
  });

  it('allows an admin to create a product', async () => {
    const { accessToken } = await createUser({ role: ROLES.ADMIN });
    const category = await createCategory();

    const res = await request(app).post('/api/products').set(authHeader(accessToken)).send({
      title: 'New Gadget',
      slug: 'new-gadget',
      sku: 'SKU-NEW-GADGET',
      price: 99.99,
      category: category.id,
      stock: 10,
    });

    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe('New Gadget');
  });

  it('forces the vendor field to the authenticated vendor, ignoring a spoofed vendor id', async () => {
    const { user: vendor, accessToken } = await createUser({ role: ROLES.VENDOR });
    const category = await createCategory();

    const res = await request(app).post('/api/products').set(authHeader(accessToken)).send({
      title: 'Vendor Product',
      slug: 'vendor-product',
      sku: 'SKU-VENDOR-PROD',
      price: 20,
      category: category.id,
      vendor: '507f1f77bcf86cd799439011',
    });

    expect(res.status).toBe(201);
    expect(res.body.data.vendor).toBe(vendor.id);
  });

  it('rejects a duplicate SKU with 409', async () => {
    const { accessToken } = await createUser({ role: ROLES.ADMIN });
    const category = await createCategory();
    await createProduct({ sku: 'DUPLICATE-SKU', categoryId: category.id });

    const res = await request(app).post('/api/products').set(authHeader(accessToken)).send({
      title: 'Another Product',
      slug: 'another-product',
      sku: 'DUPLICATE-SKU',
      price: 20,
      category: category.id,
    });

    expect(res.status).toBe(409);
  });

  it('rejects an unknown category with 400', async () => {
    const { accessToken } = await createUser({ role: ROLES.ADMIN });

    const res = await request(app).post('/api/products').set(authHeader(accessToken)).send({
      title: 'Orphan Product',
      slug: 'orphan-product',
      sku: 'SKU-ORPHAN',
      price: 20,
      category: '507f1f77bcf86cd799439011',
    });

    expect(res.status).toBe(400);
  });

  it('rejects a negative price with 400', async () => {
    const { accessToken } = await createUser({ role: ROLES.ADMIN });
    const category = await createCategory();

    const res = await request(app).post('/api/products').set(authHeader(accessToken)).send({
      title: 'Bad Price Product',
      slug: 'bad-price-product',
      sku: 'SKU-BAD-PRICE',
      price: -5,
      category: category.id,
    });

    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/products/:id', () => {
  it('allows an admin to update any product', async () => {
    const { accessToken } = await createUser({ role: ROLES.ADMIN });
    const product = await createProduct({ price: 10 });

    const res = await request(app).patch(`/api/products/${product.id}`).set(authHeader(accessToken)).send({ price: 25 });

    expect(res.status).toBe(200);
    expect(res.body.data.price).toBe(25);
  });

  it('forbids a vendor from updating another vendor\'s product', async () => {
    const { accessToken } = await createUser({ role: ROLES.VENDOR });
    const { user: otherVendor } = await createUser({ role: ROLES.VENDOR });
    const product = await createProduct({ vendor: otherVendor.id });

    const res = await request(app).patch(`/api/products/${product.id}`).set(authHeader(accessToken)).send({ price: 25 });

    expect(res.status).toBe(403);
  });

  it('allows a vendor to update their own product', async () => {
    const { user: vendor, accessToken } = await createUser({ role: ROLES.VENDOR });
    const product = await createProduct({ vendor: vendor.id, price: 10 });

    const res = await request(app).patch(`/api/products/${product.id}`).set(authHeader(accessToken)).send({ price: 30 });

    expect(res.status).toBe(200);
    expect(res.body.data.price).toBe(30);
  });
});

describe('DELETE /api/products/:id', () => {
  it('soft-deletes a product as admin', async () => {
    const { accessToken } = await createUser({ role: ROLES.ADMIN });
    const product = await createProduct();

    const res = await request(app).delete(`/api/products/${product.id}`).set(authHeader(accessToken));
    expect(res.status).toBe(200);

    const getRes = await request(app).get(`/api/products/${product.id}`);
    expect(getRes.status).toBe(404);
  });
});

describe('PATCH /api/products/bulk-stock', () => {
  it('updates stock for multiple products at once', async () => {
    const { accessToken } = await createUser({ role: ROLES.ADMIN });
    const p1 = await createProduct({ stock: 1 });
    const p2 = await createProduct({ stock: 1 });

    const res = await request(app)
      .patch('/api/products/bulk-stock')
      .set(authHeader(accessToken))
      .send({
        updates: [
          { id: p1.id, stock: 50 },
          { id: p2.id, stock: 75 },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.data.updatedCount).toBe(2);
  });
});
