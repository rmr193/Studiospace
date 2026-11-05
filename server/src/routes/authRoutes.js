import express from "express";
import jwt from "jsonwebtoken";
import { getDB } from "../config/db.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

function getCookieOptions() {
  const isProd = process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL);
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };
}

// Challenge 1: POST /api/auth/jwt — Accepts { email }, signs JWT, sets HTTPOnly cookie
router.post("/jwt", async (req, res) => {
  try {
    const { email, name, image, role } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required to issue a JWT." });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const db = getDB();
    const usersCol = db.collection("users");

    let user = await usersCol.findOne({
      email: { $regex: `^${normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
    });

    if (!user) {
      const newUser = {
        name: name || normalizedEmail.split("@")[0],
        email: normalizedEmail,
        image:
          image ||
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
        role: role || "host",
        wishlist: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const result = await usersCol.insertOne(newUser);
      user = { ...newUser, _id: result.insertedId };
    } else {
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
  const isProd = process.env.NODE_ENV === "production";
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
      email: { $regex: `^${req.user.email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
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

