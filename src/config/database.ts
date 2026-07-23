import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

const MONGO_URI = env.MONGO_URI;

if (!MONGO_URI) {
  throw new Error('Missing MONGO_URI environment variable');
}

async function connectWithRetry(): Promise<void> {
  let attempt = 0;
  const maxRetries = 5; // Max retry attempts
  const retryDelay = 5000; // Retry delay in (5 seconds)

  while (attempt < maxRetries) {
    try {
      const conn = await mongoose.connect(MONGO_URI, {
        maxPoolSize: 50,
        minPoolSize: 5,
        maxIdleTimeMS: 60000, // 1 min max idle before mongodb clears unused connection
        waitQueueTimeoutMS: 5000, // Don't let clients wait forever
        socketTimeoutMS: 30000,
        serverSelectionTimeoutMS: 30000, // 30s timeout to connect mongodb
      });
      logger.info(`MongoDB connected: ${conn.connection.host}`);
      break;
    } catch (error) {
      attempt++;
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Attempt ${attempt}: MongoDB connection error: ${errorMessage}`);

      if (attempt === maxRetries) {
        logger.error('Max retries reached. Exiting...');
        process.exit(1); // Exit if max retries are reached
      }

      logger.info(`Retrying in ${retryDelay / 1000} seconds...`);
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }
}

export async function connectDatabase(): Promise<void> {
  await connectWithRetry();
}
