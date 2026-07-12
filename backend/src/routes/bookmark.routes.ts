import { Router } from 'express';
import { authenticate } from '@middlewares/auth.middleware';
import { validateObjectIdParam } from '@validators/common.validator';
import { getMyBookmarks, addBookmark, removeBookmark } from '@controllers/bookmark.controller';

const router = Router();

router.use(authenticate);

router.get('/', getMyBookmarks);
router.post('/:productId', validateObjectIdParam('productId'), addBookmark);
router.delete('/:productId', validateObjectIdParam('productId'), removeBookmark);

export default router;