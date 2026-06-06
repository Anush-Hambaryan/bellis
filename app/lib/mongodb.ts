import { MongoClient } from "mongodb";

const globalForMongo = globalThis as typeof globalThis & {
  __mongoClientPromise?: Promise<MongoClient>;
};

export function getMongoClient() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Missing MONGODB_URI environment variable.");
  }

  globalForMongo.__mongoClientPromise ??= new MongoClient(uri).connect();
  return globalForMongo.__mongoClientPromise;
}
