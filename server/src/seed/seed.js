import { fileURLToPath } from "url";
import { connectDB } from "../config/db.js";
import { initBetterAuth } from "../config/auth.js";
import { SEED_STUDIOS } from "./seedData.js";

const EXAMINER_EMAIL = "examiner@studiospace.com";

const DEMO_USERS = [
  {
    name: "Alex Morgan",
    email: EXAMINER_EMAIL,
    password: "Test123@",
    image:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
  },
  {
    name: "Maya Chen",
    email: "maya@studiospace.com",
    password: "Studio123@",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80",
  },
  {
    name: "Jon Bell",
    email: "jon@studiospace.com",
    password: "Studio123@",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
  },
];

const DEMO_BOOKINGS = [
  {
    key: "examiner-apex-confirmed",
    studioTitle: "Apex Daylight Loft & 3-Wall Cyclorama",
    daysFromToday: 5,
    startTime: 10,
    endTime: 14,
    status: "Confirmed",
  },
  {
    key: "examiner-voxhouse-pending",
    studioTitle: "VoxHouse Broadcast Lounge & 4K Podcast Suite",
    daysFromToday: 9,
    startTime: 13,
    endTime: 16,
    status: "Pending",
  },
  {
    key: "examiner-aether-completed",
    studioTitle: "Aether Analog Mastering & SSL Recording Suite",
    daysFromToday: -12,
    startTime: 11,
    endTime: 15,
    status: "Completed",
  },
  {
    key: "examiner-monolith-cancelled",
    studioTitle: "monolith XR Blackbox & Motion Capture Stage",
    daysFromToday: 3,
    startTime: 9,
    endTime: 12,
    status: "Cancelled",
  },
];

function addDays(days) {
  const date = new Date();
  date.setUTCHours(12, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function idVariants(id) {
  return [id, String(id)];
}

async function ensureDemoUser(db, auth, demo) {
  const email = demo.email.toLowerCase();
  const users = db.collection("users");
  const accounts = db.collection("accounts");
  const sessions = db.collection("sessions");

  let user = await users.findOne({ email });
  if (user) {
    const credential = await accounts.findOne({
      userId: { $in: idVariants(user._id) },
      providerId: "credential",
    });

    if (credential) {
      await users.updateOne(
        { _id: user._id },
        {
          $set: {
            name: user.name || demo.name,
            image: user.image || demo.image,
            role: user.role || "host",
            emailVerified: true,
          },
        }
      );
      return { created: false, email };
    }

    // A previous demo record may exist without a BetterAuth credential
    // account (for example, from the old custom auth layer). Recreate it.
    await Promise.all([
      sessions.deleteMany({ userId: { $in: idVariants(user._id) } }),
      accounts.deleteMany({ userId: { $in: idVariants(user._id) } }),
      users.deleteOne({ _id: user._id }),
    ]);
  }

  const result = await auth.api.signUpEmail({
    body: {
      name: demo.name,
      email,
      password: demo.password,
      image: demo.image,
    },
  });

  const created = result?.user || (await users.findOne({ email }));
  if (created?._id) {
    await users.updateOne(
      { _id: created._id },
      {
        $set: {
          role: created.role || "host",
          emailVerified: true,
          wishlist: Array.isArray(created.wishlist) ? created.wishlist : [],
        },
      }
    );
  }

  return { created: true, email };
}

async function ensureExaminerListings(db, examiner) {
  const studios = db.collection("studios");
  const titles = [
    "Lumen Chromatic Strobe & Tabletop Product Studio",
    "Foundry Industrial Sculpture & Set Fabrication Lab",
  ];

  const ownedCount = await studios.countDocuments({ ownerEmail: examiner.email });
  if (ownedCount > 0) return 0;

  const result = await studios.updateMany(
    { title: { $in: titles } },
    {
      $set: {
        ownerEmail: examiner.email,
        ownerName: examiner.name,
        ownerPhoto: examiner.image || "",
      },
    }
  );

  return result.modifiedCount;
}

async function ensureExaminerBookings(db, examiner) {
  const bookings = db.collection("bookings");
  const studios = db.collection("studios");
  let inserted = 0;

  for (const demo of DEMO_BOOKINGS) {
    const studio = await studios.findOne({ title: demo.studioTitle });
    if (!studio) continue;

    const hours = demo.endTime - demo.startTime;
    const bookingDate = addDays(demo.daysFromToday);
    const result = await bookings.updateOne(
      { demoSeedKey: demo.key },
      {
        $setOnInsert: {
          studioId: String(studio._id),
          studioTitle: studio.title,
          studioImage: studio.imageUrl,
          hourlyRate: studio.hourlyRate,
          securityDeposit: studio.securityDeposit ?? 0,
          userEmail: examiner.email,
          userName: examiner.name,
          hostEmail: studio.ownerEmail,
          bookingDate,
          startTime: demo.startTime,
          endTime: demo.endTime,
          totalPrice:
            Math.round((hours * studio.hourlyRate + (studio.securityDeposit ?? 0)) * 100) / 100,
          status: demo.status,
          createdAt: new Date(),
          demoSeedKey: demo.key,
        },
      },
      { upsert: true }
    );
    if (result.upsertedCount) inserted += 1;
  }

  return inserted;
}

export async function seedDatabase(db, forceReset = false) {
  const studiosCol = db.collection("studios");
  const bookingsCol = db.collection("bookings");
  const auth = initBetterAuth(db);

  const demoUsers = [];
  for (const demo of DEMO_USERS) {
    demoUsers.push(await ensureDemoUser(db, auth, demo));
  }

  const existingStudiosCount = await studiosCol.countDocuments({});
  if (forceReset) {
    await studiosCol.deleteMany({});
    await bookingsCol.deleteMany({});
  }

  if (existingStudiosCount === 0 || forceReset) {
    await studiosCol.insertMany(SEED_STUDIOS);
    console.log(`🌱 Seeded ${SEED_STUDIOS.length} initial creative studios in MongoDB.`);
  } else {
    console.log(`[seed] ${existingStudiosCount} studios already present — kept as-is.`);
  }

  const examiner = await db.collection("users").findOne({ email: EXAMINER_EMAIL });
  let insertedBookings = 0;
  let claimedListings = 0;
  if (examiner) {
    claimedListings = await ensureExaminerListings(db, examiner);
    insertedBookings = await ensureExaminerBookings(db, examiner);
  }

  const createdUsers = demoUsers.filter((entry) => entry.created).map((entry) => entry.email);
  if (createdUsers.length) {
    console.log(`[seed] demo accounts ready: ${createdUsers.join(", ")}`);
  } else {
    console.log("[seed] demo accounts already present.");
  }
  console.log(`[seed] examiner demo bookings added: ${insertedBookings}`);
  console.log(`[seed] examiner listings claimed: ${claimedListings}`);
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  (async () => {
    try {
      const db = await connectDB();
      const forceReset = process.argv.includes("--force");
      await seedDatabase(db, forceReset);
      console.log("✅ MongoDB seed completed successfully.");
      console.log(`   Examiner: ${EXAMINER_EMAIL} / Test123@`);
      process.exit(0);
    } catch (error) {
      console.error("❌ Seed failed:", error);
      process.exit(1);
    }
  })();
}
