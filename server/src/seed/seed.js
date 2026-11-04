import { fileURLToPath } from "url";
import { connectDB } from "../config/db.js";
import { initBetterAuth } from "../config/auth.js";
import { EXAMINER_USERS, SEED_STUDIOS, SEED_BOOKINGS } from "./seedData.js";

export async function seedDatabase(db, auth, forceReset = false) {
  const studiosCol = db.collection("studios");
  const bookingsCol = db.collection("bookings");
  const usersCol = db.collection("users");

  const existingStudiosCount = await studiosCol.countDocuments({});
  if (existingStudiosCount > 0 && !forceReset) {
    return;
  }

  if (forceReset) {
    await studiosCol.deleteMany({});
    await bookingsCol.deleteMany({});
  }

  // Create Examiner & Host Accounts via BetterAuth so Email/Password Sign-In works immediately
  for (const userSpec of EXAMINER_USERS) {
    const existingUser = await usersCol.findOne({
      email: { $regex: `^${userSpec.email}$`, $options: "i" },
    });

    if (!existingUser) {
      try {
        await auth.api.signUpEmail({
          body: {
            name: userSpec.name,
            email: userSpec.email,
            password: userSpec.password,
            image: userSpec.image,
            role: userSpec.role,
          },
        });
      } catch (err) {
        // Fallback insert if already exists in auth accounts
        await usersCol.insertOne({
          name: userSpec.name,
          email: userSpec.email,
          image: userSpec.image,
          role: userSpec.role,
          wishlist: ["6729a1000000000000000001", "6729a1000000000000000004"],
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    // Ensure custom fields (role + wishlist) are populated for examiner
    if (userSpec.email === "examiner@studiospace.io") {
      await usersCol.updateOne(
        { email: { $regex: `^${userSpec.email}$`, $options: "i" } },
        {
          $set: {
            role: "host",
            image: userSpec.image,
            wishlist: ["6729a1000000000000000001", "6729a1000000000000000004"],
          },
        }
      );
    }
  }

  await studiosCol.insertMany(SEED_STUDIOS);

  const existingBookingsCount = await bookingsCol.countDocuments({});
  if (existingBookingsCount === 0 || forceReset) {
    await bookingsCol.insertMany(SEED_BOOKINGS);
  }

  console.log(`🌱 Seeded ${SEED_STUDIOS.length} creative studios, ${SEED_BOOKINGS.length} bookings, and ${EXAMINER_USERS.length} test accounts.`);
}

// Allow running `npm run seed` directly from CLI
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  (async () => {
    try {
      const db = await connectDB();
      const auth = initBetterAuth(db);
      await seedDatabase(db, auth, true);
      console.log("✅ Database seed completed successfully.");
      process.exit(0);
    } catch (error) {
      console.error("❌ Seed failed:", error);
      process.exit(1);
    }
  })();
}

