"use client";

import React, { Suspense, useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  SlidersHorizontal,
  RotateCcw,
  Clapperboard,
  Sparkles,
  X,
} from "lucide-react";
import { Studio } from "@/types";
import { apiFetch } from "@/lib/api";
import { StudioCard, StudioGridSkeleton } from "@/components/StudioCard";

const CATEGORY_TABS = [
  { label: "All Studios", value: "All" },
  { label: "Photo Studios", value: "Photo Studio" },
  { label: "Sound Stages", value: "Sound Stage" },
  { label: "Podcast Rooms", value: "Podcast Room" },
  { label: "Music Suites", value: "Music Suite" },
  { label: "Art Workshops", value: "Art Workshop" },
];

function normalizeCategoryParam(raw: string | null): string {
  if (!raw || raw.toLowerCase() === "all") return "All";
  const lower = raw.trim().toLowerCase();
  if (lower.startsWith("photo")) return "Photo Studio";
  if (lower.startsWith("sound")) return "Sound Stage";
  if (lower.startsWith("podcast")) return "Podcast Room";
  if (lower.startsWith("music")) return "Music Suite";
  if (lower.startsWith("art")) return "Art Workshop";
  return raw;
}

function ExploreStudiosContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialCategory = normalizeCategoryParam(searchParams.get("category"));
  const initialSearch = searchParams.get("search") || "";
  const initialSort = searchParams.get("sort") || "newest";

  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch);
  const [sortOption, setSortOption] = useState<string>(initialSort);
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [studios, setStudios] = useState<Studio[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const paramCat = normalizeCategoryParam(searchParams.get("category"));
    setSelectedCategory(paramCat);
  }, [searchParams]);

  const fetchStudios = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory && selectedCategory !== "All") {
        params.set("category", selectedCategory);
      }
      if (searchQuery.trim()) {
        params.set("search", searchQuery.trim());
      }
      if (sortOption) {
        params.set("sort", sortOption);
      }
      if (maxPrice) {
        params.set("maxPrice", maxPrice);
      }
      const data = await apiFetch<Studio[]>(`/api/studios?${params.toString()}`);
      setStudios(data);
    } catch (err) {
      console.error("Failed to fetch studios:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchQuery, sortOption, maxPrice]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStudios();
    }, 180);
    return () => clearTimeout(timer);
  }, [fetchStudios]);

  const handleCategoryChange = (catValue: string) => {
    setSelectedCategory(catValue);
    const params = new URLSearchParams(searchParams.toString());
    if (catValue === "All") {
      params.delete("category");
    } else {
      params.set("category", catValue);
    }
    const qs = params.toString();
    router.replace(qs ? `/studios?${qs}` : "/studios", { scroll: false });
  };

  const handleResetFilters = () => {
    setSelectedCategory("All");
    setSearchQuery("");
    setSortOption("newest");
    setMaxPrice("");
    router.replace("/studios", { scroll: false });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      {/* Page Header */}
      <div className="space-y-3">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-brand-500">
          <Sparkles className="w-3.5 h-3.5" /> Production Stage Directory
        </span>
        <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 dark:text-white">
          Explore Creative Studios &amp; Stages
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl">
          Filter verified cyclorama spaces, NC-20 cinema sound stages, analog recording suites, and
          broadcast podcast lounges available for hourly booking.
        </p>
      </div>

      {/* Filter Bar: Search Input + Price Sort Dropdown */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by studio name, city, equipment (e.g., Cyclorama, ARRI, SSL, Shure)..."
              className="w-full pl-11 pr-10 py-3 rounded-xl text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search query"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filters: Price Filter & Sort Dropdown */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Max Hourly Rate Filter */}
            <div className="flex items-center gap-2 px-3.5 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <label htmlFor="max-price" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Max Rate:
              </label>
              <select
                id="max-price"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="bg-transparent text-sm font-semibold text-slate-900 dark:text-white focus:outline-none cursor-pointer"
              >
                <option value="" className="bg-white dark:bg-slate-900">
                  Any Hourly Rate
                </option>
                <option value="100" className="bg-white dark:bg-slate-900">
                  Under $100 / hr
                </option>
                <option value="150" className="bg-white dark:bg-slate-900">
                  Under $150 / hr
                </option>
                <option value="200" className="bg-white dark:bg-slate-900">
                  Under $200 / hr
                </option>
                <option value="300" className="bg-white dark:bg-slate-900">
                  Under $300 / hr
                </option>
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 px-3.5 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <SlidersHorizontal className="w-4 h-4 text-brand-500 shrink-0" />
              <label htmlFor="studio-sort" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Sort:
              </label>
              <select
                id="studio-sort"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="bg-transparent text-sm font-semibold text-slate-900 dark:text-white focus:outline-none cursor-pointer"
              >
                <option value="newest" className="bg-white dark:bg-slate-900">
                  Newest Listed
                </option>
                <option value="rating" className="bg-white dark:bg-slate-900">
                  Highest Rated
                </option>
                <option value="price-asc" className="bg-white dark:bg-slate-900">
                  Hourly Rate: Low to High
                </option>
                <option value="price-desc" className="bg-white dark:bg-slate-900">
                  Hourly Rate: High to Low
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {CATEGORY_TABS.map((tab) => {
            const active = selectedCategory === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => handleCategoryChange(tab.value)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                  active
                    ? "bg-brand-500 text-white shadow-md shadow-brand-500/25"
                    : "bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Count & Active Filter Summary */}
      <div className="flex items-center justify-between text-xs sm:text-sm text-slate-500 dark:text-slate-400">
        <span>
          Showing <strong className="text-slate-900 dark:text-white">{studios.length}</strong>{" "}
          {selectedCategory !== "All" ? `${selectedCategory} workspaces` : "verified production studios"}
        </span>
        {(selectedCategory !== "All" || searchQuery.trim() !== "" || sortOption !== "newest") && (
          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1.5 text-brand-500 hover:text-brand-600 font-semibold"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Filters
          </button>
        )}
      </div>

      {/* Studio Grid or Empty State */}
      {loading ? (
        <StudioGridSkeleton count={6} />
      ) : studios.length === 0 ? (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-12 text-center max-w-xl mx-auto space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/25 mx-auto flex items-center justify-center text-brand-500">
            <Clapperboard className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
              No Matching Studios Found
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              We couldn&apos;t find any creative workspaces matching your current search or category
              filter. Reset your filters to inspect all available stages.
            </p>
          </div>
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-6 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm inline-flex items-center gap-2 shadow-lg shadow-brand-500/25 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Filters</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {studios.map((studio) => (
            <StudioCard key={studio._id} studio={studio} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ExploreStudiosPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <StudioGridSkeleton count={6} />
        </div>
      }
    >
      <ExploreStudiosContent />
    </Suspense>
  );
}

