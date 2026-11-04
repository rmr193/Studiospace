import { jsPDF } from "jspdf";
import { Booking } from "@/types";
import { formatHourLabel } from "./api";

export function generateBookingInvoicePDF(booking: Booking) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const hours = Math.max(1, booking.endTime - booking.startTime);
  const hourlySubtotal = hours * booking.hourlyRate;
  const securityDeposit = Math.max(0, booking.totalPrice - hourlySubtotal);

  // Dark Header Banner
  doc.setFillColor(15, 23, 42); // Slate-900
  doc.rect(0, 0, 210, 44, "F");

  // Brand Accent Bar
  doc.setFillColor(249, 115, 22); // Brand Orange-500
  doc.rect(0, 44, 210, 2.5, "F");

  // Brand Title
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("STUDIOSPACE", 16, 22);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(203, 213, 225);
  doc.text("Creative Production & Studio Workspace Marketplace", 16, 30);

  // Invoice Badge
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(249, 115, 22);
  doc.text("PRODUCTION INVOICE", 194, 22, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  doc.text(`Receipt #SS-${booking._id.slice(-8).toUpperCase()}`, 194, 30, { align: "right" });
  doc.text(`Issued: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}`, 194, 36, { align: "right" });

  // Reservation Overview Section
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Reservation & Creator Details", 16, 60);

  doc.setDrawColor(226, 232, 240);
  doc.line(16, 63, 194, 63);

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text("Booked By:", 16, 72);
  doc.text("Creator Email:", 16, 80);
  doc.text("Booking ID:", 16, 88);
  doc.text("Booking Status:", 16, 96);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(booking.userName || "Verified Creator", 58, 72);
  doc.text(booking.userEmail, 58, 80);
  doc.text(booking._id, 58, 88);
  doc.setFont("helvetica", "bold");
  doc.text(booking.status.toUpperCase(), 58, 96);

  // Studio & Schedule Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(16, 108, 178, 42, 3, 3, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("Booked Production Workspace", 22, 118);

  doc.setFontSize(13);
  doc.setTextColor(234, 88, 12);
  doc.text(booking.studioTitle, 22, 127);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);
  doc.text(`Shoot Date: ${booking.bookingDate}`, 22, 137);
  doc.text(
    `Call Time Slot: ${formatHourLabel(booking.startTime)} - ${formatHourLabel(booking.endTime)} (${hours} ${hours === 1 ? "Hour" : "Hours"})`,
    22,
    144
  );

  // Itemized Pricing Table
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Itemized Production Charges", 16, 166);

  doc.setFillColor(241, 245, 249);
  doc.rect(16, 170, 178, 10, "F");
  doc.setFontSize(9.5);
  doc.setTextColor(51, 65, 85);
  doc.text("DESCRIPTION", 20, 176.5);
  doc.text("RATE", 120, 176.5, { align: "right" });
  doc.text("QTY", 150, 176.5, { align: "right" });
  doc.text("AMOUNT", 190, 176.5, { align: "right" });

  // Line Item 1: Studio Rental
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`Studio Stage Rental (${booking.studioTitle.slice(0, 38)})`, 20, 189);
  doc.text(`$${booking.hourlyRate.toFixed(2)}/hr`, 120, 189, { align: "right" });
  doc.text(`${hours} hrs`, 150, 189, { align: "right" });
  doc.text(`$${hourlySubtotal.toFixed(2)}`, 190, 189, { align: "right" });

  doc.setDrawColor(226, 232, 240);
  doc.line(16, 194, 194, 194);

  // Line Item 2: Refundable Gear & Facility Security Deposit
  doc.text("Refundable Equipment & Cyc Protection Deposit", 20, 203);
  doc.text(`$${securityDeposit.toFixed(2)}`, 120, 203, { align: "right" });
  doc.text("1", 150, 203, { align: "right" });
  doc.text(`$${securityDeposit.toFixed(2)}`, 190, 203, { align: "right" });

  doc.line(16, 208, 194, 208);

  // Line Item 3: $1M Host Property Guarantee
  doc.text("StudioSpace $1M Production Liability Coverage", 20, 217);
  doc.text("Included", 120, 217, { align: "right" });
  doc.text("1", 150, 217, { align: "right" });
  doc.text("$0.00", 190, 217, { align: "right" });

  doc.line(16, 222, 194, 222);

  // Total Box
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(114, 228, 80, 14, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text("TOTAL AMOUNT", 120, 237);
  doc.setTextColor(249, 115, 22);
  doc.text(`$${booking.totalPrice.toFixed(2)} USD`, 189, 237, { align: "right" });

  // Footer
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    "Thank you for producing with StudioSpace. Please present this receipt to the Stage Manager upon load-in.",
    105,
    268,
    { align: "center" }
  );
  doc.text("support@studiospace.io  |  www.studiospace.io  |  24/7 Production Desk: +1 (800) 555-STAGE", 105, 274, {
    align: "center",
  });

  doc.save(`StudioSpace-Invoice-${booking._id.slice(-6).toUpperCase()}.pdf`);
}

