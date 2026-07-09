import { Router, Request, Response } from 'express';
import productRoutes from './product.routes';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.status(200).json({ success: true, message: 'Ecommerce API is up and running' });
});

router.use('/products', productRoutes);

export default router; //index.ts
