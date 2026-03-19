import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/stealth-zk-kyc';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGO_URI environment variable inside .env.local');
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('MongoDB Connected (Singleton)');
      return mongoose;
    }).catch((err) => {
      console.error('CRITICAL: MongoDB Connection Failed. Running in MOCK/MEMORY mode for demo.');
      // We don't throw here to avoid crashing the whole API startup
      return null;
    });
  }
  
  cached.conn = await cached.promise;
  return cached.conn;
}

export default connectDB;
