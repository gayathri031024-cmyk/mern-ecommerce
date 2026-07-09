import mongoose from 'mongoose';
import { env } from '@config/env';
import { logger } from '@utils/logger';

mongoose.set('strictQuery', true);

export async function connectDB(): Promise<void> {
  try {
    const conn = await mongoose.connect(env.MONGO_URI);
    logger.info(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error('MongoDB initial connection failed', error);
    throw error;
  }
}

export async function disconnectDB(): Promise<void> {
  await mongoose.connection.close();
  logger.info('MongoDB connection closed');
}

mongoose.connection.on('connected', () => logger.info('Mongoose connection established'));
mongoose.connection.on('error', (error) => logger.error('Mongoose connection error', error));
mongoose.connection.on('disconnected', () => logger.warn('Mongoose connection disconnected'));