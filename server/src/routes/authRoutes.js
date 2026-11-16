import express from "express";
import jwt from "jsonwebtoken";
import { fromNodeHeaders } from "better-auth/node";
import { getDB } from "../config/db.js";
import { getBetterAuth } from "../config/auth.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

function getCookieOptions() {
  const isProd =
    process.env.NODE_ENV === "production" ||
    Boolean(process.env.VERCEL) ||
    Boolean(process.env.RENDER);
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };
}

function getAllowedClientOrigins() {
  return [
    process.env.CLIENT_URL,
    "https://studiospace-lyart.vercel.app",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ]
    .filter(Boolean)
    .flatMap((value) => String(value).split(","))
    .map((value) => value.trim())
    .filter(Boolean);
}

function safeRedirectTarget(rawTarget) {
  const fallback = getAllowedClientOrigins()[0] || "https://studiospace-lyart.vercel.app";
  if (!rawTarget) return fallback;

  try {
    const candidate = new URL(String(rawTarget));
    if (getAllowedClientOrigins().includes(candidate.origin)) {
      return candidate.toString();
    }
  } catch {
    // Invalid URL — fall through to the trusted fallback.
  }

  return fallback;
}

function serializeUser(user) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    image:
      user.image ||
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
    role: user.role || "host",
    wishlist: (user.wishlist || []).map((id) => String(id)),
    createdAt: user.createdAt,
  };
}

async function getSessionUser(req) {
  const auth = getBetterAuth();
  if (!auth) return null;

  try {
    const sessionData = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    if (!sessionData?.user?.email) return null;

    const normalizedEmail = sessionData.user.email.trim().toLowerCase();
    const db = getDB();
    const usersCol = db.collection("users");

    let user = await usersCol.findOne({
      email: {
        $regex: `^${normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
        $options: "i",
      },
    });

    if (!user) return null;

    // Make sure custom profile fields exist for accounts created before they
    // were added to the BetterAuth user schema.
    const updates = {};
    if (!user.role) updates.role = "host";
    if (!Array.isArray(user.wishlist)) updates.wishlist = [];
    if (!user.image && sessionData.user.image) updates.image = sessionData.user.image;

    if (Object.keys(updates).length > 0) {
      await usersCol.updateOne({ _id: user._id }, { $set: updates });
      user = { ...user, ...updates };
    }

    return user;
  } catch (error) {
    console.error("Unable to resolve BetterAuth session:", error);
    return null;
  }
}

function signSessionToken(user) {
  const secret = process.env.JWT_SECRET || "studiospace_jwt_secret_replace_in_production_2026";
  return jwt.sign(
    {
      id: String(user._id),
      email: user.email,
      name: user.name,
      role: user.role || "host",
    },
    secret,
    { expiresIn: "7d" }
  );
}

// First-party OAuth completion bridge for cross-domain (Vercel <-> Render)
// deployments. The BetterAuth session cookie is set on the API origin, so this
// endpoint converts it into the short-lived API JWT cookie before handing the
// user back to the frontend.
router.get("/oauth-complete", async (req, res) => {
  const redirectTarget = safeRedirectTarget(req.query.redirect);

  try {
    const user = await getSessionUser(req);
    if (!user) {
      const target = new URL(redirectTarget);
      target.pathname = "/login";
      target.search = "?error=oauth_session_missing";
      return res.redirect(target.toString());
    }

    res.cookie("token", signSessionToken(user), getCookieOptions());
    return res.redirect(redirectTarget);
  } catch (error) {
    console.error("OAuth completion error:", error);
    const target = new URL(safeRedirectTarget(null));
    target.pathname = "/login";
    target.search = "?error=oauth_failed";
    return res.redirect(target.toString());
  }
});

// POST /api/auth/jwt — Exchanges a valid BetterAuth session for the HTTPOnly
// API JWT cookie. The email is never accepted from the request body: identity
// always comes from the verified BetterAuth session.
router.post("/jwt", async (req, res) => {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return res.status(401).json({
        message: "Unauthorized: a valid BetterAuth session is required.",
      });
    }

    res.cookie("token", signSessionToken(user), getCookieOptions());

    return res.status(200).json({
      success: true,
      user: serializeUser(user),
    });
  } catch (error) {
    console.error("Error issuing JWT:", error);
    return res.status(500).json({ message: "Failed to generate authentication token." });
  }
});

// POST /api/auth/logout — Revokes the BetterAuth session and clears the JWT cookie
router.post("/logout", async (req, res) => {
  try {
    const auth = getBetterAuth();
    if (auth) {
      await auth.api.signOut({ headers: fromNodeHeaders(req.headers) });
    }
  } catch {
    // The local cookie still needs to be cleared even if the remote session
    // was already revoked.
  }

  const isProd =
    process.env.NODE_ENV === "production" ||
    Boolean(process.env.VERCEL) ||
    Boolean(process.env.RENDER);
  res.clearCookie("token", {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
  });
  return res.status(200).json({ success: true, message: "Logged out and cleared session cookie." });
});

// GET /api/auth/me — Verify current HTTPOnly JWT session and return user profile
router.get("/me", verifyToken, async (req, res) => {
  try {
    const db = getDB();
    const user = await db.collection("users").findOne({
      email: {
        $regex: `^${String(req.user.email || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
        $options: "i",
      },
    });

    if (!user) {
      return res.status(401).json({ message: "User account no longer exists." });
    }

    return res.status(200).json({ user: serializeUser(user) });
  } catch (error) {
    console.error("Error fetching current user:", error);
    return res.status(500).json({ message: "Failed to verify session." });
  }
});

export default router;
