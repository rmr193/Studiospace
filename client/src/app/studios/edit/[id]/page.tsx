"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Save,
  Upload,
  Image as ImageIcon,
  MapPin,
  DollarSign,
  Users,
  Shield,
  Check,
  Loader2,
  ArrowLeft,
  Lock,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Studio, StudioCategory } from "@/types";
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

export default function EditStudioPage() {
  const params = useParams();
  const router = useRouter();
  const studioId = String(params?.id || "");
  const { user } = useAuth();

  const [loadingStudio, setLoadingStudio] = useState(true);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<StudioCategory>("Photo Studio");
  const [hourlyRate, setHourlyRate] = useState("");
  const [securityDeposit, setSecurityDeposit] = useState("");
  const [maxCapacity, setMaxCapacity] = useState("");
  const [location, setLocation] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [overview, setOverview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await apiFetch<Studio>(`/api/studios/${studioId}`);
        if (active && data) {
          setTitle(data.title);
          setCategory(data.category);
          setHourlyRate(String(data.hourlyRate));
          setSecurityDeposit(String(data.securityDeposit));
          setMaxCapacity(String(data.maxCapacity));
          setLocation(data.location);
          setImageUrl(data.imageUrl);
          setSelectedAmenities(Array.isArray(data.amenities) ? data.amenities : []);
          setOverview(data.overview);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to load studio details.";
        toast.error(msg);
      } finally {
        if (active) setLoadingStudio(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [studioId]);

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
      toast.success("Updated studio image uploaded!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Image upload failed.";
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiFetch(`/api/studios/${studioId}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: title.trim(),
          category,
          hourlyRate: Number(hourlyRate),
          securityDeposit: Number(securityDeposit),
          maxCapacity: Number(maxCapacity),
          location: location.trim(),
          imageUrl: imageUrl.trim(),
          amenities: selectedAmenities,
          overview: overview.trim(),
        }),
      });

      toast.success("Studio specifications updated successfully!");
      router.push("/my-listings");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update studio listing.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PrivateRoute>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-brand-500">
              <Sparkles className="w-3.5 h-3.5" /> Host Stage Management
            </span>
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              Update Studio Workspace
            </h1>
          </div>
          <Link
            href="/my-listings"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:border-brand-500"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to My Listings</span>
          </Link>
        </div>

        {loadingStudio ? (
          <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="p-6 sm:p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6"
          >
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Studio Location *
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-brand-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Studio Image URL or Upload *
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
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                On-Site Production Amenities &amp; Gear
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {Array.from(new Set([...PRESET_AMENITIES, ...selectedAmenities])).map((amenity) => {
                  const checked = selectedAmenities.includes(amenity);
                  return (
                    <button
                      key={amenity}
                      type="button"
                      onClick={() => toggleAmenity(amenity)}
                      className={`px-3 py-2.5 rounded-xl text-xs font-semibold border flex items-center gap-2 text-left transition-all ${
                        checked
                          ? "bg-brand-500/15 border-brand-500 text-brand-600 dark:text-brand-400"
                          : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
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

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Technical Specification &amp; Stage Overview *
              </label>
              <textarea
                rows={4}
                required
                value={overview}
                onChange={(e) => setOverview(e.target.value)}
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
                    <span>Saving Studio Updates...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>Save Studio Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </PrivateRoute>
  );
}

