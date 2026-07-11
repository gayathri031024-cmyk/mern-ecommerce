import express, { Application } from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import { env, isDevelopment } from '@config/env';
import { requestLogger } from '@middlewares/requestLogger';
import { notFoundHandler } from '@middlewares/notFoundHandler';
import { errorHandler } from '@middlewares/errorHandler';
import { logger } from '@utils/logger';

import healthRoutes from '@routes/health.routes';
import apiRoutes from '@routes/index';

const app: Application = express();

app.use(helmet());
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

app.use(
  morgan(isDevelopment ? 'dev' : 'combined', {
    stream: { write: (message: string) => logger.info(message.trim()) },
  }),
);
app.use(requestLogger);

app.use(
  '/uploads',
  express.static(path.join(process.cwd(), 'uploads'), {
    setHeaders: (res) => {
      // Helmet defaults to same-origin CORP, which blocks <img> loads from the
      // frontend's dev origin. Uploaded images are public assets, so relax it.
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    },
  }),
);

app.use('/health', healthRoutes);
app.use('/api', apiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;