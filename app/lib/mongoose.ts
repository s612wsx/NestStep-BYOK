import mongoose from "mongoose";

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

// 在 dev 熱重載 / 多次 import 時共用同一條連線
const globalCache = globalThis as typeof globalThis & {
  _mongoose?: MongooseCache;
};

const cache: MongooseCache =
  globalCache._mongoose ?? (globalCache._mongoose = { conn: null, promise: null });

export async function connectMongo(): Promise<typeof mongoose> {
  if (cache.conn) return cache.conn;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("環境變數缺少 MONGODB_URI");
  }

  if (!cache.promise) {
    cache.promise = mongoose.connect(uri);
  }
  cache.conn = await cache.promise;
  return cache.conn;
}
