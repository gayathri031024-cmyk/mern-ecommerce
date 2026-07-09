import { Router, Request, Response } from 'express';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.status(200).json({ success: true, message: 'Ecommerce API is up and running' });
});

export default router;