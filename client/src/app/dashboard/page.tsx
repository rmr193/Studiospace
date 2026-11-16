"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  CalendarCheck,
  Clock,
  DollarSign,
  Heart,
  LayoutDashboard,
  LayoutGrid,
  Loader2,
  PlusCircle,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Booking, Studio } from "@/types";
import { apiFetch, formatHourLabel } from "@/lib/api";
import { PrivateRoute } from "@/components/PrivateRoute";
import { useAuth } from "@/providers/AuthProvider";

interface BookingStats {
  totalBookings: number;
  confirmedCount: number;
  pendingCount: number;
  completedCount: number;
  totalHoursBooked: number;
  totalSpent: number;
}

const emptyStats: BookingStats = {
  totalBookings: 0,
  confirmedCount: 0,
  pendingCount: 0,
  completedCount: 0,
  totalHoursBooked: 0,
  totalSpent: 0,
};

function statusClasses(status: Booking["status"]) {
  switch (status) {
    case "Confirmed":
      return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
    case "Pending":
      return "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30";
    case "Completed":
      return "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30";
    case "Cancelled":
    default:
      return "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30";
  }
}

function DashboardContent() {
  const { user } = useAuth();
  const [stats, setStats] = useState<BookingStats>(emptyStats);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [listings, setListings] = useState<Studio[]>([]);
  const [savedStudios, setSavedStudios] = useState<Studio[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const [statsRes, bookingsRes, listingsRes, wishlistRes] = await Promise.allSettled([
          apiFetch<BookingStats>("/api/bookings/stats"),
          apiFetch<Booking[]>("/api/my-bookings"),
          apiFetch<Studio[]>("/api/my-listings"),
          apiFetch<Studio[]>("/api/wishlist"),
        ]);

        if (!active) return;

        if (statsRes.status === "fulfilled") setStats(statsRes.value);
        if (bookingsRes.status === "fulfilled") setBookings(bookingsRes.value);
        if (listingsRes.status === "fulfilled") setListings(listingsRes.value);
        if (wishlistRes.status === "fulfilled") setSavedStudios(wishlistRes.value);

        if ([statsRes, bookingsRes, listingsRes, wishlistRes].every((r) => r.status === "rejected")) {
          toast.error("We could not load your dashboard data. Please refresh and try again.");
        }
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const upcoming = bookings
    .filter((booking) => booking.status === "Confirmed" || booking.status === "Pending")
    .slice(0, 4);

  const statCards = [
    {
      label: "Total bookings",
      value: stats.totalBookings,
      hint: `${stats.completedCount} completed`,
      icon: CalendarCheck,
      tone: "bg-brand-500/10 text-brand-600 dark:text-brand-400",
    },
    {
      label: "Hours booked",
      value: `${stats.totalHoursBooked}h`,
      hint: `${stats.confirmedCount} confirmed · ${stats.pendingCount} pending`,
      icon: Clock,
      tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Production spend",
      value: `$${stats.totalSpent.toLocaleString()}`,
      hint: "Across all reservations",
      icon: DollarSign,
      tone: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    },
    {
      label: "Saved studios",
      value: savedStudios.length || user?.wishlist?.length || 0,
      hint: `${listings.length} active listing${listings.length === 1 ? "" : "s"}`,
      icon: Heart,
      tone: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
          Assembling your production dashboard…
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      {/* Header */}
      <header className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-brand-950 text-white p-7 sm:p-10 relative overflow-hidden">
        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="relative space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-white/10 border border-white/15">
            <LayoutDashboard className="w-3.5 h-3.5 text-brand-400" />
            Production Dashboard
          </span>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
            <div className="space-y-1.5">
              <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
                Welcome back, {user?.name?.split(" ")[0] || "creator"}
              </h1>
              <p className="text-sm text-slate-300 max-w-2xl">
                Track reservations, manage your studio listings, and keep every production detail in
                one call sheet.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/studios"
                className="px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors shadow-lg shadow-brand-500/25"
              >
                Explore studios <ArrowUpRight className="w-4 h-4" />
              </Link>
              <Link
                href="/add-studio"
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors"
              >
                <PlusCircle className="w-4 h-4" /> List a studio
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Stats */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map(({ label, value, hint, icon: Icon, tone }) => (
          <div
            key={label}
            className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tone}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-display font-bold text-slate-900 dark:text-white">{value}</p>
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">{label}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{hint}</p>
            </div>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming bookings */}
        <section className="lg:col-span-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between gap-3 px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                Upcoming reservations
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pending and confirmed studio sessions
              </p>
            </div>
            <Link
              href="/my-bookings"
              className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline whitespace-nowrap"
            >
              View all
            </Link>
          </div>

          {upcoming.length === 0 ? (
            <div className="px-6 py-12 text-center space-y-3">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-brand-500/10 flex items-center justify-center">
                <CalendarCheck className="w-6 h-6 text-brand-500" />
              </div>
              <p className="font-semibold text-slate-900 dark:text-white">No upcoming sessions yet</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Browse verified photo studios, sound stages, and recording suites to book your next
                production window.
              </p>
              <Link
                href="/studios"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-colors"
              >
                Find a studio <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {upcoming.map((booking) => (
                <li key={booking._id}>
                  <Link
                    href={`/studios/${booking.studioId}`}
                    className="flex items-center gap-4 px-5 sm:px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <img
                      src={booking.studioImage}
                      alt={booking.studioTitle}
                      className="w-14 h-14 rounded-xl object-cover border border-slate-200 dark:border-slate-800"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {booking.studioTitle}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {booking.bookingDate} · {formatHourLabel(booking.startTime)} –{" "}
                        {formatHourLabel(booking.endTime)}
                      </p>
                    </div>
                    <div className="text-right shrink-0 space-y-1">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${statusClasses(booking.status)}`}
                      >
                        {booking.status}
                      </span>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        ${Number(booking.totalPrice || 0).toLocaleString()}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Quick actions */}
        <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-5 sm:p-6 space-y-4">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
              Quick actions
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Everything you need to run your studio business
            </p>
          </div>

          <div className="space-y-2.5">
            {[
              {
                href: "/my-listings",
                label: "Manage listings",
                description: `${listings.length} studio${listings.length === 1 ? "" : "s"} published`,
                icon: LayoutGrid,
              },
              {
                href: "/wishlist",
                label: "Saved studios",
                description: `${savedStudios.length} saved space${savedStudios.length === 1 ? "" : "s"}`,
                icon: Heart,
              },
              {
                href: "/my-bookings",
                label: "Booking history",
                description: "Download PDF invoices",
                icon: CalendarCheck,
              },
              {
                href: "/add-studio",
                label: "Add a new studio",
                description: "Publish in minutes",
                icon: PlusCircle,
              },
            ].map(({ href, label, description, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-3 hover:border-brand-500/50 hover:bg-brand-500/5 transition-colors"
              >
                <span className="w-9 h-9 rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                  <Icon className="w-4 h-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-slate-900 dark:text-white">
                    {label}
                  </span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400">{description}</span>
                </span>
                <ArrowUpRight className="w-4 h-4 text-slate-400 ml-auto shrink-0" />
              </Link>
            ))}
          </div>

          <div className="rounded-xl bg-brand-500/10 border border-brand-500/20 p-3.5 text-xs text-brand-700 dark:text-brand-300 flex gap-2">
            <Sparkles className="w-4 h-4 shrink-0" />
            <p>
              Signed in as <span className="font-bold">{user?.email}</span>. Your API session is
              stored in an HTTPOnly cookie.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <PrivateRoute>
      <DashboardContent />
    </PrivateRoute>
  );
}
