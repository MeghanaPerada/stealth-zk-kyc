import { MongoClient, Db } from "mongodb";

const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || "stealth-zk-kyc";

if (!MONGODB_URI) {
  throw new Error("Please define the MONGO_URI or MONGODB_URI environment variable inside .env.local");
}

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDB() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = new MongoClient(MONGODB_URI!);
  await client.connect();
  const db = client.db(MONGODB_DB);

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}
