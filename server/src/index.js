import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { toNodeHandler } from "better-auth/node";
import { connectDB } from "./config/db.js";
import { initBetterAuth } from "./config/auth.js";
import { seedDatabase } from "./seed/seed.js";
import authRoutes from "./routes/authRoutes.js";
import studioRoutes from "./routes/studioRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  process.env.CLIENT_URL || "http://localhost:3000",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:3001",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith(".vercel.app")) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  })
);

app.use(cookieParser());

async function startServer() {
  const db = await connectDB();
  const auth = initBetterAuth(db);

  // Auto-seed initial 8 realistic creative studios & test examiner accounts if empty
  await seedDatabase(db, auth, false);

  // 1. Custom JWT & Session Endpoints (/api/auth/jwt, /api/auth/logout, /api/auth/me)
  app.use("/api/auth", express.json(), authRoutes);

  // 2. BetterAuth Handler for /api/auth/* (sign-up/email, sign-in/email, get-session, sign-out, social)
  app.all("/api/auth/*", toNodeHandler(auth));

  // 3. Parse JSON body for all remaining API endpoints
  app.use(express.json({ limit: "10mb" }));

  // 4. Core API Routes
  app.use("/api", studioRoutes);
  app.use("/api", bookingRoutes);
  app.use("/api", wishlistRoutes);

  // Health Check
  app.get("/", (req, res) => {
    res.status(200).json({
      name: "StudioSpace Production API",
      status: "online",
      version: "1.0.0",
      endpoints: [
        "POST /api/auth/jwt",
        "POST /api/auth/logout",
        "GET  /api/studios/featured",
        "GET  /api/studios",
        "GET  /api/studios/:id",
        "GET  /api/my-listings",
        "POST /api/studios",
        "PATCH /api/studios/:id",
        "DELETE /api/studios/:id",
        "POST /api/bookings",
        "GET  /api/my-bookings",
        "PATCH /api/bookings/:id/cancel",
        "POST /api/wishlist/toggle",
        "GET  /api/wishlist",
      ],
    });
  });

  app.listen(PORT, () => {
    console.log(`🚀 StudioSpace Backend Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start StudioSpace backend:", err);
  process.exit(1);
});

