import request from 'supertest';
import app from '../../src/app';
import User from '@models/User';
import Product from '@models/Product';
import { connectTestDB, clearTestDB, closeTestDB } from '../helpers/db';
import { createUser, createProduct, authHeader } from '../helpers/factories';
import { ROLES } from '@constants/roles';

jest.mock('@services/email.service', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
  sendOrderConfirmationEmail: jest.fn().mockResolvedValue(undefined),
  sendOrderStatusUpdateEmail: jest.fn().mockResolvedValue(undefined),
}));

beforeAll(async () => {
  await connectTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

afterAll(async () => {
  await closeTestDB();
});

/** Registers an address on the user and adds a product to their cart; returns identifiers needed to place an order. */
async function setUpCheckout(overrides: { stock?: number; price?: number } = {}) {
  const { user, accessToken } = await createUser();
  const product = await createProduct({ stock: overrides.stock ?? 10, price: overrides.price ?? 25 });

  const dbUser = await User.findById(user.id);
  dbUser!.addresses.push({
    label: 'Home',
    line1: '123 Main St',
    city: 'Metropolis',
    state: 'NY',
    postalCode: '10001',
    country: 'US',
  } as never);
  await dbUser!.save();
  const addressId = dbUser!.addresses[0]._id.toString();

  await request(app).post('/api/cart/items').set(authHeader(accessToken)).send({ productId: product.id, quantity: 2 });

  return { user, accessToken, product, addressId };
}

describe('POST /api/orders', () => {
  it('creates an order from the cart, computes totals, and empties the cart', async () => {
    const { accessToken, product, addressId } = await setUpCheckout({ price: 25, stock: 10 });

    const res = await request(app)
      .post('/api/orders')
      .set(authHeader(accessToken))
      .send({ shippingAddressId: addressId, paymentMethod: 'card' });

    expect(res.status).toBe(201);
    expect(res.body.data.subtotal).toBe(50); // 25 * 2
    expect(res.body.data.tax).toBe(4); // 8% of 50
    expect(res.body.data.shippingFee).toBe(5);
    expect(res.body.data.total).toBe(59);
    expect(res.body.data.status).toBe('pending');

    const cartRes = await request(app).get('/api/cart').set(authHeader(accessToken));
    expect(cartRes.body.data.items).toEqual([]);

    const updatedProduct = await Product.findById(product.id);
    expect(updatedProduct!.stock).toBe(8); // 10 - 2
  });

  it('rejects checkout with an empty cart with 400', async () => {
    const { accessToken } = await createUser();

    const res = await request(app)
      .post('/api/orders')
      .set(authHeader(accessToken))
      .send({ shippingAddressId: '507f1f77bcf86cd799439011', paymentMethod: 'card' });

    expect(res.status).toBe(400);
  });

  it('rejects an unknown shippingAddressId with 400', async () => {
    const { accessToken, product } = await setUpCheckout();
    void product;

    const res = await request(app)
      .post('/api/orders')
      .set(authHeader(accessToken))
      .send({ shippingAddressId: '507f1f77bcf86cd799439011', paymentMethod: 'card' });

    expect(res.status).toBe(400);
  });

  it('rejects an invalid paymentMethod with 400', async () => {
    const { accessToken, addressId } = await setUpCheckout();

    const res = await request(app)
      .post('/api/orders')
      .set(authHeader(accessToken))
      .send({ shippingAddressId: addressId, paymentMethod: 'bitcoin' });

    expect(res.status).toBe(400);
  });

  it('rejects checkout when stock became insufficient after items were added to the cart', async () => {
    const { accessToken, product, addressId } = await setUpCheckout({ stock: 2 });

    // Simulate stock drying up after the item was added to the cart.
    await Product.findByIdAndUpdate(product.id, { stock: 1 });

    const res = await request(app)
      .post('/api/orders')
      .set(authHeader(accessToken))
      .send({ shippingAddressId: addressId, paymentMethod: 'card' });

    expect(res.status).toBe(400);
  });
});

describe('GET /api/orders', () => {
  it("returns only the authenticated user's orders", async () => {
    const buyer = await setUpCheckout();
    await request(app).post('/api/orders').set(authHeader(buyer.accessToken)).send({
      shippingAddressId: buyer.addressId,
      paymentMethod: 'card',
    });

    const { accessToken: otherToken } = await createUser();
    const res = await request(app).get('/api/orders').set(authHeader(otherToken));

    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(0);
  });
});

describe('GET /api/orders/:id', () => {
  it('allows the owner to view their order', async () => {
    const buyer = await setUpCheckout();
    const createRes = await request(app).post('/api/orders').set(authHeader(buyer.accessToken)).send({
      shippingAddressId: buyer.addressId,
      paymentMethod: 'card',
    });

    const res = await request(app).get(`/api/orders/${createRes.body.data.id}`).set(authHeader(buyer.accessToken));
    expect(res.status).toBe(200);
  });

  it("forbids a different customer from viewing someone else's order", async () => {
    const buyer = await setUpCheckout();
    const createRes = await request(app).post('/api/orders').set(authHeader(buyer.accessToken)).send({
      shippingAddressId: buyer.addressId,
      paymentMethod: 'card',
    });

    const { accessToken: strangerToken } = await createUser();
    const res = await request(app)
      .get(`/api/orders/${createRes.body.data.id}`)
      .set(authHeader(strangerToken));

    expect(res.status).toBe(403);
  });

  it('allows an admin to view any order', async () => {
    const buyer = await setUpCheckout();
    const createRes = await request(app).post('/api/orders').set(authHeader(buyer.accessToken)).send({
      shippingAddressId: buyer.addressId,
      paymentMethod: 'card',
    });

    const { accessToken: adminToken } = await createUser({ role: ROLES.ADMIN });
    const res = await request(app).get(`/api/orders/${createRes.body.data.id}`).set(authHeader(adminToken));

    expect(res.status).toBe(200);
  });
});

describe('PATCH /api/orders/:id/status', () => {
  it('allows an admin to transition a pending order to processing', async () => {
    const buyer = await setUpCheckout();
    const createRes = await request(app).post('/api/orders').set(authHeader(buyer.accessToken)).send({
      shippingAddressId: buyer.addressId,
      paymentMethod: 'card',
    });

    const { accessToken: adminToken } = await createUser({ role: ROLES.ADMIN });
    const res = await request(app)
      .patch(`/api/orders/${createRes.body.data.id}/status`)
      .set(authHeader(adminToken))
      .send({ status: 'processing' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('processing');
  });

  it('rejects an invalid status transition (pending -> delivered) with 400', async () => {
    const buyer = await setUpCheckout();
    const createRes = await request(app).post('/api/orders').set(authHeader(buyer.accessToken)).send({
      shippingAddressId: buyer.addressId,
      paymentMethod: 'card',
    });

    const { accessToken: adminToken } = await createUser({ role: ROLES.ADMIN });
    const res = await request(app)
      .patch(`/api/orders/${createRes.body.data.id}/status`)
      .set(authHeader(adminToken))
      .send({ status: 'delivered' });

    expect(res.status).toBe(400);
  });

  it('forbids a non-admin customer from updating order status', async () => {
    const buyer = await setUpCheckout();
    const createRes = await request(app).post('/api/orders').set(authHeader(buyer.accessToken)).send({
      shippingAddressId: buyer.addressId,
      paymentMethod: 'card',
    });

    const res = await request(app)
      .patch(`/api/orders/${createRes.body.data.id}/status`)
      .set(authHeader(buyer.accessToken))
      .send({ status: 'processing' });

    expect(res.status).toBe(403);
  });
});

describe('PATCH /api/orders/:id/cancel', () => {
  it('allows the owner to cancel a pending order and restocks the items', async () => {
    const buyer = await setUpCheckout({ stock: 10 });
    const createRes = await request(app).post('/api/orders').set(authHeader(buyer.accessToken)).send({
      shippingAddressId: buyer.addressId,
      paymentMethod: 'card',
    });

    const res = await request(app)
      .patch(`/api/orders/${createRes.body.data.id}/cancel`)
      .set(authHeader(buyer.accessToken));

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('cancelled');

    const restocked = await Product.findById(buyer.product.id);
    expect(restocked!.stock).toBe(10); // 10 - 2 (order) + 2 (cancel restock)
  });

  it('rejects cancelling an already-cancelled order with 400', async () => {
    const buyer = await setUpCheckout();
    const createRes = await request(app).post('/api/orders').set(authHeader(buyer.accessToken)).send({
      shippingAddressId: buyer.addressId,
      paymentMethod: 'card',
    });
    await request(app).patch(`/api/orders/${createRes.body.data.id}/cancel`).set(authHeader(buyer.accessToken));

    const res = await request(app)
      .patch(`/api/orders/${createRes.body.data.id}/cancel`)
      .set(authHeader(buyer.accessToken));

    expect(res.status).toBe(400);
  });
});

describe('GET /api/orders/admin', () => {
  it('forbids non-admins with 403', async () => {
    const { accessToken } = await createUser();
    const res = await request(app).get('/api/orders/admin').set(authHeader(accessToken));
    expect(res.status).toBe(403);
  });

  it('allows an admin to list all orders across users', async () => {
    const buyer = await setUpCheckout();
    await request(app).post('/api/orders').set(authHeader(buyer.accessToken)).send({
      shippingAddressId: buyer.addressId,
      paymentMethod: 'card',
    });

    const { accessToken: adminToken } = await createUser({ role: ROLES.ADMIN });
    const res = await request(app).get('/api/orders/admin').set(authHeader(adminToken));

    expect(res.status).toBe(200);
    expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
  });
});
