import mongoose from 'mongoose'
import { MONGODB_BACKEND_URI, MONGODB_DB } from '@/lib/constants'

// Simple cached connection for Next.js Route Handlers / hot reload
let cached = (global as any)._mongoose as
  | { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null }
  | undefined

if (!cached) {
  cached = (global as any)._mongoose = { conn: null, promise: null }
}

export async function connectMongo() {
  if (cached!.conn) return cached!.conn

  if (!MONGODB_BACKEND_URI) {
    throw new Error('MONGODB_BACKEND_URI is not set')
  }

  const uri = MONGODB_BACKEND_URI
  const dbName = MONGODB_DB

  if (!cached!.promise) {
    cached!.promise = mongoose.connect(uri, { dbName })
  }

  cached!.conn = await cached!.promise
  return cached!.conn
}

export function getDb(): mongoose.mongo.Db {
  if (mongoose.connection.readyState !== 1) {
    throw new Error('MongoDB not connected')
  }
  // After a successful connection, connection.db is set
  return mongoose.connection.db!
}
