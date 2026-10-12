import mongoose from 'mongoose';
import { env } from './env.js';

mongoose.set('strictQuery', true);

export async function connectDB() {
  await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 15000 });
  console.log(`[db] connected to ${mongoose.connection.host}/${mongoose.connection.name}`);
  mongoose.connection.on('disconnected', () => console.warn('[db] disconnected'));
  mongoose.connection.on('reconnected', () => console.log('[db] reconnected'));
}

export async function disconnectDB() {
  await mongoose.disconnect();
}
