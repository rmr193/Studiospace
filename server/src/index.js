import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { toNodeHandler } from "better-auth/node";
import { connectDB } from "./config/db.js";
import { initBetterAuth, getBetterAuth } from "./config/auth.js";
import authRoutes from "./routes/authRoutes.js";
import studioRoutes from "./routes/studioRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: (origin, callback) => {
      callback(null, origin || true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  })
);

app.use(cookieParser());

// Normalize duplicate leading slashes in URL path (e.g. //api/auth/jwt -> /api/auth/jwt)
app.use((req, res, next) => {
  if (req.url.startsWith("//")) {
    req.url = req.url.replace(/^\/+/, "/");
  }
  next();
});

let initPromise = null;
async function ensureInitialized() {
  if (!initPromise) {
    initPromise = (async () => {
      const db = await connectDB();
      const auth = initBetterAuth(db);
      return { db, auth };
    })();
  }
  return initPromise;
}

app.use(async (req, res, next) => {
  try {
    await ensureInitialized();
    next();
  } catch (err) {
    console.error("Initialization error:", err);
    res.status(500).json({ message: "Database initialization failed." });
  }
});

// 1. Custom JWT & Session Endpoints (/api/auth/jwt, /api/auth/logout, /api/auth/me)
app.use("/api/auth", express.json(), authRoutes);

// 2. BetterAuth Handler for /api/auth/* (sign-up/email, sign-in/email, get-session, sign-out, social)
app.all("/api/auth/*", (req, res) => {
  const auth = getBetterAuth();
  return toNodeHandler(auth)(req, res);
});

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
    database: "MongoDB Atlas Connected",
  });
});

if (!process.env.VERCEL) {
  ensureInitialized()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`🚀 StudioSpace Backend Server running on http://localhost:${PORT}`);
      });
    })
    .catch((err) => {
      console.error("Failed to start StudioSpace backend:", err);
      process.exit(1);
    });
}

export default app;
