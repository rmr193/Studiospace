import express from "express";
import { ObjectId } from "mongodb";
import { getDB } from "../config/db.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

const CATEGORY_MAP = {
  "photo studio": "Photo Studio",
  "photo studios": "Photo Studio",
  "sound stage": "Sound Stage",
  "sound stages": "Sound Stage",
  "podcast room": "Podcast Room",
  "podcast rooms": "Podcast Room",
  "music suite": "Music Suite",
  "music suites": "Music Suite",
  "art workshop": "Art Workshop",
  "art workshops": "Art Workshop",
};

function normalizeCategory(raw) {
  if (!raw || raw === "All" || raw === "all") return null;
  const key = String(raw).trim().toLowerCase();
  return CATEGORY_MAP[key] || String(raw).trim();
}

function buildIdQuery(id) {
  if (ObjectId.isValid(id)) {
    return { $or: [{ _id: new ObjectId(id) }, { _id: id }] };
  }
  return { _id: id };
}

function serializeStudio(doc) {
  if (!doc) return null;
  return {
    ...doc,
    _id: String(doc._id),
  };
}

// GET /api/studios/featured — Top-rated and newest 6 studios
router.get("/studios/featured", async (req, res) => {
  try {
    const db = getDB();
    const studios = await db
      .collection("studios")
      .find({})
      .sort({ rating: -1, createdAt: -1 })
      .limit(6)
      .toArray();

    return res.status(200).json(studios.map(serializeStudio));
  } catch (error) {
    console.error("Error fetching featured studios:", error);
    return res.status(500).json({ message: "Failed to fetch featured studios." });
  }
});

// GET /api/studios — Fetch all studios with optional ?category=&search=&sort=
router.get("/studios", async (req, res) => {
  try {
    const { category, search, sort } = req.query;
    const db = getDB();

    const query = {};
    const normalizedCat = normalizeCategory(category);
    if (normalizedCat) {
      query.category = normalizedCat;
    }

    if (search && String(search).trim() !== "") {
      const escaped = String(search)
        .trim()
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.$or = [
        { title: { $regex: escaped, $options: "i" } },
        { location: { $regex: escaped, $options: "i" } },
        { overview: { $regex: escaped, $options: "i" } },
        { category: { $regex: escaped, $options: "i" } },
      ];
    }

    let sortSpec = { createdAt: -1 };
    if (sort === "price-asc" || sort === "low-to-high" || sort === "asc") {
      sortSpec = { hourlyRate: 1 };
    } else if (sort === "price-desc" || sort === "high-to-low" || sort === "desc") {
      sortSpec = { hourlyRate: -1 };
    } else if (sort === "rating") {
      sortSpec = { rating: -1, createdAt: -1 };
    }

    const studios = await db.collection("studios").find(query).sort(sortSpec).toArray();
    return res.status(200).json(studios.map(serializeStudio));
  } catch (error) {
    console.error("Error fetching studios:", error);
    return res.status(500).json({ message: "Failed to fetch studios." });
  }
});

// GET /api/studios/:id — Fetch a single studio by ID
router.get("/studios/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();
    const studio = await db.collection("studios").findOne(buildIdQuery(id));

    if (!studio) {
      return res.status(404).json({ message: "Studio workspace not found." });
    }

    return res.status(200).json(serializeStudio(studio));
  } catch (error) {
    console.error("Error fetching studio by ID:", error);
    return res.status(500).json({ message: "Failed to fetch studio details." });
  }
});

// GET /api/my-listings — Protected: Fetch studios owned by req.user.email
router.get("/my-listings", verifyToken, async (req, res) => {
  try {
    const db = getDB();
    const ownerEmail = req.user.email;
    const studios = await db
      .collection("studios")
      .find({
        ownerEmail: {
          $regex: `^${ownerEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
          $options: "i",
        },
      })
      .sort({ createdAt: -1 })
      .toArray();

    return res.status(200).json(studios.map(serializeStudio));
  } catch (error) {
    console.error("Error fetching host listings:", error);
    return res.status(500).json({ message: "Failed to fetch your studio listings." });
  }
});

// POST /api/studios — Protected: Create a new studio listing
router.post("/studios", verifyToken, async (req, res) => {
  try {
    const {
      title,
      category,
      hourlyRate,
      securityDeposit,
      maxCapacity,
      location,
      imageUrl,
      gallery,
      amenities,
      overview,
      rating,
      ownerName,
      ownerPhoto,
    } = req.body;

    if (!title || !category || !hourlyRate || !location || !imageUrl || !overview) {
      return res.status(400).json({
        message: "Please provide all required studio fields (title, category, hourlyRate, location, imageUrl, overview).",
      });
    }

    const db = getDB();
    const userDoc = await db.collection("users").findOne({
      email: {
        $regex: `^${req.user.email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
        $options: "i",
      },
    });

    const normalizedCategory = normalizeCategory(category) || "Photo Studio";
    const parsedGallery = Array.isArray(gallery) && gallery.length > 0 ? gallery : [imageUrl];
    const parsedAmenities = Array.isArray(amenities) ? amenities : [];

    const newStudio = {
      title: String(title).trim(),
      category: normalizedCategory,
      hourlyRate: Number(hourlyRate),
      securityDeposit: Number(securityDeposit ?? 150),
      maxCapacity: Number(maxCapacity ?? 10),
      location: String(location).trim(),
      imageUrl: String(imageUrl).trim(),
      gallery: parsedGallery,
      amenities: parsedAmenities,
      overview: String(overview).trim(),
      rating: Number(rating ?? 4.8),
      ownerEmail: req.user.email.toLowerCase(),
      ownerName: ownerName || userDoc?.name || req.user.name || "Studio Host",
      ownerPhoto:
        ownerPhoto ||
        userDoc?.image ||
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
      createdAt: new Date(),
    };

    const result = await db.collection("studios").insertOne(newStudio);
    return res.status(201).json(
      serializeStudio({
        ...newStudio,
        _id: result.insertedId,
      })
    );
  } catch (error) {
    console.error("Error creating studio:", error);
    return res.status(500).json({ message: "Failed to create studio listing." });
  }
});

// PATCH / PUT /api/studios/:id — Protected: Verify ownership and update studio details
async function handleUpdateStudio(req, res) {
  try {
    const { id } = req.params;
    const db = getDB();
    const existing = await db.collection("studios").findOne(buildIdQuery(id));

    if (!existing) {
      return res.status(404).json({ message: "Studio workspace not found." });
    }

    if (existing.ownerEmail.toLowerCase() !== req.user.email.toLowerCase()) {
      return res.status(403).json({
        message: "Forbidden: You can only update studio listings that you own.",
      });
    }

    const {
      title,
      category,
      hourlyRate,
      securityDeposit,
      maxCapacity,
      location,
      imageUrl,
      gallery,
      amenities,
      overview,
    } = req.body;

    const updates = {};
    if (title !== undefined) updates.title = String(title).trim();
    if (category !== undefined) updates.category = normalizeCategory(category) || existing.category;
    if (hourlyRate !== undefined) updates.hourlyRate = Number(hourlyRate);
    if (securityDeposit !== undefined) updates.securityDeposit = Number(securityDeposit);
    if (maxCapacity !== undefined) updates.maxCapacity = Number(maxCapacity);
    if (location !== undefined) updates.location = String(location).trim();
    if (imageUrl !== undefined) updates.imageUrl = String(imageUrl).trim();
    if (gallery !== undefined) updates.gallery = Array.isArray(gallery) && gallery.length > 0 ? gallery : [updates.imageUrl || existing.imageUrl];
    if (amenities !== undefined) updates.amenities = Array.isArray(amenities) ? amenities : existing.amenities;
    if (overview !== undefined) updates.overview = String(overview).trim();
    updates.updatedAt = new Date();

    await db.collection("studios").updateOne({ _id: existing._id }, { $set: updates });
    const updatedDoc = await db.collection("studios").findOne({ _id: existing._id });

    return res.status(200).json(serializeStudio(updatedDoc));
  } catch (error) {
    console.error("Error updating studio:", error);
    return res.status(500).json({ message: "Failed to update studio listing." });
  }
}

router.patch("/studios/:id", verifyToken, handleUpdateStudio);
router.put("/studios/:id", verifyToken, handleUpdateStudio);

// DELETE /api/studios/:id — Protected: Verify ownership and delete studio
router.delete("/studios/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();
    const existing = await db.collection("studios").findOne(buildIdQuery(id));

    if (!existing) {
      return res.status(404).json({ message: "Studio workspace not found." });
    }

    if (existing.ownerEmail.toLowerCase() !== req.user.email.toLowerCase()) {
      return res.status(403).json({
        message: "Forbidden: You can only delete studio listings that you own.",
      });
    }

    await db.collection("studios").deleteOne({ _id: existing._id });
    return res.status(200).json({
      success: true,
      message: "Studio workspace listing deleted permanently.",
    });
  } catch (error) {
    console.error("Error deleting studio:", error);
    return res.status(500).json({ message: "Failed to delete studio listing." });
  }
});

export default router;

