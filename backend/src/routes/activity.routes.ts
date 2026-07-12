import { Router } from 'express';
import { authenticate } from '@middlewares/auth.middleware';
import { getMyActivity, clearMyActivity } from '@controllers/activity.controller';

const router = Router();

router.use(authenticate);

router.get('/', getMyActivity);
router.delete('/', clearMyActivity);

export default router;
