"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  PlusCircle,
  Upload,
  Image as ImageIcon,
  MapPin,
  DollarSign,
  Users,
  Shield,
  Check,
  Loader2,
  Sparkles,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { StudioCategory } from "@/types";
import { apiFetch, uploadImageToImgBB } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";
import { PrivateRoute } from "@/components/PrivateRoute";

const CATEGORIES: StudioCategory[] = [
  "Photo Studio",
  "Sound Stage",
  "Podcast Room",
  "Music Suite",
  "Art Workshop",
];

const PRESET_AMENITIES = [
  "3-Wall Cyclorama",
  "Green Screen",
  "3-Phase Power",
  "Soundproofed",
  "Acoustic Floating Floor",
  "Makeup Station",
  "High-Speed Fiber",
  "Neumann U87 Mic Array",
  "4K Blackmagic Broadcast Switcher",
  "ARRI SkyPanel S60-C Grid",
  "Profoto D2 Strobe Kit",
  "Freight Elevator",
];

export default function AddStudioPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<StudioCategory>("Photo Studio");
  const [hourlyRate, setHourlyRate] = useState("150");
  const [securityDeposit, setSecurityDeposit] = useState("250");
  const [maxCapacity, setMaxCapacity] = useState("20");
  const [location, setLocation] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([
    "3-Phase Power",
    "High-Speed Fiber",
    "Makeup Station",
  ]);
  const [overview, setOverview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const toggleAmenity = (item: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(item) ? prev.filter((a) => a !== item) : [...prev, item]
    );
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const uploadedUrl = await uploadImageToImgBB(file);
      setImageUrl(uploadedUrl);
      toast.success("Studio cover photo uploaded!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Image upload failed.";
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !location.trim() || !imageUrl.trim() || !overview.trim()) {
      toast.error("Please complete all required studio fields and provide a studio image.");
      return;
    }

    setSubmitting(true);
    try {
      await apiFetch("/api/studios", {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          category,
          hourlyRate: Number(hourlyRate),
          securityDeposit: Number(securityDeposit),
          maxCapacity: Number(maxCapacity),
          location: location.trim(),
          imageUrl: imageUrl.trim(),
          gallery: [imageUrl.trim()],
          amenities: selectedAmenities,
          overview: overview.trim(),
          ownerName: user?.name,
          ownerPhoto: user?.image,
        }),
      });

      toast.success("Studio workspace published to StudioSpace!");
      router.push("/my-listings");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to publish studio listing.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PrivateRoute>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        {/* Page Header */}
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-brand-500">
            <Sparkles className="w-3.5 h-3.5" /> Host Production Portal
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            List a New Creative Studio Space
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
            Share your cyclorama loft, sound stage, podcast suite, or recording room with verified
            creators.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-6 sm:p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6"
        >
          {/* Title & Category */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Studio / Stage Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Horizon 3-Wall Cyclorama & Daylight Stage"
                className="w-full px-4 py-3 rounded-xl text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Studio Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as StudioCategory)}
                className="w-full px-4 py-3 rounded-xl text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Hourly Rate, Security Deposit, Max Capacity */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Hourly Rate ($ USD) *
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-brand-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  min="15"
                  required
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  className="w-full pl-9 pr-4 py-3 rounded-xl text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Security Deposit ($ USD) *
              </label>
              <div className="relative">
                <Shield className="w-4 h-4 text-brand-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  min="0"
                  required
                  value={securityDeposit}
                  onChange={(e) => setSecurityDeposit(e.target.value)}
                  className="w-full pl-9 pr-4 py-3 rounded-xl text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Max Crew Capacity *
              </label>
              <div className="relative">
                <Users className="w-4 h-4 text-brand-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  min="1"
                  required
                  value={maxCapacity}
                  onChange={(e) => setMaxCapacity(e.target.value)}
                  className="w-full pl-9 pr-4 py-3 rounded-xl text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>
          </div>

          {/* Location & Image Upload / URL */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Studio Location / District *
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-brand-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Tribeca, New York, NY"
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Studio Image (ImgBB or Direct URL) *
                </label>
                <label className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-500 hover:text-brand-600 cursor-pointer">
                  {uploading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                  <span>{uploading ? "Uploading..." : "Upload File (ImgBB)"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>
              <div className="relative">
                <ImageIcon className="w-4 h-4 text-brand-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-1598488035139-bdbb2231ce04"
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>
          </div>

          {/* Amenities Multi-Select Checkboxes/Tags */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              On-Site Production Amenities &amp; Gear (Select All That Apply)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {PRESET_AMENITIES.map((amenity) => {
                const checked = selectedAmenities.includes(amenity);
                return (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() => toggleAmenity(amenity)}
                    className={`px-3 py-2.5 rounded-xl text-xs font-semibold border flex items-center gap-2 text-left transition-all ${
                      checked
                        ? "bg-brand-500/15 border-brand-500 text-brand-600 dark:text-brand-400"
                        : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${
                        checked
                          ? "bg-brand-500 text-white"
                          : "border border-slate-300 dark:border-slate-700"
                      }`}
                    >
                      {checked && <Check className="w-3 h-3" />}
                    </div>
                    <span className="truncate">{amenity}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detailed Overview */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Technical Specification &amp; Stage Overview *
            </label>
            <textarea
              rows={4}
              required
              value={overview}
              onChange={(e) => setOverview(e.target.value)}
              placeholder="Describe cyclorama dimensions, ceiling grid clearance, power amperage, acoustic isolation rating, and included grip/lighting packages..."
              className="w-full p-4 rounded-xl text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          {/* Read-Only Host Name & Host Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                <Lock className="w-3.5 h-3.5" /> Host Name (Read-Only)
              </label>
              <input
                type="text"
                readOnly
                value={user?.name || ""}
                className="w-full px-4 py-3 rounded-xl text-sm bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed"
              />
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                <Lock className="w-3.5 h-3.5" /> Host Email (Read-Only)
              </label>
              <input
                type="email"
                readOnly
                value={user?.email || ""}
                className="w-full px-4 py-3 rounded-xl text-sm bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 px-6 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-semibold text-base flex items-center justify-center gap-2 shadow-lg shadow-brand-500/25 transition-all"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Publishing Studio Workspace...</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-5 h-5" />
                  <span>Publish Studio Listing</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </PrivateRoute>
  );
}

