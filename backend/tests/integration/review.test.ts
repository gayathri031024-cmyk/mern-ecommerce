import request from 'supertest';
import app from '../../src/app';
import User from '@models/User';
import Order from '@models/Order';
import Product from '@models/Product';
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

/** Creates a delivered order for the given user containing the given product, so reviews can be verified-purchase. */
async function createDeliveredOrder(userId: string, productId: string) {
  const user = await User.findById(userId);
  user!.addresses.push({
    label: 'Home',
    line1: '1 Test St',
    city: 'Metropolis',
    state: 'NY',
    postalCode: '10001',
    country: 'US',
  } as never);
  await user!.save();

  return Order.create({
    orderNumber: `ORD-TEST-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    user: userId,
    items: [{ product: productId, title: 'Test product', quantity: 1, unitPrice: 10 }],
    shippingAddress: user!.addresses[0],
    subtotal: 10,
    tax: 0.8,
    shippingFee: 5,
    total: 15.8,
    paymentMethod: 'card',
    status: 'delivered',
  });
}

describe('review routes', () => {
  describe('GET /api/reviews/product/:productId', () => {
    it('returns a paginated, public list of reviews for a product', async () => {
      const product = await createProduct();
      const { accessToken } = await createUser();

      await request(app)
        .post('/api/reviews')
        .set(authHeader(accessToken))
        .send({ productId: product.id, rating: 4, comment: 'Pretty good' });

      const res = await request(app).get(`/api/reviews/product/${product.id}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.items[0].rating).toBe(4);
      expect(res.body.data.meta.totalItems).toBe(1);
    });

    it('rejects a malformed productId with 400', async () => {
      const res = await request(app).get('/api/reviews/product/not-an-object-id');
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/reviews', () => {
    it('requires authentication', async () => {
      const product = await createProduct();
      const res = await request(app)
        .post('/api/reviews')
        .send({ productId: product.id, rating: 5, comment: 'Great!' });
      expect(res.status).toBe(401);
    });

    it('creates a review and marks it unverified when the user has not purchased the product', async () => {
      const product = await createProduct();
      const { accessToken } = await createUser();

      const res = await request(app)
        .post('/api/reviews')
        .set(authHeader(accessToken))
        .send({ productId: product.id, rating: 5, comment: 'Loved it' });

      expect(res.status).toBe(201);
      expect(res.body.data.isVerifiedPurchase).toBe(false);
    });

    it('marks a review as a verified purchase when the user has a delivered order for the product', async () => {
      const product = await createProduct();
      const { user, accessToken } = await createUser();
      await createDeliveredOrder(user.id, product.id);

      const res = await request(app)
        .post('/api/reviews')
        .set(authHeader(accessToken))
        .send({ productId: product.id, rating: 5, comment: 'Exactly as described' });

      expect(res.status).toBe(201);
      expect(res.body.data.isVerifiedPurchase).toBe(true);
    });

    it('recalculates the parent product rating and reviewCount after a review is created', async () => {
      const product = await createProduct();
      const first = await createUser();
      const second = await createUser();

      await request(app)
        .post('/api/reviews')
        .set(authHeader(first.accessToken))
        .send({ productId: product.id, rating: 5, comment: 'Great' });
      await request(app)
        .post('/api/reviews')
        .set(authHeader(second.accessToken))
        .send({ productId: product.id, rating: 3, comment: 'It is fine' });

      const updated = await Product.findById(product.id);
      expect(updated!.reviewCount).toBe(2);
      expect(updated!.rating).toBe(4);
    });

    it('rejects a second review from the same user for the same product with 409', async () => {
      const product = await createProduct();
      const { accessToken } = await createUser();
      await request(app)
        .post('/api/reviews')
        .set(authHeader(accessToken))
        .send({ productId: product.id, rating: 5, comment: 'First review' });

      const res = await request(app)
        .post('/api/reviews')
        .set(authHeader(accessToken))
        .send({ productId: product.id, rating: 2, comment: 'Second attempt' });

      expect(res.status).toBe(409);
    });

    it('rejects a rating outside 1-5 with 400', async () => {
      const product = await createProduct();
      const { accessToken } = await createUser();

      const res = await request(app)
        .post('/api/reviews')
        .set(authHeader(accessToken))
        .send({ productId: product.id, rating: 6, comment: 'Too high' });

      expect(res.status).toBe(400);
    });

    it('rejects an empty comment with 400', async () => {
      const product = await createProduct();
      const { accessToken } = await createUser();

      const res = await request(app)
        .post('/api/reviews')
        .set(authHeader(accessToken))
        .send({ productId: product.id, rating: 4, comment: '   ' });

      expect(res.status).toBe(400);
    });

    it('rejects a malformed productId with 400', async () => {
      const { accessToken } = await createUser();
      const res = await request(app)
        .post('/api/reviews')
        .set(authHeader(accessToken))
        .send({ productId: 'not-an-object-id', rating: 4, comment: 'Fine' });

      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /api/reviews/:id', () => {
    it("updates the review owner's own rating and comment", async () => {
      const product = await createProduct();
      const { accessToken } = await createUser();
      const createRes = await request(app)
        .post('/api/reviews')
        .set(authHeader(accessToken))
        .send({ productId: product.id, rating: 3, comment: 'Okay so far' });

      const res = await request(app)
        .patch(`/api/reviews/${createRes.body.data.id}`)
        .set(authHeader(accessToken))
        .send({ rating: 5, comment: 'Actually great after more use' });

      expect(res.status).toBe(200);
      expect(res.body.data.rating).toBe(5);
      expect(res.body.data.comment).toBe('Actually great after more use');
    });

    it("rejects editing another user's review with 403", async () => {
      const product = await createProduct();
      const owner = await createUser();
      const other = await createUser();
      const createRes = await request(app)
        .post('/api/reviews')
        .set(authHeader(owner.accessToken))
        .send({ productId: product.id, rating: 3, comment: 'Owner review' });

      const res = await request(app)
        .patch(`/api/reviews/${createRes.body.data.id}`)
        .set(authHeader(other.accessToken))
        .send({ rating: 1, comment: 'Trying to hijack' });

      expect(res.status).toBe(403);
    });

    it('returns 404 when the review does not exist', async () => {
      const { accessToken } = await createUser();
      const res = await request(app)
        .patch('/api/reviews/507f1f77bcf86cd799439011')
        .set(authHeader(accessToken))
        .send({ rating: 4 });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/reviews/:id', () => {
    it('lets the owner delete their own review and recalculates product rating', async () => {
      const product = await createProduct();
      const { accessToken } = await createUser();
      const createRes = await request(app)
        .post('/api/reviews')
        .set(authHeader(accessToken))
        .send({ productId: product.id, rating: 5, comment: 'Deleting this later' });

      const res = await request(app)
        .delete(`/api/reviews/${createRes.body.data.id}`)
        .set(authHeader(accessToken));

      expect(res.status).toBe(200);
      const updated = await Product.findById(product.id);
      expect(updated!.reviewCount).toBe(0);
      expect(updated!.rating).toBe(0);

      const listRes = await request(app).get(`/api/reviews/product/${product.id}`);
      expect(listRes.body.data.items).toHaveLength(0);
    });

    it('lets an admin delete any review', async () => {
      const product = await createProduct();
      const owner = await createUser();
      const admin = await createUser({ role: ROLES.ADMIN });
      const createRes = await request(app)
        .post('/api/reviews')
        .set(authHeader(owner.accessToken))
        .send({ productId: product.id, rating: 2, comment: 'Owner review' });

      const res = await request(app)
        .delete(`/api/reviews/${createRes.body.data.id}`)
        .set(authHeader(admin.accessToken));

      expect(res.status).toBe(200);
    });

    it("rejects deleting another customer's review with 403", async () => {
      const product = await createProduct();
      const owner = await createUser();
      const other = await createUser();
      const createRes = await request(app)
        .post('/api/reviews')
        .set(authHeader(owner.accessToken))
        .send({ productId: product.id, rating: 2, comment: 'Owner review' });

      const res = await request(app)
        .delete(`/api/reviews/${createRes.body.data.id}`)
        .set(authHeader(other.accessToken));

      expect(res.status).toBe(403);
    });

    it('returns 404 for a nonexistent review', async () => {
      const { accessToken } = await createUser();
      const res = await request(app)
        .delete('/api/reviews/507f1f77bcf86cd799439011')
        .set(authHeader(accessToken));

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/reviews/bulk-delete', () => {
    it('lets an admin bulk-delete reviews across multiple products and recalculates each rating', async () => {
      const productA = await createProduct();
      const productB = await createProduct();
      const userA = await createUser();
      const userB = await createUser();
      const admin = await createUser({ role: ROLES.ADMIN });

      const resA = await request(app)
        .post('/api/reviews')
        .set(authHeader(userA.accessToken))
        .send({ productId: productA.id, rating: 5, comment: 'Great A' });
      const resB = await request(app)
        .post('/api/reviews')
        .set(authHeader(userB.accessToken))
        .send({ productId: productB.id, rating: 1, comment: 'Bad B' });

      const res = await request(app)
        .post('/api/reviews/bulk-delete')
        .set(authHeader(admin.accessToken))
        .send({ ids: [resA.body.data.id, resB.body.data.id] });

      expect(res.status).toBe(200);
      expect(res.body.data.deletedCount).toBe(2);

      const updatedA = await Product.findById(productA.id);
      const updatedB = await Product.findById(productB.id);
      expect(updatedA!.reviewCount).toBe(0);
      expect(updatedB!.reviewCount).toBe(0);
    });

    it('rejects a non-admin with 403', async () => {
      const { accessToken } = await createUser();
      const res = await request(app)
        .post('/api/reviews/bulk-delete')
        .set(authHeader(accessToken))
        .send({ ids: ['507f1f77bcf86cd799439011'] });

      expect(res.status).toBe(403);
    });

    it('rejects an empty ids array with 400', async () => {
      const admin = await createUser({ role: ROLES.ADMIN });
      const res = await request(app)
        .post('/api/reviews/bulk-delete')
        .set(authHeader(admin.accessToken))
        .send({ ids: [] });

      expect(res.status).toBe(400);
    });
  });
});
