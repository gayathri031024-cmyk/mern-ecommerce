import http from 'http';
import app from './app';
import { env } from '@config/env';
import { connectDB, disconnectDB } from '@config/db';
import { logger } from '@utils/logger';

let server: http.Server;

async function bootstrap(): Promise<void> {
  try {
    await connectDB();
    server = http.createServer(app);
    server.listen(env.PORT, () => {
      logger.info(`🚀 Server running in ${env.NODE_ENV} mode on ${env.API_BASE_URL}`);
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

function gracefulShutdown(signal: string): void {
  logger.warn(`${signal} received. Starting graceful shutdown...`);
  const forceExitTimer = setTimeout(() => {
    logger.error('Graceful shutdown timed out. Forcing exit.');
    process.exit(1);
  }, 10_000);

  if (!server) { process.exit(0); return; }

  server.close(async (err) => {
    if (err) logger.error('Error while closing HTTP server', err);
    else logger.info('HTTP server closed');

    try {
      await disconnectDB();
    } catch (dbErr) {
      logger.error('Error while closing MongoDB connection', dbErr);
    } finally {
      clearTimeout(forceExitTimer);
      process.exit(err ? 1 : 0);
    }
  });
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('unhandledRejection', (reason) => { logger.error('Unhandled Promise Rejection', reason); gracefulShutdown('unhandledRejection'); });
process.on('uncaughtException', (error) => { logger.error('Uncaught Exception', error); gracefulShutdown('uncaughtException'); });

void bootstrap();