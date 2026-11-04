"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, Compass, Sparkles } from "lucide-react";
import { Studio } from "@/types";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";
import { PrivateRoute } from "@/components/PrivateRoute";
import { StudioCard, StudioGridSkeleton } from "@/components/StudioCard";

export default function WishlistPage() {
  const { user } = useAuth();
  const [wishlistStudios, setWishlistStudios] = useState<Studio[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await apiFetch<Studio[]>("/api/wishlist");
        if (active) setWishlistStudios(data);
      } catch (err) {
        console.error("Failed to fetch wishlist:", err);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [user?.wishlist]);

  return (
    <PrivateRoute>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-brand-500">
              <Sparkles className="w-3.5 h-3.5" /> Location Scout Shortlist
            </span>
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              Saved Studio Wishlist ({wishlistStudios.length})
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
              Keep track of shortlisted sound stages, cyclorama lofts, and recording rooms for upcoming
              productions.
            </p>
          </div>
          <Link
            href="/studios"
            className="px-5 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm inline-flex items-center gap-2 shadow-lg shadow-brand-500/25 self-start sm:self-auto"
          >
            <Compass className="w-4 h-4" />
            <span>Scout More Studios</span>
          </Link>
        </div>

        {loading ? (
          <StudioGridSkeleton count={3} />
        ) : wishlistStudios.length === 0 ? (
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-12 text-center max-w-xl mx-auto space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/25 mx-auto flex items-center justify-center text-rose-500">
              <Heart className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
                Your Location Shortlist is Empty
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Tap the heart icon on any studio card while scouting to save spaces to your wishlist.
              </p>
            </div>
            <Link
              href="/studios"
              className="px-6 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm inline-flex items-center gap-2 shadow-lg shadow-brand-500/25"
            >
              <Compass className="w-4 h-4" />
              <span>Explore Studios</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlistStudios.map((studio) => (
              <StudioCard key={studio._id} studio={studio} />
            ))}
          </div>
        )}
      </div>
    </PrivateRoute>
  );
}

