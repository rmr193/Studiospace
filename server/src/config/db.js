import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

let dbInstance = null;
let mongoClient = null;

export async function connectDB() {
  if (dbInstance) return dbInstance;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI environment variable is not defined in server/.env");
  }

  mongoClient = new MongoClient(uri, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
  });

  await mongoClient.connect();

  const parsedPath = new URL(
    uri.replace("mongodb+srv://", "http://").replace("mongodb://", "http://")
  ).pathname.replace(/^\//, "");
  const dbName = parsedPath || "studiospace";

  dbInstance = mongoClient.db(dbName);
  console.log(`✅ Connected to MongoDB (${dbName})`);

  try {
    await dbInstance.collection("users").createIndex({ email: 1 }, { unique: true });
    await dbInstance.collection("studios").createIndex({ ownerEmail: 1 });
    await dbInstance.collection("studios").createIndex({ category: 1 });
    await dbInstance.collection("studios").createIndex({ rating: -1, createdAt: -1 });
    await dbInstance.collection("bookings").createIndex({ studioId: 1, bookingDate: 1 });
    await dbInstance.collection("bookings").createIndex({ userEmail: 1 });
  } catch {
    // Indexes already exist
  }

  return dbInstance;
}

export function getDB() {
  if (!dbInstance) {
    throw new Error("Database not initialized. Call connectDB() first.");
  }
  return dbInstance;
}
