"use client";

import React from "react";
import Link from "next/link";
import { Heart, MapPin, Star, Users, ArrowUpRight } from "lucide-react";
import { Studio } from "@/types";
import { useAuth } from "@/providers/AuthProvider";

export function StudioCard({ studio }: { studio: Studio }) {
  const { user, toggleWishlist } = useAuth();
  const isWishlisted = Boolean(user?.wishlist?.includes(studio._id));

  const handleWishlistClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleWishlist(studio._id);
  };

  return (
    <article className="h-full flex flex-col justify-between rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/90 overflow-hidden shadow-sm hover:shadow-xl hover:border-brand-500/40 dark:hover:border-brand-500/40 transition-all duration-300 group">
      {/* Top Media + Content */}
      <div>
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
          <img
            src={studio.imageUrl}
            alt={studio.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-transparent to-slate-950/20" />

          {/* Category Badge */}
          <span className="absolute top-3.5 left-3.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-950/80 text-white backdrop-blur-md border border-white/15">
            {studio.category}
          </span>

          {/* Heart Wishlist Button */}
          <button
            type="button"
            onClick={handleWishlistClick}
            aria-label={isWishlisted ? "Remove from wishlist" : "Save to wishlist"}
            className={`absolute top-3.5 right-3.5 w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md border transition-all ${
              isWishlisted
                ? "bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-500/30"
                : "bg-slate-950/60 text-white border-white/20 hover:bg-brand-500 hover:border-brand-400"
            }`}
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? "fill-current" : ""}`} />
          </button>

          {/* Bottom Overlay: Price & Rating */}
          <div className="absolute bottom-3 left-3.5 right-3.5 flex items-center justify-between">
            <div className="px-3 py-1 rounded-xl bg-slate-950/85 backdrop-blur-md border border-white/15 text-white">
              <span className="font-display text-base font-bold text-brand-400">
                ${studio.hourlyRate}
              </span>
              <span className="text-xs text-slate-300"> / hr</span>
            </div>

            <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-950/85 backdrop-blur-md border border-white/15 text-amber-400 text-xs font-bold">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              <span>{Number(studio.rating || 4.8).toFixed(1)}</span>
            </div>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5 truncate">
              <MapPin className="w-3.5 h-3.5 text-brand-500 shrink-0" />
              <span className="truncate">{studio.location}</span>
            </span>
            <span className="flex items-center gap-1 shrink-0 font-medium">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              Up to {studio.maxCapacity} crew
            </span>
          </div>

          <h3 className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white line-clamp-1 group-hover:text-brand-500 transition-colors">
            {studio.title}
          </h3>

          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {studio.overview}
          </p>

          {/* Amenities Preview */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {(studio.amenities || []).slice(0, 3).map((item) => (
              <span
                key={item}
                className="px-2.5 py-0.5 rounded-lg text-[11px] font-medium bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60"
              >
                {item}
              </span>
            ))}
            {(studio.amenities?.length || 0) > 3 && (
              <span className="px-2 py-0.5 rounded-lg text-[11px] font-medium bg-brand-500/10 text-brand-600 dark:text-brand-400">
                +{studio.amenities.length - 3} more
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Footer CTA */}
      <div className="px-5 pb-5 pt-2">
        <Link
          href={`/studios/${studio._id}`}
          className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-brand-500 dark:bg-slate-800 dark:hover:bg-brand-500 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors shadow-sm"
        >
          <span>View Details</span>
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>
    </article>
  );
}

export function StudioGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-full flex flex-col justify-between rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden animate-pulse"
        >
          <div>
            <div className="aspect-[16/10] w-full bg-slate-200 dark:bg-slate-800" />
            <div className="p-5 space-y-3">
              <div className="h-3.5 w-1/2 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-5 w-4/5 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-4 w-2/3 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="flex gap-2 pt-1">
                <div className="h-5 w-20 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                <div className="h-5 w-24 bg-slate-200 dark:bg-slate-800 rounded-lg" />
              </div>
            </div>
          </div>
          <div className="px-5 pb-5">
            <div className="h-10 w-full bg-slate-200 dark:bg-slate-800 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

