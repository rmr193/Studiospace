import { fileURLToPath } from "url";
import { connectDB } from "../config/db.js";
import { SEED_STUDIOS } from "./seedData.js";

export async function seedDatabase(db, forceReset = false) {
  const studiosCol = db.collection("studios");
  const bookingsCol = db.collection("bookings");

  const existingStudiosCount = await studiosCol.countDocuments({});
  if (existingStudiosCount > 0 && !forceReset) {
    return;
  }

  if (forceReset) {
    await studiosCol.deleteMany({});
    await bookingsCol.deleteMany({});
  }

  await studiosCol.insertMany(SEED_STUDIOS);
  console.log(`🌱 Seeded ${SEED_STUDIOS.length} initial creative studios in MongoDB.`);
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  (async () => {
    try {
      const db = await connectDB();
      await seedDatabase(db, true);
      console.log("✅ MongoDB seed completed successfully.");
      process.exit(0);
    } catch (error) {
      console.error("❌ Seed failed:", error);
      process.exit(1);
    }
  })();
}
