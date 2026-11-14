import mongoose from "mongoose";
import dns from "node:dns";

// Fix for querySrv ECONNREFUSED on Windows / local ISP router DNS
// Forces Node.js to resolve SRV records via Google & Cloudflare public DNS
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch {
  // Ignore if restricted in specific environments
}

declare global {
  var mongooseCache: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}

let cached = global.mongooseCache || (global.mongooseCache = { conn: null, promise: null });

export const connectToDatabase = async () => {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    throw new Error(
      "Please define the MONGODB_URI environment variable inside .env.local or production settings"
    );
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      dbName: 'bookefy',
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error("MongoDB connection error:", e);
    throw e;
  }

  return cached.conn;
};
