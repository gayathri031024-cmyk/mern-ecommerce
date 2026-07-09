import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { env } from '@config/env';
import { HealthCheckResponse } from '../types/api';

const router = Router();

const CONNECTION_STATES: Record<number, HealthCheckResponse['database']['status']> = {
  0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting',
};

router.get('/', (_req: Request, res: Response) => {
  const dbStatus = CONNECTION_STATES[mongoose.connection.readyState] ?? 'disconnected';
  const payload: HealthCheckResponse = {
    status: dbStatus === 'connected' ? 'ok' : 'degraded',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    database: { status: dbStatus },
  };
  res.status(payload.status === 'ok' ? 200 : 503).json(payload);
});

export default router;