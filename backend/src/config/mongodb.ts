import mongoose from 'mongoose';
import { config } from './index';
import { logger } from './logger';

export async function connectMongoDB(): Promise<void> {
  try {
    await mongoose.connect(config.mongodb.url);
    logger.info('MongoDB connected');
  } catch (err) {
    logger.error({ err }, 'MongoDB connection error');
    throw err;
  }
}

export async function closeMongoDB(): Promise<void> {
  await mongoose.disconnect();
}
