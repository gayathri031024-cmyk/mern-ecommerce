import express, { Application } from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import swaggerUi from 'swagger-ui-express';
import openapiSpec from '../docs/openapi.json';

import { env, isDevelopment } from '@config/env';
import { requestLogger } from '@middlewares/requestLogger';
import { notFoundHandler } from '@middlewares/notFoundHandler';
import { errorHandler } from '@middlewares/errorHandler';
import { xssSanitize } from '@middlewares/sanitize.middleware';
import { issueCsrfCookie } from '@middlewares/csrf.middleware';
import { logger } from '@utils/logger';

import healthRoutes from '@routes/health.routes';
import apiRoutes from '@routes/index';

const app: Application = express();

// Trust the first proxy hop (Render/Heroku/Nginx etc.) so req.ip, secure
// cookies, and rate-limiting keys reflect the real client, not the proxy.
app.set('trust proxy', 1);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
    crossOriginResourcePolicy: { policy: 'same-site' },
  }),
);
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(compression());

// General API rate limiter (defense-in-depth on top of the stricter
// per-route limiter applied to sensitive auth endpoints).
app.use(
  '/api',
  rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX_REQUESTS * 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests. Please try again later.' },
  }),
);

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// NoSQL-injection guard (strips `$`/`.` operator keys from body/query/params)
// and XSS guard (strips script/HTML payloads from string input).
app.use(mongoSanitize());
app.use(xssSanitize);
app.use(issueCsrfCookie);

app.use(
  morgan(isDevelopment ? 'dev' : 'combined', {
    stream: { write: (message: string) => logger.info(message.trim()) },
  }),
);
app.use(requestLogger);

app.use(
  '/uploads',
  express.static(path.join(process.cwd(), 'uploads'), {
    maxAge: '7d',
    immutable: true,
    setHeaders: (res) => {
      // Helmet defaults to same-origin CORP, which blocks <img> loads from the
      // frontend's dev origin. Uploaded images are public assets, so relax it.
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    },
  }),
);

// Interactive API documentation — browse and try endpoints at /api-docs.
// The raw spec is also served as JSON for tooling (Postman import, codegen, etc.).
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));
app.get('/api-docs.json', (_req, res) => res.json(openapiSpec));

app.use('/health', healthRoutes);
app.use('/api', apiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
