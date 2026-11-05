import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import { LocalMongoDb } from "./localMongoAdapter.js";

dotenv.config();

let dbInstance = null;
let mongoClient = null;
let isLocalFallback = false;

export async function connectDB() {
  if (dbInstance) return dbInstance;

  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/studiospace";

  const isAtlas = uri.startsWith("mongodb+srv://");

  try {
    mongoClient = new MongoClient(uri, {
      serverSelectionTimeoutMS: isAtlas ? 10000 : 2500,
      connectTimeoutMS: isAtlas ? 10000 : 2500,
    });
    await mongoClient.connect();
    const dbName = new URL(uri.replace("mongodb+srv://", "http://").replace("mongodb://", "http://")).pathname.replace(/^\//, "") || "studiospace";
    dbInstance = mongoClient.db(dbName);
    console.log(`✅ Connected to MongoDB (${dbName})`);
  } catch (err) {
    console.log(`ℹ️ MongoDB server at ${uri} not reachable (${err.message}). Using persistent local MongoDB engine (server/data/studiospace-db.json).`);
    dbInstance = new LocalMongoDb();
    isLocalFallback = true;
  }

  // Ensure indexes required by schema design
  try {
    await dbInstance.collection("users").createIndex({ email: 1 }, { unique: true });
    await dbInstance.collection("studios").createIndex({ ownerEmail: 1 });
    await dbInstance.collection("studios").createIndex({ category: 1 });
    await dbInstance.collection("studios").createIndex({ rating: -1, createdAt: -1 });
    await dbInstance.collection("bookings").createIndex({ studioId: 1, bookingDate: 1 });
    await dbInstance.collection("bookings").createIndex({ userEmail: 1 });
  } catch (idxErr) {
    // Non-fatal index creation message
  }

  return dbInstance;
}

export function getDB() {
  if (!dbInstance) {
    throw new Error("Database not initialized. Call connectDB() first.");
  }
  return dbInstance;
}

export function isUsingLocalFallback() {
  return isLocalFallback;
}

