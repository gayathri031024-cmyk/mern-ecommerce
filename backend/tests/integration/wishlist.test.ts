import request from 'supertest';
import app from '../../src/app';
import { connectTestDB, clearTestDB, closeTestDB } from '../helpers/db';
import { createUser, createProduct, authHeader } from '../helpers/factories';

beforeAll(async () => {
  await connectTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

afterAll(async () => {
  await closeTestDB();
});

describe('wishlist routes', () => {
  it('requires authentication on every endpoint', async () => {
    const res = await request(app).get('/api/wishlist');
    expect(res.status).toBe(401);
  });

  it('returns an empty wishlist for a new user, creating it lazily', async () => {
    const { accessToken } = await createUser();
    const res = await request(app).get('/api/wishlist').set(authHeader(accessToken));

    expect(res.status).toBe(200);
    expect(res.body.data.products).toEqual([]);
  });

  describe('POST /api/wishlist/:productId', () => {
    it('adds a product to the wishlist', async () => {
      const { accessToken } = await createUser();
      const product = await createProduct();

      const res = await request(app).post(`/api/wishlist/${product.id}`).set(authHeader(accessToken));

      expect(res.status).toBe(200);
      expect(res.body.data.products).toHaveLength(1);
      expect(res.body.data.products[0].id).toBe(product.id);
    });

    it('is idempotent when adding the same product twice', async () => {
      const { accessToken } = await createUser();
      const product = await createProduct();

      await request(app).post(`/api/wishlist/${product.id}`).set(authHeader(accessToken));
      const res = await request(app).post(`/api/wishlist/${product.id}`).set(authHeader(accessToken));

      expect(res.status).toBe(200);
      expect(res.body.data.products).toHaveLength(1);
    });

    it('returns 404 for a nonexistent product', async () => {
      const { accessToken } = await createUser();
      const res = await request(app)
        .post('/api/wishlist/507f1f77bcf86cd799439011')
        .set(authHeader(accessToken));

      expect(res.status).toBe(404);
    });

    it('rejects a malformed productId with 400', async () => {
      const { accessToken } = await createUser();
      const res = await request(app).post('/api/wishlist/not-an-object-id').set(authHeader(accessToken));

      expect(res.status).toBe(400);
    });

    it("keeps wishlists scoped per-user", async () => {
      const first = await createUser();
      const second = await createUser();
      const product = await createProduct();

      await request(app).post(`/api/wishlist/${product.id}`).set(authHeader(first.accessToken));
      const res = await request(app).get('/api/wishlist').set(authHeader(second.accessToken));

      expect(res.body.data.products).toEqual([]);
    });
  });

  describe('DELETE /api/wishlist/:productId', () => {
    it('removes a product from the wishlist', async () => {
      const { accessToken } = await createUser();
      const product = await createProduct();
      await request(app).post(`/api/wishlist/${product.id}`).set(authHeader(accessToken));

      const res = await request(app).delete(`/api/wishlist/${product.id}`).set(authHeader(accessToken));

      expect(res.status).toBe(200);
      expect(res.body.data.products).toEqual([]);
    });

    it('is a no-op (200) when removing a product that was never added', async () => {
      const { accessToken } = await createUser();
      const product = await createProduct();

      const res = await request(app).delete(`/api/wishlist/${product.id}`).set(authHeader(accessToken));

      expect(res.status).toBe(200);
      expect(res.body.data.products).toEqual([]);
    });

    it('rejects a malformed productId with 400', async () => {
      const { accessToken } = await createUser();
      const res = await request(app).delete('/api/wishlist/not-an-object-id').set(authHeader(accessToken));

      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/wishlist', () => {
    it('clears the whole wishlist', async () => {
      const { accessToken } = await createUser();
      const productA = await createProduct();
      const productB = await createProduct();
      await request(app).post(`/api/wishlist/${productA.id}`).set(authHeader(accessToken));
      await request(app).post(`/api/wishlist/${productB.id}`).set(authHeader(accessToken));

      const res = await request(app).delete('/api/wishlist').set(authHeader(accessToken));

      expect(res.status).toBe(200);
      expect(res.body.data.products).toEqual([]);
    });
  });

  describe('POST /api/wishlist/bulk-add', () => {
    it('adds multiple valid products at once', async () => {
      const { accessToken } = await createUser();
      const productA = await createProduct();
      const productB = await createProduct();

      const res = await request(app)
        .post('/api/wishlist/bulk-add')
        .set(authHeader(accessToken))
        .send({ productIds: [productA.id, productB.id] });

      expect(res.status).toBe(200);
      expect(res.body.data.products).toHaveLength(2);
      expect(res.body.data.deletedCount).toBeUndefined();
    });

    it('silently skips ids that do not match a real product', async () => {
      const { accessToken } = await createUser();
      const product = await createProduct();

      const res = await request(app)
        .post('/api/wishlist/bulk-add')
        .set(authHeader(accessToken))
        .send({ productIds: [product.id, '507f1f77bcf86cd799439011'] });

      expect(res.status).toBe(200);
      expect(res.body.data.products).toHaveLength(1);
    });

    it('does not duplicate a product that is already in the wishlist', async () => {
      const { accessToken } = await createUser();
      const product = await createProduct();
      await request(app).post(`/api/wishlist/${product.id}`).set(authHeader(accessToken));

      const res = await request(app)
        .post('/api/wishlist/bulk-add')
        .set(authHeader(accessToken))
        .send({ productIds: [product.id] });

      expect(res.status).toBe(200);
      expect(res.body.data.products).toHaveLength(1);
    });

    it('rejects an empty productIds array with 400', async () => {
      const { accessToken } = await createUser();
      const res = await request(app)
        .post('/api/wishlist/bulk-add')
        .set(authHeader(accessToken))
        .send({ productIds: [] });

      expect(res.status).toBe(400);
    });

    it('rejects a payload containing invalid ObjectId strings with 400', async () => {
      const { accessToken } = await createUser();
      const res = await request(app)
        .post('/api/wishlist/bulk-add')
        .set(authHeader(accessToken))
        .send({ productIds: ['not-an-object-id'] });

      expect(res.status).toBe(400);
    });
  });
});
