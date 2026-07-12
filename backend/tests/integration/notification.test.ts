import request from 'supertest';
import app from '../../src/app';
import Notification from '@models/Notification';
import { connectTestDB, clearTestDB, closeTestDB } from '../helpers/db';
import { createUser, authHeader } from '../helpers/factories';

beforeAll(async () => {
  await connectTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

afterAll(async () => {
  await closeTestDB();
});

/** Creates a notification document directly — there's no public "create" endpoint (only the internal service). */
async function createNotificationFor(
  userId: string,
  overrides: Partial<{ title: string; isRead: boolean; type: string }> = {},
) {
  return Notification.create({
    user: userId,
    type: overrides.type ?? 'system',
    title: overrides.title ?? 'Test notification',
    message: 'Something happened',
    isRead: overrides.isRead ?? false,
  });
}

describe('notification routes', () => {
  it('requires authentication on every endpoint', async () => {
    const res = await request(app).get('/api/notifications');
    expect(res.status).toBe(401);
  });

  describe('GET /api/notifications', () => {
    it("returns only the authenticated user's notifications, newest first, with an unread count", async () => {
      const { user, accessToken } = await createUser();
      const other = await createUser();
      await createNotificationFor(other.user.id, { title: 'Not mine' });
      const first = await createNotificationFor(user.id, { title: 'First' });
      await new Promise((resolve) => setTimeout(resolve, 5));
      const second = await createNotificationFor(user.id, { title: 'Second' });

      const res = await request(app).get('/api/notifications').set(authHeader(accessToken));

      expect(res.status).toBe(200);
      expect(res.body.data.items).toHaveLength(2);
      expect(res.body.data.items[0].id).toBe(second.id);
      expect(res.body.data.items[1].id).toBe(first.id);
      expect(res.body.data.unreadCount).toBe(2);
    });

    it('filters to unread only when unreadOnly=true, while unreadCount still reflects the true total', async () => {
      const { user, accessToken } = await createUser();
      await createNotificationFor(user.id, { title: 'Read one', isRead: true });
      await createNotificationFor(user.id, { title: 'Unread one', isRead: false });

      const res = await request(app)
        .get('/api/notifications')
        .query({ unreadOnly: 'true' })
        .set(authHeader(accessToken));

      expect(res.status).toBe(200);
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.items[0].title).toBe('Unread one');
      expect(res.body.data.unreadCount).toBe(1);
    });

    it('paginates results', async () => {
      const { user, accessToken } = await createUser();
      for (let i = 0; i < 3; i += 1) {
        await createNotificationFor(user.id, { title: `Notif ${i}` });
      }

      const res = await request(app)
        .get('/api/notifications')
        .query({ page: 1, limit: 2 })
        .set(authHeader(accessToken));

      expect(res.body.data.items).toHaveLength(2);
      expect(res.body.data.meta.totalItems).toBe(3);
      expect(res.body.data.meta.totalPages).toBe(2);
    });
  });

  describe('PATCH /api/notifications/:id/read', () => {
    it("marks the caller's own notification as read", async () => {
      const { user, accessToken } = await createUser();
      const notification = await createNotificationFor(user.id);

      const res = await request(app)
        .patch(`/api/notifications/${notification.id}/read`)
        .set(authHeader(accessToken));

      expect(res.status).toBe(200);
      expect(res.body.data.isRead).toBe(true);
    });

    it("returns 404 for another user's notification (scoped by owner, not just existence)", async () => {
      const owner = await createUser();
      const other = await createUser();
      const notification = await createNotificationFor(owner.user.id);

      const res = await request(app)
        .patch(`/api/notifications/${notification.id}/read`)
        .set(authHeader(other.accessToken));

      expect(res.status).toBe(404);
    });

    it('returns 404 for a nonexistent notification', async () => {
      const { accessToken } = await createUser();
      const res = await request(app)
        .patch('/api/notifications/507f1f77bcf86cd799439011/read')
        .set(authHeader(accessToken));

      expect(res.status).toBe(404);
    });

    it('rejects a malformed id with 400', async () => {
      const { accessToken } = await createUser();
      const res = await request(app)
        .patch('/api/notifications/not-an-object-id/read')
        .set(authHeader(accessToken));

      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /api/notifications/read-all', () => {
    it("marks all of the caller's unread notifications as read and reports the count", async () => {
      const { user, accessToken } = await createUser();
      await createNotificationFor(user.id, { isRead: false });
      await createNotificationFor(user.id, { isRead: false });
      await createNotificationFor(user.id, { isRead: true });

      const res = await request(app).patch('/api/notifications/read-all').set(authHeader(accessToken));

      expect(res.status).toBe(200);
      expect(res.body.data.updatedCount).toBe(2);

      const listRes = await request(app)
        .get('/api/notifications')
        .query({ unreadOnly: 'true' })
        .set(authHeader(accessToken));
      expect(listRes.body.data.items).toHaveLength(0);
    });

    it("does not touch another user's notifications", async () => {
      const { accessToken } = await createUser();
      const other = await createUser();
      await createNotificationFor(other.user.id, { isRead: false });

      await request(app).patch('/api/notifications/read-all').set(authHeader(accessToken));

      const untouched = await Notification.findOne({ user: other.user.id });
      expect(untouched!.isRead).toBe(false);
    });
  });

  describe('DELETE /api/notifications/:id', () => {
    it("deletes the caller's own notification", async () => {
      const { user, accessToken } = await createUser();
      const notification = await createNotificationFor(user.id);

      const res = await request(app)
        .delete(`/api/notifications/${notification.id}`)
        .set(authHeader(accessToken));

      expect(res.status).toBe(200);
      expect(await Notification.findById(notification.id)).toBeNull();
    });

    it("returns 404 when trying to delete another user's notification", async () => {
      const owner = await createUser();
      const other = await createUser();
      const notification = await createNotificationFor(owner.user.id);

      const res = await request(app)
        .delete(`/api/notifications/${notification.id}`)
        .set(authHeader(other.accessToken));

      expect(res.status).toBe(404);
      expect(await Notification.findById(notification.id)).not.toBeNull();
    });

    it('returns 404 for a nonexistent notification', async () => {
      const { accessToken } = await createUser();
      const res = await request(app)
        .delete('/api/notifications/507f1f77bcf86cd799439011')
        .set(authHeader(accessToken));

      expect(res.status).toBe(404);
    });
  });
});
