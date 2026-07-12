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

describe('cart routes', () => {
  it('requires authentication on every endpoint', async () => {
    const res = await request(app).get('/api/cart');
    expect(res.status).toBe(401);
  });

  it('returns an empty cart for a new user', async () => {
    const { accessToken } = await createUser();
    const res = await request(app).get('/api/cart').set(authHeader(accessToken));

    expect(res.status).toBe(200);
    expect(res.body.data.items).toEqual([]);
  });

  describe('POST /api/cart/items', () => {
    it('adds a product to the cart', async () => {
      const { accessToken } = await createUser();
      const product = await createProduct({ stock: 5, price: 19.99 });

      const res = await request(app)
        .post('/api/cart/items')
        .set(authHeader(accessToken))
        .send({ productId: product.id, quantity: 2 });

      expect(res.status).toBe(200);
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.items[0].quantity).toBe(2);
      expect(res.body.data.items[0].priceAtAdd).toBe(19.99);
    });

    it('increments quantity (capped at 99) when adding an already-present product again', async () => {
      const { accessToken } = await createUser();
      const product = await createProduct({ stock: 200 });

      await request(app).post('/api/cart/items').set(authHeader(accessToken)).send({ productId: product.id, quantity: 60 });
      const res = await request(app)
        .post('/api/cart/items')
        .set(authHeader(accessToken))
        .send({ productId: product.id, quantity: 60 });

      expect(res.status).toBe(200);
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.items[0].quantity).toBe(99);
    });

    it('rejects a request for a nonexistent product with 404', async () => {
      const { accessToken } = await createUser();
      const res = await request(app)
        .post('/api/cart/items')
        .set(authHeader(accessToken))
        .send({ productId: '507f1f77bcf86cd799439011', quantity: 1 });

      expect(res.status).toBe(404);
    });

    it('rejects a request when quantity exceeds available stock with 400', async () => {
      const { accessToken } = await createUser();
      const product = await createProduct({ stock: 1 });

      const res = await request(app)
        .post('/api/cart/items')
        .set(authHeader(accessToken))
        .send({ productId: product.id, quantity: 5 });

      expect(res.status).toBe(400);
    });

    it('rejects an inactive product with 404', async () => {
      const { accessToken } = await createUser();
      const product = await createProduct({ isActive: false });

      const res = await request(app)
        .post('/api/cart/items')
        .set(authHeader(accessToken))
        .send({ productId: product.id, quantity: 1 });

      expect(res.status).toBe(404);
    });

    it('rejects a malformed productId with 400', async () => {
      const { accessToken } = await createUser();
      const res = await request(app)
        .post('/api/cart/items')
        .set(authHeader(accessToken))
        .send({ productId: 'not-an-object-id', quantity: 1 });

      expect(res.status).toBe(400);
    });

    it('rejects quantity outside the 1-99 range with 400', async () => {
      const { accessToken } = await createUser();
      const product = await createProduct({ stock: 200 });

      const res = await request(app)
        .post('/api/cart/items')
        .set(authHeader(accessToken))
        .send({ productId: product.id, quantity: 150 });

      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /api/cart/items/:productId', () => {
    it('updates the quantity of an existing item', async () => {
      const { accessToken } = await createUser();
      const product = await createProduct({ stock: 10 });
      await request(app).post('/api/cart/items').set(authHeader(accessToken)).send({ productId: product.id, quantity: 1 });

      const res = await request(app)
        .patch(`/api/cart/items/${product.id}`)
        .set(authHeader(accessToken))
        .send({ quantity: 4 });

      expect(res.status).toBe(200);
      expect(res.body.data.items[0].quantity).toBe(4);
    });

    it('returns 404 when the item is not in the cart', async () => {
      const { accessToken } = await createUser();
      const product = await createProduct();

      const res = await request(app)
        .patch(`/api/cart/items/${product.id}`)
        .set(authHeader(accessToken))
        .send({ quantity: 2 });

      expect(res.status).toBe(404);
    });

    it('returns 400 when the requested quantity exceeds stock', async () => {
      const { accessToken } = await createUser();
      const product = await createProduct({ stock: 3 });
      await request(app).post('/api/cart/items').set(authHeader(accessToken)).send({ productId: product.id, quantity: 1 });

      const res = await request(app)
        .patch(`/api/cart/items/${product.id}`)
        .set(authHeader(accessToken))
        .send({ quantity: 10 });

      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/cart/items/:productId', () => {
    it('removes an item from the cart', async () => {
      const { accessToken } = await createUser();
      const product = await createProduct();
      await request(app).post('/api/cart/items').set(authHeader(accessToken)).send({ productId: product.id, quantity: 1 });

      const res = await request(app).delete(`/api/cart/items/${product.id}`).set(authHeader(accessToken));

      expect(res.status).toBe(200);
      expect(res.body.data.items).toHaveLength(0);
    });

    it('returns 404 when removing an item not in the cart', async () => {
      const { accessToken } = await createUser();
      const product = await createProduct();

      const res = await request(app).delete(`/api/cart/items/${product.id}`).set(authHeader(accessToken));
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/cart', () => {
    it('empties the cart', async () => {
      const { accessToken } = await createUser();
      const product = await createProduct();
      await request(app).post('/api/cart/items').set(authHeader(accessToken)).send({ productId: product.id, quantity: 1 });

      const res = await request(app).delete('/api/cart').set(authHeader(accessToken));

      expect(res.status).toBe(200);
      expect(res.body.data.items).toEqual([]);
    });
  });

  describe('POST /api/cart/merge', () => {
    it('merges guest cart items into the server cart', async () => {
      const { accessToken } = await createUser();
      const productA = await createProduct({ stock: 10 });
      const productB = await createProduct({ stock: 10 });

      const res = await request(app)
        .post('/api/cart/merge')
        .set(authHeader(accessToken))
        .send({
          items: [
            { productId: productA.id, quantity: 2 },
            { productId: productB.id, quantity: 3 },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.data.items).toHaveLength(2);
    });

    it('silently skips items referencing an inactive/nonexistent product', async () => {
      const { accessToken } = await createUser();
      const res = await request(app)
        .post('/api/cart/merge')
        .set(authHeader(accessToken))
        .send({ items: [{ productId: '507f1f77bcf86cd799439011', quantity: 1 }] });

      expect(res.status).toBe(200);
      expect(res.body.data.items).toHaveLength(0);
    });

    it('rejects a non-array items payload with 400', async () => {
      const { accessToken } = await createUser();
      const res = await request(app).post('/api/cart/merge').set(authHeader(accessToken)).send({ items: 'nope' });
      expect(res.status).toBe(400);
    });
  });
});
