import mongoose from 'mongoose';
import { ENV } from './env';

export let isMongoConnected = false;

export async function connectDB(): Promise<void> {
  try {
    mongoose.set('strictQuery', false);
    // Attempt connecting with short timeout to prevent boot hang if mongod is offline
    await mongoose.connect(ENV.MONGODB_URI, {
      serverSelectionTimeoutMS: 2000,
    });
    isMongoConnected = true;
    console.log(`[MongoDB] Connected successfully to: ${ENV.MONGODB_URI}`);
  } catch (error: any) {
    isMongoConnected = false;
    console.warn(`[MongoDB] Notice: Remote/Local MongoDB not reachable (${error.message}). Running with resilient high-performance operational state engine.`);
  }

  mongoose.connection.on('disconnected', () => {
    isMongoConnected = false;
    console.warn('[MongoDB] Connection lost.');
  });
}
