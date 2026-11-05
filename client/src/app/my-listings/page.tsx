"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  PlusCircle,
  Edit3,
  Trash2,
  MapPin,
  Star,
  Users,
  Eye,
  AlertTriangle,
  Loader2,
  Sparkles,
  LayoutGrid,
} from "lucide-react";
import { toast } from "sonner";
import { Studio } from "@/types";
import { apiFetch } from "@/lib/api";
import { PrivateRoute } from "@/components/PrivateRoute";
import { StudioGridSkeleton } from "@/components/StudioCard";

export default function MyListingsPage() {
  const [listings, setListings] = useState<Studio[]>([]);
  const [loading, setLoading] = useState(true);
  const [studioToDelete, setStudioToDelete] = useState<Studio | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await apiFetch<Studio[]>("/api/my-listings");
        if (active) setListings(data);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to load your studio listings.";
        toast.error(msg);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Accessibility: close delete modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && studioToDelete) {
        setStudioToDelete(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [studioToDelete]);

  const handleConfirmDelete = async () => {
    if (!studioToDelete) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/studios/${studioToDelete._id}`, {
        method: "DELETE",
      });
      setListings((prev) => prev.filter((item) => item._id !== studioToDelete._id));
      toast.success(`Deleted "${studioToDelete.title}" from your studio listings.`);
      setStudioToDelete(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete studio.";
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <PrivateRoute>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-brand-500">
              <Sparkles className="w-3.5 h-3.5" /> Host Stage Inventory
            </span>
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              My Studio Listings ({listings.length})
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
              Manage your published creative workspaces, hourly rates, and technical specifications.
            </p>
          </div>
          <Link
            href="/add-studio"
            className="px-5 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm inline-flex items-center gap-2 shadow-lg shadow-brand-500/25 transition-all self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add New Studio</span>
          </Link>
        </div>

        {loading ? (
          <StudioGridSkeleton count={3} />
        ) : listings.length === 0 ? (
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-12 text-center max-w-xl mx-auto space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/25 mx-auto flex items-center justify-center text-brand-500">
              <LayoutGrid className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
                You Haven&apos;t Listed a Studio Yet
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Publish your photo studio, sound stage, podcast room, or recording suite to start
                receiving hourly bookings.
              </p>
            </div>
            <Link
              href="/add-studio"
              className="px-6 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm inline-flex items-center gap-2 shadow-lg shadow-brand-500/25"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create First Studio Listing</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-4 px-6">Studio Workspace</th>
                    <th className="py-4 px-4">Category</th>
                    <th className="py-4 px-4">Hourly Rate</th>
                    <th className="py-4 px-4">Deposit</th>
                    <th className="py-4 px-4">Capacity</th>
                    <th className="py-4 px-4">Rating</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800/70 text-sm">
                  {listings.map((studio) => (
                    <tr
                      key={studio._id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-4">
                          <img
                            src={studio.imageUrl}
                            alt={studio.title}
                            className="w-20 aspect-[16/10] rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                          />
                          <div>
                            <Link
                              href={`/studios/${studio._id}`}
                              className="font-display font-bold text-slate-900 dark:text-white hover:text-brand-500 transition-colors line-clamp-1"
                            >
                              {studio.title}
                            </Link>
                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-brand-500" /> {studio.location}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-brand-500/15 text-brand-600 dark:text-brand-400">
                          {studio.category}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-display font-bold text-slate-900 dark:text-white">
                        ${studio.hourlyRate}/hr
                      </td>
                      <td className="py-4 px-4 text-slate-600 dark:text-slate-400">
                        ${studio.securityDeposit}
                      </td>
                      <td className="py-4 px-4 text-slate-600 dark:text-slate-400">
                        <span className="inline-flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-slate-400" /> {studio.maxCapacity}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-1 font-bold text-amber-500">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          {Number(studio.rating || 4.8).toFixed(1)}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="inline-flex items-center justify-end gap-2">
                          <Link
                            href={`/studios/${studio._id}`}
                            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-brand-500 hover:text-brand-500 transition-colors"
                            title="View Public Listing"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/studios/edit/${studio._id}`}
                            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-brand-500 dark:bg-slate-800 dark:hover:bg-brand-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" /> Update
                          </Link>
                          <button
                            type="button"
                            onClick={() => setStudioToDelete(studio)}
                            className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-600 dark:text-rose-400 hover:text-white border border-rose-500/25 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile & Tablet Card View */}
            <div className="lg:hidden divide-y divide-slate-200 dark:divide-slate-800">
              {listings.map((studio) => (
                <div key={studio._id} className="p-5 space-y-4">
                  <div className="flex items-start gap-4">
                    <img
                      src={studio.imageUrl}
                      alt={studio.title}
                      className="w-28 aspect-[16/10] rounded-xl object-cover shrink-0"
                    />
                    <div className="space-y-1 flex-1">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-brand-500/15 text-brand-500">
                        {studio.category}
                      </span>
                      <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
                        {studio.title}
                      </h3>
                      <p className="text-xs text-slate-500">{studio.location}</p>
                      <p className="font-display text-sm font-bold text-brand-500">
                        ${studio.hourlyRate}/hr · Deposit ${studio.securityDeposit}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2.5">
                    <Link
                      href={`/studios/${studio._id}`}
                      className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300"
                    >
                      View
                    </Link>
                    <Link
                      href={`/studios/edit/${studio._id}`}
                      className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Update
                    </Link>
                    <button
                      type="button"
                      onClick={() => setStudioToDelete(studio)}
                      className="px-4 py-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-semibold inline-flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Custom Delete Confirmation Modal (Zero Native Alerts) */}
        {studioToDelete && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm"
          >
            <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-5">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-500 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div className="space-y-2">
                <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
                  Delete Studio Workspace?
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Are you sure you want to permanently remove{" "}
                  <strong className="text-slate-900 dark:text-white">{studioToDelete.title}</strong>{" "}
                  from StudioSpace? This action cannot be undone.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => setStudioToDelete(null)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Keep Listing
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={handleConfirmDelete}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold inline-flex items-center gap-2 shadow-lg shadow-rose-600/25"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Confirm Delete</span>
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

