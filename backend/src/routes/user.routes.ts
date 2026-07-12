import { Router } from 'express';
import { authenticate, authorize } from '@middlewares/auth.middleware';
import { ROLES } from '@constants/roles';
import { validateObjectIdParam } from '@validators/common.validator';
import {
  getMe,
  updateMe,
  addAddress,
  updateAddress,
  removeAddress,
  getAllUsers,
  getUserById,
  updateUserRole,
  deleteUser,
} from '@controllers/user.controller';

const router = Router();

router.use(authenticate);

router.get('/me', getMe);
router.patch('/me', updateMe);
router.post('/me/addresses', addAddress);
router.patch('/me/addresses/:addressId', updateAddress);
router.delete('/me/addresses/:addressId', removeAddress);

router.get('/', authorize(ROLES.ADMIN), getAllUsers);
router.get('/:id', authorize(ROLES.ADMIN), validateObjectIdParam(), getUserById);
router.patch('/:id/role', authorize(ROLES.ADMIN), validateObjectIdParam(), updateUserRole);
router.delete('/:id', authorize(ROLES.ADMIN), validateObjectIdParam(), deleteUser);

export default router;
