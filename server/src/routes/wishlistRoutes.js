import express from "express";
import { ObjectId } from "mongodb";
import { getDB } from "../config/db.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

// POST /api/wishlist/toggle — Protected: Toggle studioId in user's wishlist using $addToSet / $pull
router.post("/wishlist/toggle", verifyToken, async (req, res) => {
  try {
    const { studioId } = req.body;
    if (!studioId) {
      return res.status(400).json({ message: "studioId is required." });
    }

    const db = getDB();
    const usersCol = db.collection("users");
    const emailRegex = `^${req.user.email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`;

    let user = await usersCol.findOne({
      email: { $regex: emailRegex, $options: "i" },
    });

    if (!user) {
      return res.status(404).json({ message: "User profile not found." });
    }

    const targetId = String(studioId);
    const currentWishlist = Array.isArray(user.wishlist) ? user.wishlist.map(String) : [];
    const exists = currentWishlist.includes(targetId);

    if (exists) {
      await usersCol.updateOne({ _id: user._id }, { $pull: { wishlist: targetId } });
    } else {
      await usersCol.updateOne({ _id: user._id }, { $addToSet: { wishlist: targetId } });
    }

    const updatedUser = await usersCol.findOne({ _id: user._id });
    const updatedWishlist = Array.isArray(updatedUser?.wishlist)
      ? updatedUser.wishlist.map(String)
      : [];

    return res.status(200).json({
      success: true,
      action: exists ? "removed" : "added",
      wishlist: updatedWishlist,
      message: exists ? "Removed from your saved wishlist." : "Added to your saved wishlist.",
    });
  } catch (error) {
    console.error("Error toggling wishlist:", error);
    return res.status(500).json({ message: "Failed to update wishlist." });
  }
});

// GET /api/wishlist — Protected: Return full studio documents matching user's saved wishlist IDs
router.get("/wishlist", verifyToken, async (req, res) => {
  try {
    const db = getDB();
    const emailRegex = `^${req.user.email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`;
    const user = await db.collection("users").findOne({
      email: { $regex: emailRegex, $options: "i" },
    });

    const wishlistIds = Array.isArray(user?.wishlist) ? user.wishlist.map(String) : [];
    if (wishlistIds.length === 0) {
      return res.status(200).json([]);
    }

    const objectIds = wishlistIds
      .filter((id) => ObjectId.isValid(id))
      .map((id) => new ObjectId(id));

    const studios = await db
      .collection("studios")
      .find({
        $or: [{ _id: { $in: objectIds } }, { _id: { $in: wishlistIds } }],
      })
      .toArray();

    return res.status(200).json(
      studios.map((s) => ({
        ...s,
        _id: String(s._id),
      }))
    );
  } catch (error) {
    console.error("Error fetching wishlist studios:", error);
    return res.status(500).json({ message: "Failed to fetch wishlist studios." });
  }
});

export default router;

