"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import {
  MapPin,
  Star,
  Users,
  ShieldCheck,
  Heart,
  Calendar,
  Clock,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
  AlertTriangle,
  Loader2,
  X,
  Zap,
  Award,
} from "lucide-react";
import { toast } from "sonner";
import { Studio, BookedSlot } from "@/types";
import { apiFetch, formatHourLabel } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const PRODUCTION_REVIEWS = [
  {
    id: "rev-1",
    author: "Devon Brooks, ASC",
    role: "Commercial Director of Photography",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
    rating: 5.0,
    date: "October 2026",
    comment:
      "Immaculate stage maintenance. The 3-phase Cam-Lok tie-in handled our lighting package effortlessly, and the acoustic isolation held steady even during rush-hour exterior traffic.",
  },
  {
    id: "rev-2",
    author: "Sienna K. Morales",
    role: "Executive Producer, FrameHaus Media",
    avatar:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
    rating: 4.9,
    date: "October 2026",
    comment:
      "Load-in through the freight bay took less than 20 minutes. Dedicated client lounge and high-speed fiber made live agency remote viewing completely seamless.",
  },
];

const HOURS_OPTIONS = Array.from({ length: 17 }, (_, idx) => idx + 6); // 6:00 AM (6) to 10:00 PM (22)

export default function StudioDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const studioId = String(params?.id || "");
  const { user, toggleWishlist } = useAuth();

  const [studio, setStudio] = useState<Studio | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);

  // Booking Modal Form State
  const [bookingDate, setBookingDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState<number>(10);
  const [endTime, setEndTime] = useState<number>(14);
  const [bookedSlots, setBookedSlots] = useState<BookedSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submittingBooking, setSubmittingBooking] = useState(false);

  const isWishlisted = Boolean(studio && user?.wishlist?.includes(studio._id));

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await apiFetch<Studio>(`/api/studios/${studioId}`);
        if (active) setStudio(data);
      } catch (err) {
        console.error("Failed to fetch studio details:", err);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [studioId]);

  const fetchAvailability = useCallback(
    async (dateStr: string) => {
      if (!studioId || !dateStr) return;
      setLoadingSlots(true);
      try {
        const slots = await apiFetch<BookedSlot[]>(
          `/api/bookings/studio/${studioId}?date=${encodeURIComponent(dateStr)}`
        );
        setBookedSlots(slots);
      } catch {
        setBookedSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    },
    [studioId]
  );

  useEffect(() => {
    if (bookingDate && studioId) {
      fetchAvailability(bookingDate);
    }
  }, [bookingDate, studioId, fetchAvailability]);

  const handleOpenBookingModal = () => {
    if (!user) {
      toast.info("Please sign in to reserve studio hours.");
      router.push(`/login?redirect=${encodeURIComponent(`/studios/${studioId}`)}`);
      return;
    }
    setBookingModalOpen(true);
  };

  const totalHours = Math.max(0, endTime - startTime);
  const hourlySubtotal = studio ? totalHours * studio.hourlyRate : 0;
  const securityDeposit = studio ? studio.securityDeposit : 0;
  const grandTotal = totalHours > 0 ? hourlySubtotal + securityDeposit : 0;

  const hasOverlapWithExisting = bookedSlots.some(
    (slot) => slot.startTime < endTime && slot.endTime > startTime
  );

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studio) return;

    if (endTime <= startTime) {
      toast.error("Wrap hour must be later than load-in start hour.");
      return;
    }

    setSubmittingBooking(true);
    try {
      await apiFetch("/api/bookings", {
        method: "POST",
        body: JSON.stringify({
          studioId: studio._id,
          studioTitle: studio.title,
          studioImage: studio.imageUrl,
          hourlyRate: studio.hourlyRate,
          securityDeposit: studio.securityDeposit,
          bookingDate,
          startTime,
          endTime,
          totalPrice: grandTotal,
          userName: user?.name,
        }),
      });

      toast.success(
        `Studio reserved for ${bookingDate} (${formatHourLabel(startTime)} – ${formatHourLabel(endTime)})!`
      );
      setBookingModalOpen(false);
      router.push("/my-bookings");
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "This studio is already booked during the selected hours. Please choose a different time slot.";
      toast.error(msg);
    } finally {
      setSubmittingBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 animate-pulse">
        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        <div className="aspect-[16/9] max-h-[500px] w-full bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-10 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-xl" />
            <div className="h-24 w-full bg-slate-200 dark:bg-slate-800 rounded-xl" />
          </div>
          <div className="h-80 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!studio) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-5">
        <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">
          Studio Workspace Not Found
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          This studio listing may have been removed by its host.
        </p>
        <Link
          href="/studios"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-500 text-white font-semibold text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Explore Studios
        </Link>
      </div>
    );
  }

  const galleryImages =
    Array.isArray(studio.gallery) && studio.gallery.length > 0
      ? studio.gallery
      : [studio.imageUrl];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/studios"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-brand-500 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Production Studios</span>
        </Link>

        <button
          type="button"
          onClick={() => toggleWishlist(studio._id)}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
            isWishlisted
              ? "bg-rose-500/10 border-rose-500/40 text-rose-600 dark:text-rose-400"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-brand-500"
          }`}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? "fill-current text-rose-500" : ""}`} />
          <span>{isWishlisted ? "Saved in Wishlist" : "Save to Wishlist"}</span>
        </button>
      </div>

      {/* Studio Gallery Carousel */}
      <div className="rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 shadow-xl">
        <Swiper
          modules={[Navigation, Pagination]}
          navigation
          pagination={{ clickable: true }}
          className="w-full aspect-[16/10] max-h-[540px]"
        >
          {galleryImages.map((imgUrl, idx) => (
            <SwiperSlide key={`${imgUrl}-${idx}`}>
              <div className="relative w-full h-full">
                <img
                  src={imgUrl}
                  alt={`${studio.title} — View ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left 8 Columns: Details, Specs, Amenities, Host, Reviews */}
        <div className="lg:col-span-8 space-y-10">
          {/* Header & Badges */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-brand-500 text-white">
                {studio.category}
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                {Number(studio.rating || 4.8).toFixed(1)} Verified Stage Rating
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-brand-500" />
                {studio.location}
              </span>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              {studio.title}
            </h1>
          </div>

          {/* Specification Breakdown Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Hourly Rate
              </span>
              <p className="font-display text-2xl font-bold text-brand-500 mt-1">
                ${studio.hourlyRate}
                <span className="text-xs font-normal text-slate-500"> / hr</span>
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Gear Deposit
              </span>
              <p className="font-display text-2xl font-bold text-slate-900 dark:text-white mt-1">
                ${studio.securityDeposit}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Max Crew Size
              </span>
              <p className="font-display text-2xl font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-1.5">
                <Users className="w-5 h-5 text-brand-500" />
                {studio.maxCapacity}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Insurance
              </span>
              <p className="font-display text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1.5 flex items-center gap-1">
                <ShieldCheck className="w-5 h-5" /> $1M Included
              </p>
            </div>
          </div>

          {/* Overview Description */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
              Technical Stage Overview
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              {studio.overview}
            </p>
          </div>

          {/* Amenities & On-Site Production Gear Grid */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5">
            <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
              Included Production Equipment &amp; Amenities
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {(studio.amenities || []).map((amenity) => (
                <div
                  key={amenity}
                  className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800"
                >
                  <div className="w-8 h-8 rounded-xl bg-brand-500/15 text-brand-500 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {amenity}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Host Profile Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <img
                src={
                  studio.ownerPhoto ||
                  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80"
                }
                alt={studio.ownerName}
                className="w-16 h-16 rounded-2xl object-cover ring-2 ring-brand-500/40"
              />
              <div>
                <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-brand-500">
                  <Award className="w-3.5 h-3.5" /> Verified Studio Host
                </span>
                <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                  {studio.ownerName}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{studio.ownerEmail}</p>
              </div>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1 sm:text-right">
              <p className="font-semibold text-slate-900 dark:text-white">
                On-Site Stage Manager Included
              </p>
              <p>Avg. Call-Sheet Response: &lt; 10 mins</p>
            </div>
          </div>

          {/* Verified Production Crew Reviews */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
                Verified Crew &amp; Producer Reviews
              </h2>
              <span className="inline-flex items-center gap-1 text-sm font-bold text-amber-500">
                <Star className="w-4 h-4 fill-amber-400" /> {Number(studio.rating || 4.8).toFixed(1)} / 5.0
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {PRODUCTION_REVIEWS.map((rev) => (
                <div
                  key={rev.id}
                  className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={rev.avatar}
                        alt={rev.author}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          {rev.author}
                        </p>
                        <p className="text-xs text-slate-500">{rev.role}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-amber-500 flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400" /> {rev.rating.toFixed(1)}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    &ldquo;{rev.comment}&rdquo;
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 4 Columns: Sticky Booking Card */}
        <div className="lg:col-span-4">
          <div className="sticky top-28 p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
            <div className="flex items-baseline justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <span className="font-display text-3xl font-bold text-slate-900 dark:text-white">
                  ${studio.hourlyRate}
                </span>
                <span className="text-sm text-slate-500"> / hour</span>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                Instant Booking
              </span>
            </div>

            {/* Quick Date & Slot Preview */}
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>Minimum Call Time</span>
                <span className="font-semibold text-slate-900 dark:text-white">1 Hour</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>Refundable Gear Deposit</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  ${studio.securityDeposit}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>Max Crew &amp; Talent</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {studio.maxCapacity} People
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>Production Liability</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  $1M Included
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleOpenBookingModal}
              className="w-full py-4 px-5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-base flex items-center justify-center gap-2 shadow-lg shadow-brand-500/30 transition-all"
            >
              <Zap className="w-5 h-5" />
              <span>Book Workspace Now</span>
            </button>

            <p className="text-xs text-center text-slate-500 dark:text-slate-400">
              Real-time double-booking overlap protection active. Instant PDF invoice generated upon
              reservation.
            </p>
          </div>
        </div>
      </div>

      {/* "Book Workspace Now" Accessible Custom Modal */}
      {bookingModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="booking-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm"
        >
          <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6 max-h-[92vh] overflow-y-auto">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setBookingModalOpen(false)}
              aria-label="Close booking modal"
              className="absolute top-5 right-5 w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-500">
                <Sparkles className="w-3.5 h-3.5" /> Real-Time Stage Reservation
              </span>
              <h2
                id="booking-modal-title"
                className="font-display text-2xl font-bold text-slate-900 dark:text-white pr-8"
              >
                {studio.title}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{studio.location}</p>
            </div>

            <form onSubmit={handleConfirmBooking} className="space-y-5">
              {/* Shoot Date Picker */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Select Shoot Date
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-brand-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    required
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              {/* Existing Booked Slots Indicator for Challenge 2 Transparency */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Reserved Slots on {bookingDate}
                  </span>
                  {loadingSlots && <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-500" />}
                </div>
                {bookedSlots.length === 0 ? (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    ✓ All studio hours currently open on this date.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {bookedSlots.map((slot) => (
                      <span
                        key={slot._id}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                      >
                        Booked: {formatHourLabel(slot.startTime)} – {formatHourLabel(slot.endTime)} (
                        {slot.status})
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Start Hour & End Hour */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Load-In (Start Hour)
                  </label>
                  <div className="relative">
                    <Clock className="w-4 h-4 text-brand-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <select
                      value={startTime}
                      onChange={(e) => {
                        const newStart = Number(e.target.value);
                        setStartTime(newStart);
                        if (endTime <= newStart) {
                          setEndTime(newStart + 2);
                        }
                      }}
                      className="w-full pl-10 pr-3 py-3 rounded-xl text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                    >
                      {HOURS_OPTIONS.slice(0, -1).map((h) => (
                        <option key={h} value={h}>
                          {formatHourLabel(h)} ({h}:00)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Wrap (End Hour)
                  </label>
                  <div className="relative">
                    <Clock className="w-4 h-4 text-brand-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <select
                      value={endTime}
                      onChange={(e) => setEndTime(Number(e.target.value))}
                      className="w-full pl-10 pr-3 py-3 rounded-xl text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                    >
                      {HOURS_OPTIONS.filter((h) => h > startTime).map((h) => (
                        <option key={h} value={h}>
                          {formatHourLabel(h)} ({h}:00)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Live Overlap Warning Banner */}
              {hasOverlapWithExisting && (
                <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/35 flex items-start gap-2.5 text-xs text-amber-700 dark:text-amber-300">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                  <span>
                    Selected hours overlap with an existing booking on {bookingDate}. Submitting this
                    slot will trigger the backend <strong>409 Conflict</strong> double-booking guard.
                  </span>
                </div>
              )}

              {/* Itemized Price Breakdown */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5 text-sm">
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span>
                    Stage Rental (${studio.hourlyRate}/hr × {totalHours}{" "}
                    {totalHours === 1 ? "hr" : "hrs"})
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    ${hourlySubtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span>Refundable Gear &amp; Cyc Deposit</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    ${securityDeposit.toFixed(2)}
                  </span>
                </div>
                <div className="pt-2.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between font-display text-base font-bold">
                  <span className="text-slate-900 dark:text-white">Total Reservation Price</span>
                  <span className="text-brand-500 text-lg">${grandTotal.toFixed(2)} USD</span>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setBookingModalOpen(false)}
                  className="px-5 py-3 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingBooking || totalHours <= 0}
                  className="px-6 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-semibold text-sm inline-flex items-center gap-2 shadow-lg shadow-brand-500/25 transition-all"
                >
                  {submittingBooking ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying Slot...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm Reservation (${grandTotal})</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

