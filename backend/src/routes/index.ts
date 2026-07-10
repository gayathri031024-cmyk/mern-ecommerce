import { Router, Request, Response } from 'express';
import authRoutes from './auth.routes';
import productRoutes from './product.routes';
import categoryRoutes from './category.routes';
import reviewRoutes from './review.routes';
import cartRoutes from './cart.routes';
import orderRoutes from './order.routes';
import wishlistRoutes from './wishlist.routes';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.status(200).json({ success: true, message: 'Ecommerce API is up and running' });
});

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/reviews', reviewRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/wishlist', wishlistRoutes);

export default router; //index.ts
