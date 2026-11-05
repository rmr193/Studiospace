"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  FileDown,
  XCircle,
  AlertTriangle,
  Loader2,
  Sparkles,
  CalendarCheck,
  ArrowUpRight,
} from "lucide-react";
import { toast } from "sonner";
import { Booking, BookingStatus } from "@/types";
import { apiFetch, formatHourLabel } from "@/lib/api";
import { generateBookingInvoicePDF } from "@/lib/invoiceGenerator";
import { PrivateRoute } from "@/components/PrivateRoute";

function getStatusBadgeClasses(status: BookingStatus): string {
  switch (status) {
    case "Confirmed":
      return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
    case "Pending":
      return "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30";
    case "Completed":
      return "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30";
    case "Cancelled":
      return "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30";
    default:
      return "bg-slate-500/15 text-slate-500 border-slate-500/30";
  }
}

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await apiFetch<Booking[]>("/api/my-bookings");
        if (active) setBookings(data);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to load your studio bookings.";
        toast.error(msg);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Accessibility: close cancellation modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && bookingToCancel) {
        setBookingToCancel(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [bookingToCancel]);

  const handleConfirmCancel = async () => {
    if (!bookingToCancel) return;
    setCancelling(true);
    try {
      const updated = await apiFetch<Booking>(`/api/bookings/${bookingToCancel._id}/cancel`, {
        method: "PATCH",
      });
      setBookings((prev) =>
        prev.map((item) => (item._id === updated._id ? updated : item))
      );
      toast.success(`Cancelled reservation for "${bookingToCancel.studioTitle}".`);
      setBookingToCancel(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to cancel booking.";
      toast.error(msg);
    } finally {
      setCancelling(false);
    }
  };

  const handleDownloadInvoice = (booking: Booking) => {
    try {
      generateBookingInvoicePDF(booking);
      toast.success(`Downloaded PDF Invoice (#SS-${booking._id.slice(-8).toUpperCase()}).`);
    } catch {
      toast.error("Failed to generate PDF invoice.");
    }
  };

  return (
    <PrivateRoute>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-brand-500">
              <Sparkles className="w-3.5 h-3.5" /> Production Call Sheet Schedule
            </span>
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              My Studio Bookings ({bookings.length})
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
              Inspect reserved studio hours, download itemized PDF receipts, or manage pending call
              sheets.
            </p>
          </div>
          <Link
            href="/studios"
            className="px-5 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm inline-flex items-center gap-2 shadow-lg shadow-brand-500/25 self-start sm:self-auto"
          >
            <span>Book Another Studio</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-36 w-full rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse"
              />
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-12 text-center max-w-xl mx-auto space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/25 mx-auto flex items-center justify-center text-brand-500">
              <CalendarCheck className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
                No Studio Reservations Yet
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Explore our verified photo studios, cinema sound stages, and recording suites to lock
                in your first shoot slot.
              </p>
            </div>
            <Link
              href="/studios"
              className="px-6 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm inline-flex items-center gap-2 shadow-lg shadow-brand-500/25"
            >
              <span>Explore Studios</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => {
              const durationHours = Math.max(1, booking.endTime - booking.startTime);
              return (
                <div
                  key={booking._id}
                  className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-brand-500/40 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                >
                  {/* Studio Image & Details */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                    <Link
                      href={`/studios/${booking.studioId}`}
                      className="w-full sm:w-44 aspect-[16/10] rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0"
                    >
                      <img
                        src={
                          booking.studioImage ||
                          "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=800&q=80"
                        }
                        alt={booking.studioTitle}
                        className="w-full h-full object-cover hover:scale-105 transition-transform"
                      />
                    </Link>

                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getStatusBadgeClasses(
                            booking.status
                          )}`}
                        >
                          {booking.status}
                        </span>
                        <span className="text-xs font-mono text-slate-400">
                          ID: #{booking._id.slice(-8).toUpperCase()}
                        </span>
                      </div>

                      <Link
                        href={`/studios/${booking.studioId}`}
                        className="font-display text-xl font-bold text-slate-900 dark:text-white hover:text-brand-500 transition-colors block"
                      >
                        {booking.studioTitle}
                      </Link>

                      <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Calendar className="w-4 h-4 text-brand-500" />
                          {booking.bookingDate}
                        </span>
                        <span className="flex items-center gap-1.5 font-medium">
                          <Clock className="w-4 h-4 text-brand-500" />
                          {formatHourLabel(booking.startTime)} – {formatHourLabel(booking.endTime)} (
                          {durationHours} {durationHours === 1 ? "hr" : "hrs"})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Pricing & Action Buttons */}
                  <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-start sm:items-center lg:items-end xl:items-center justify-between gap-4 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
                    <div className="lg:text-right xl:mr-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Total Paid (Incl. Deposit)
                      </span>
                      <p className="font-display text-2xl font-bold text-brand-500">
                        ${booking.totalPrice}
                        <span className="text-xs font-normal text-slate-500"> USD</span>
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleDownloadInvoice(booking)}
                        className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-brand-500 dark:bg-slate-800 dark:hover:bg-brand-500 text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-colors"
                      >
                        <FileDown className="w-4 h-4" />
                        <span>Download Invoice (PDF)</span>
                      </button>

                      {booking.status === "Pending" && (
                        <button
                          type="button"
                          onClick={() => setBookingToCancel(booking)}
                          className="px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-600 dark:text-rose-400 hover:text-white border border-rose-500/30 text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Cancel Booking</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Custom Cancel Booking Confirmation Modal (Zero Native Alerts) */}
        {bookingToCancel && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm"
          >
            <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-5">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div className="space-y-2">
                <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
                  Cancel Pending Studio Booking?
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Are you sure you want to release your reservation at{" "}
                  <strong className="text-slate-900 dark:text-white">
                    {bookingToCancel.studioTitle}
                  </strong>{" "}
                  on <strong>{bookingToCancel.bookingDate}</strong> (
                  {formatHourLabel(bookingToCancel.startTime)} –{" "}
                  {formatHourLabel(bookingToCancel.endTime)})?
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={cancelling}
                  onClick={() => setBookingToCancel(null)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Keep Reservation
                </button>
                <button
                  type="button"
                  disabled={cancelling}
                  onClick={handleConfirmCancel}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold inline-flex items-center gap-2 shadow-lg shadow-rose-600/25"
                >
                  {cancelling ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Cancelling...</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4" />
                      <span>Confirm Cancellation</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PrivateRoute>
  );
}

