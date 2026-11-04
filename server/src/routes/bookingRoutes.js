import express from "express";
import { ObjectId } from "mongodb";
import { getDB } from "../config/db.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

function buildIdQuery(id) {
  if (ObjectId.isValid(id)) {
    return { $or: [{ _id: new ObjectId(id) }, { _id: id }] };
  }
  return { _id: id };
}

function serializeBooking(doc) {
  if (!doc) return null;
  return {
    ...doc,
    _id: String(doc._id),
    studioId: String(doc.studioId),
  };
}

// GET /api/bookings/studio/:studioId — Fetch active (Confirmed/Pending) bookings for availability display
router.get("/bookings/studio/:studioId", async (req, res) => {
  try {
    const { studioId } = req.params;
    const { date } = req.query;
    const db = getDB();

    const query = {
      studioId: String(studioId),
      status: { $in: ["Confirmed", "Pending"] },
    };
    if (date) {
      query.bookingDate = String(date);
    }

    const bookings = await db
      .collection("bookings")
      .find(query)
      .sort({ bookingDate: 1, startTime: 1 })
      .toArray();

    return res.status(200).json(
      bookings.map((b) => ({
        _id: String(b._id),
        studioId: String(b.studioId),
        bookingDate: b.bookingDate,
        startTime: b.startTime,
        endTime: b.endTime,
        status: b.status,
      }))
    );
  } catch (error) {
    console.error("Error fetching studio availability:", error);
    return res.status(500).json({ message: "Failed to fetch studio availability." });
  }
});

// Challenge 2: POST /api/bookings — Protected with Double-Booking Collision Prevention
router.post("/bookings", verifyToken, async (req, res) => {
  try {
    const {
      studioId,
      studioTitle,
      studioImage,
      hourlyRate,
      securityDeposit,
      bookingDate,
      startTime,
      endTime,
      totalPrice,
      userName,
    } = req.body;

    const newStartTime = Number(startTime);
    const newEndTime = Number(endTime);

    if (!studioId || !bookingDate || Number.isNaN(newStartTime) || Number.isNaN(newEndTime)) {
      return res.status(400).json({
        message: "Please select a valid booking date, start hour, and end hour.",
      });
    }

    if (newEndTime <= newStartTime) {
      return res.status(400).json({
        message: "End hour must be after the start hour.",
      });
    }

    const db = getDB();
    const bookingsCol = db.collection("bookings");

    // Challenge 2: Collision Check using MongoDB overlap operators
    // First check Confirmed bookings as specified in prompt, plus Pending reservations to prevent duplicate requests
    const confirmedOverlap = await bookingsCol.findOne({
      studioId: String(studioId),
      bookingDate: String(bookingDate),
      status: "Confirmed",
      startTime: { $lt: newEndTime },
      endTime: { $gt: newStartTime },
    });

    const pendingOverlap = await bookingsCol.findOne({
      studioId: String(studioId),
      bookingDate: String(bookingDate),
      status: "Pending",
      startTime: { $lt: newEndTime },
      endTime: { $gt: newStartTime },
    });

    if (confirmedOverlap || pendingOverlap) {
      return res.status(409).json({
        message:
          "This studio is already booked during the selected hours. Please choose a different time slot.",
      });
    }

    const hours = newEndTime - newStartTime;
    const rate = Number(hourlyRate || 0);
    const deposit = Number(securityDeposit || 0);
    const computedTotal = totalPrice !== undefined ? Number(totalPrice) : hours * rate + deposit;

    const newBooking = {
      studioId: String(studioId),
      studioTitle: studioTitle || "Creative Production Studio",
      studioImage: studioImage || "",
      hourlyRate: rate,
      securityDeposit: deposit,
      userEmail: req.user.email.toLowerCase(),
      userName: userName || req.user.name || req.user.email.split("@")[0],
      bookingDate: String(bookingDate),
      startTime: newStartTime,
      endTime: newEndTime,
      totalPrice: computedTotal,
      status: "Pending",
      createdAt: new Date(),
    };

    const result = await bookingsCol.insertOne(newBooking);

    return res.status(201).json(
      serializeBooking({
        ...newBooking,
        _id: result.insertedId,
      })
    );
  } catch (error) {
    console.error("Error creating booking:", error);
    return res.status(500).json({ message: "Failed to create studio booking." });
  }
});

// GET /api/my-bookings — Protected: Returns all bookings for req.user.email
router.get("/my-bookings", verifyToken, async (req, res) => {
  try {
    const db = getDB();
    const userEmail = req.user.email;

    const bookings = await db
      .collection("bookings")
      .find({
        userEmail: {
          $regex: `^${userEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
          $options: "i",
        },
      })
      .sort({ createdAt: -1 })
      .toArray();

    return res.status(200).json(bookings.map(serializeBooking));
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    return res.status(500).json({ message: "Failed to fetch your bookings." });
  }
});

// PATCH /api/bookings/:id/cancel — Protected: Updates booking status to "Cancelled" if "Pending"
router.patch("/bookings/:id/cancel", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();
    const existing = await db.collection("bookings").findOne(buildIdQuery(id));

    if (!existing) {
      return res.status(404).json({ message: "Booking reservation not found." });
    }

    if (existing.userEmail.toLowerCase() !== req.user.email.toLowerCase()) {
      return res.status(403).json({
        message: "Forbidden: You can only cancel your own studio reservations.",
      });
    }

    if (existing.status !== "Pending") {
      return res.status(400).json({
        message: `Cannot cancel a booking with status "${existing.status}". Only "Pending" bookings can be cancelled.`,
      });
    }

    await db
      .collection("bookings")
      .updateOne({ _id: existing._id }, { $set: { status: "Cancelled", updatedAt: new Date() } });

    const updated = await db.collection("bookings").findOne({ _id: existing._id });
    return res.status(200).json(serializeBooking(updated));
  } catch (error) {
    console.error("Error cancelling booking:", error);
    return res.status(500).json({ message: "Failed to cancel booking." });
  }
});

export default router;

