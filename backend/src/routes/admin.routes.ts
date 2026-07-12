import { Router } from 'express';
import { authenticate, authorize } from '@middlewares/auth.middleware';
import { ROLES } from '@constants/roles';
import { getDashboardStats, exportOrdersCsv, exportProductsCsv, exportUsersCsv } from '@controllers/admin.controller';

const router = Router();

router.use(authenticate, authorize(ROLES.ADMIN));

router.get('/stats', getDashboardStats);
router.get('/export/orders', exportOrdersCsv);
router.get('/export/products', exportProductsCsv);
router.get('/export/users', exportUsersCsv);

export default router;
