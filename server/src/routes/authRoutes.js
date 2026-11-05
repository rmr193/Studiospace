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

// First-party OAuth completion bridge for cross-domain (Vercel <-> Render) deployments
router.get("/oauth-complete", async (req, res) => {
  const fallbackClient = process.env.CLIENT_URL || "https://studiospace-lyart.vercel.app";
  const redirectTarget = req.query.redirect ? String(req.query.redirect) : fallbackClient;

  try {
    const auth = getBetterAuth();
    const sessionData = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!sessionData?.user?.email) {
      return res.redirect(`${ fallbackClient }/login?error=oauth_session_missing`);
    }

    const normalizedEmail = sessionData.user.email.trim().toLowerCase();
    const db = getDB();
    const usersCol = db.collection("users");

    let user = await usersCol.findOne({
      email: {
        $regex: `^${normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
        $options: "i",
      },
    });

    if (user) {
      const updates = {};
      if (!user.role) updates.role = "host";
      if (!Array.isArray(user.wishlist)) updates.wishlist = [];
      if (Object.keys(updates).length > 0) {
        await usersCol.updateOne({ _id: user._id }, { $set: updates });
        user = { ...user, ...updates };
      }
    }

    const secret = process.env.JWT_SECRET || "studiospace_jwt_secret_replace_in_production_2026";
    const token = jwt.sign(
      {
        id: String(user?._id || sessionData.user.id),
        email: normalizedEmail,
        name: user?.name || sessionData.user.name,
        role: user?.role || "host",
      },
      secret,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, getCookieOptions());

    const redirectUrl = new URL(redirectTarget);
    redirectUrl.searchParams.set("auth_token", token);
    return res.redirect(redirectUrl.toString());
  } catch (error) {
    console.error("OAuth completion error:", error);
    return res.redirect(`${fallbackClient}/login?error=oauth_failed`);
  }
});

// Challenge 1: POST /api/auth/jwt — Accepts { email }, signs JWT, sets HTTPOnly cookie
router.post("/jwt", async (req, res) => {
  try {
    let { email, name, image, role } = req.body || {};

    if (!email) {
      try {
        const auth = getBetterAuth();
        const sessionData = await auth.api.getSession({
          headers: fromNodeHeaders(req.headers),
        });
        if (sessionData?.user?.email) {
          email = sessionData.user.email;
          name = name || sessionData.user.name;
          image = image || sessionData.user.image;
        }
      } catch {
        // Fall through
      }
    }

    if (!email) {
      return res.status(400).json({ message: "Email is required to issue a JWT." });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const db = getDB();
    const usersCol = db.collection("users");

    let user = await usersCol.findOne({
      email: {
        $regex: `^${normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
        $options: "i",
      },
    });

    if (!user) {
      try {
        const auth = getBetterAuth();
        const sessionData = await auth.api.getSession({
          headers: fromNodeHeaders(req.headers),
        });
        if (sessionData?.user?.email && sessionData.user.email.toLowerCase() === normalizedEmail) {
          user = sessionData.user;
        }
      } catch {
        // Fall through
      }
    }

    if (!user) {
      return res.status(401).json({
        message: "Unauthorized: No registered BetterAuth user found for this email.",
      });
    }

    // Ensure custom fields exist on BetterAuth user record
    const updates = {};
    if (!user.role) updates.role = role || "host";
    if (!Array.isArray(user.wishlist)) updates.wishlist = [];
    if (image && !user.image) updates.image = image;
    if (name && !user.name) updates.name = name;

    if (Object.keys(updates).length > 0) {
      await usersCol.updateOne({ _id: user._id }, { $set: updates });
      user = { ...user, ...updates };
    }

    const secret = process.env.JWT_SECRET || "studiospace_jwt_secret_replace_in_production_2026";
    const payload = {
      id: String(user._id),
      email: user.email,
      name: user.name,
      role: user.role || "host",
    };

    const token = jwt.sign(payload, secret, { expiresIn: "7d" });

    res.cookie("token", token, getCookieOptions());

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        image:
          user.image ||
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
        role: user.role || "host",
        wishlist: (user.wishlist || []).map((id) => String(id)),
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Error issuing JWT:", error);
    return res.status(500).json({ message: "Failed to generate authentication token." });
  }
});

// Challenge 1: POST /api/auth/logout — Clears the HTTPOnly JWT cookie
router.post("/logout", (req, res) => {
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
        $regex: `^${req.user.email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
        $options: "i",
      },
    });

    if (!user) {
      return res.status(401).json({ message: "User account no longer exists." });
    }

    return res.status(200).json({
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        image:
          user.image ||
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
        role: user.role || "host",
        wishlist: (user.wishlist || []).map((id) => String(id)),
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Error fetching current user:", error);
    return res.status(500).json({ message: "Failed to verify session." });
  }
});

export default router;
