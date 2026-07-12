import request from 'supertest';
import app from '../../src/app';
import Category from '@models/Category';
import { connectTestDB, clearTestDB, closeTestDB } from '../helpers/db';
import { createUser, createProduct, createCategory, authHeader } from '../helpers/factories';
import { ROLES } from '@constants/roles';
import { invalidateCache } from '@middlewares/cache.middleware';

beforeAll(async () => {
  await connectTestDB();
});

afterEach(async () => {
  await clearTestDB();
  // GET /api/categories responses are cached in-process by cacheGet(), keyed
  // by path+querystring. clearTestDB() wipes Mongo but not this cache, so
  // without busting it here a later test with the same query string would
  // see a stale (now-nonexistent) response from an earlier test.
  invalidateCache('/api/categories');
});

afterAll(async () => {
  await closeTestDB();
});

describe('category routes', () => {
  describe('GET /api/categories', () => {
    it('returns a paginated public list of categories', async () => {
      await createCategory({ name: 'Electronics' });
      await createCategory({ name: 'Books' });

      const res = await request(app).get('/api/categories');

      expect(res.status).toBe(200);
      expect(res.body.data.items).toHaveLength(2);
      expect(res.body.data.meta.totalItems).toBe(2);
      expect(res.headers['x-cache']).toBe('MISS');
    });

    it('serves the second identical request from cache', async () => {
      await createCategory({ name: 'Electronics' });

      const first = await request(app).get('/api/categories');
      const second = await request(app).get('/api/categories');

      expect(first.headers['x-cache']).toBe('MISS');
      expect(second.headers['x-cache']).toBe('HIT');
      expect(second.body.data.items).toHaveLength(1);
    });

    it('filters by isActive', async () => {
      await createCategory({ name: 'Active Cat' });
      const inactive = await Category.create({ name: 'Hidden Cat', slug: 'hidden-cat', isActive: false });

      const res = await request(app).get('/api/categories').query({ isActive: 'true' });

      expect(res.status).toBe(200);
      expect(res.body.data.items.map((c: { id: string }) => c.id)).not.toContain(inactive.id);
    });
  });

  describe('GET /api/categories/:id', () => {
    it('returns a single category', async () => {
      const category = await createCategory({ name: 'Toys' });
      const res = await request(app).get(`/api/categories/${category.id}`);

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Toys');
    });

    it('returns 404 for a nonexistent category', async () => {
      const res = await request(app).get('/api/categories/507f1f77bcf86cd799439011');
      expect(res.status).toBe(404);
    });

    it('rejects a malformed id with 400', async () => {
      const res = await request(app).get('/api/categories/not-an-object-id');
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/categories', () => {
    it('requires authentication', async () => {
      const res = await request(app).post('/api/categories').send({ name: 'Toys', slug: 'toys' });
      expect(res.status).toBe(401);
    });

    it('rejects a non-admin with 403', async () => {
      const { accessToken } = await createUser();
      const res = await request(app)
        .post('/api/categories')
        .set(authHeader(accessToken))
        .send({ name: 'Toys', slug: 'toys' });
      expect(res.status).toBe(403);
    });

    it('creates a category as admin', async () => {
      const admin = await createUser({ role: ROLES.ADMIN });
      const res = await request(app)
        .post('/api/categories')
        .set(authHeader(admin.accessToken))
        .send({ name: 'Toys', slug: 'toys', description: 'Fun stuff' });

      expect(res.status).toBe(201);
      expect(res.body.data.slug).toBe('toys');
    });

    it('creates a subcategory when parent exists', async () => {
      const admin = await createUser({ role: ROLES.ADMIN });
      const parent = await createCategory({ name: 'Electronics' });

      const res = await request(app)
        .post('/api/categories')
        .set(authHeader(admin.accessToken))
        .send({ name: 'Laptops', slug: 'laptops', parent: parent.id });

      expect(res.status).toBe(201);
      expect(res.body.data.parent).toBe(parent.id);
    });

    it('rejects a nonexistent parent with 400', async () => {
      const admin = await createUser({ role: ROLES.ADMIN });
      const res = await request(app)
        .post('/api/categories')
        .set(authHeader(admin.accessToken))
        .send({ name: 'Laptops', slug: 'laptops', parent: '507f1f77bcf86cd799439011' });

      expect(res.status).toBe(400);
    });

    it('rejects a duplicate slug with 409', async () => {
      const admin = await createUser({ role: ROLES.ADMIN });
      await createCategory({ name: 'Toys', slug: 'toys' });

      const res = await request(app)
        .post('/api/categories')
        .set(authHeader(admin.accessToken))
        .send({ name: 'Toys Again', slug: 'toys' });

      expect(res.status).toBe(409);
    });

    it('rejects a malformed slug with 400', async () => {
      const admin = await createUser({ role: ROLES.ADMIN });
      const res = await request(app)
        .post('/api/categories')
        .set(authHeader(admin.accessToken))
        .send({ name: 'Toys', slug: 'Not A Slug!' });

      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /api/categories/:id', () => {
    it('updates a category as admin', async () => {
      const admin = await createUser({ role: ROLES.ADMIN });
      const category = await createCategory({ name: 'Toys' });

      const res = await request(app)
        .patch(`/api/categories/${category.id}`)
        .set(authHeader(admin.accessToken))
        .send({ name: 'Toys & Games' });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Toys & Games');
    });

    it('rejects setting a category as its own parent with 400', async () => {
      const admin = await createUser({ role: ROLES.ADMIN });
      const category = await createCategory({ name: 'Toys' });

      const res = await request(app)
        .patch(`/api/categories/${category.id}`)
        .set(authHeader(admin.accessToken))
        .send({ parent: category.id });

      expect(res.status).toBe(400);
    });

    it('rejects changing to a slug already used by another category with 409', async () => {
      const admin = await createUser({ role: ROLES.ADMIN });
      await createCategory({ name: 'Books', slug: 'books' });
      const category = await createCategory({ name: 'Toys', slug: 'toys' });

      const res = await request(app)
        .patch(`/api/categories/${category.id}`)
        .set(authHeader(admin.accessToken))
        .send({ slug: 'books' });

      expect(res.status).toBe(409);
    });

    it('rejects a non-admin with 403', async () => {
      const { accessToken } = await createUser();
      const category = await createCategory();

      const res = await request(app)
        .patch(`/api/categories/${category.id}`)
        .set(authHeader(accessToken))
        .send({ name: 'Hijacked' });

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/categories/:id', () => {
    it('deletes an empty category as admin', async () => {
      const admin = await createUser({ role: ROLES.ADMIN });
      const category = await createCategory();

      const res = await request(app).delete(`/api/categories/${category.id}`).set(authHeader(admin.accessToken));

      expect(res.status).toBe(200);
      const getRes = await request(app).get(`/api/categories/${category.id}`);
      expect(getRes.status).toBe(404);
    });

    it('rejects deleting a category that still has products with 409', async () => {
      const admin = await createUser({ role: ROLES.ADMIN });
      const category = await createCategory();
      await createProduct({ categoryId: category.id });

      const res = await request(app).delete(`/api/categories/${category.id}`).set(authHeader(admin.accessToken));

      expect(res.status).toBe(409);
    });

    it('rejects deleting a category that still has subcategories with 409', async () => {
      const admin = await createUser({ role: ROLES.ADMIN });
      const parent = await createCategory();
      await Category.create({ name: 'Child', slug: 'child-cat', parent: parent._id });

      const res = await request(app).delete(`/api/categories/${parent.id}`).set(authHeader(admin.accessToken));

      expect(res.status).toBe(409);
    });

    it('rejects a non-admin with 403', async () => {
      const { accessToken } = await createUser();
      const category = await createCategory();

      const res = await request(app).delete(`/api/categories/${category.id}`).set(authHeader(accessToken));
      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/categories/bulk-delete', () => {
    it('deletes only the categories with no products assigned, skipping the rest', async () => {
      const admin = await createUser({ role: ROLES.ADMIN });
      const deletable = await createCategory({ name: 'Empty Cat' });
      const blocked = await createCategory({ name: 'Has Products' });
      await createProduct({ categoryId: blocked.id });

      const res = await request(app)
        .post('/api/categories/bulk-delete')
        .set(authHeader(admin.accessToken))
        .send({ ids: [deletable.id, blocked.id] });

      expect(res.status).toBe(200);
      expect(res.body.data.deletedCount).toBe(1);
      expect(res.body.data.skipped).toContain(blocked.id);
    });

    it('rejects a non-admin with 403', async () => {
      const { accessToken } = await createUser();
      const res = await request(app)
        .post('/api/categories/bulk-delete')
        .set(authHeader(accessToken))
        .send({ ids: ['507f1f77bcf86cd799439011'] });

      expect(res.status).toBe(403);
    });

    it('rejects an empty ids array with 400', async () => {
      const admin = await createUser({ role: ROLES.ADMIN });
      const res = await request(app)
        .post('/api/categories/bulk-delete')
        .set(authHeader(admin.accessToken))
        .send({ ids: [] });

      expect(res.status).toBe(400);
    });
  });
});
