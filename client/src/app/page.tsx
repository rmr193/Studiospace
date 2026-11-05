"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Camera,
  Film,
  Mic,
  Music,
  Palette,
  ArrowRight,
  Search,
  Clock,
  Zap,
  Clapperboard,
  ShieldCheck,
  UserCheck,
  Wrench,
  Headphones,
  Sparkles,
} from "lucide-react";
import { Studio } from "@/types";
import { apiFetch } from "@/lib/api";
import { HeroSlider } from "@/components/HeroSlider";
import { StudioCard, StudioGridSkeleton } from "@/components/StudioCard";

const STUDIO_CATEGORIES = [
  {
    name: "Photo Studios",
    queryValue: "Photo Studio",
    description: "3-wall cyclorama lofts, Profoto strobe packs & south-facing daylight bays.",
    icon: Camera,
    count: "140+ Verified Spaces",
    accent: "from-amber-500/20 to-orange-500/5",
  },
  {
    name: "Sound Stages",
    queryValue: "Sound Stage",
    description: "NC-20 rated acoustic stages, LED volumes, ARRI SkyPanel grids & 400A power.",
    icon: Film,
    count: "85+ Cinema Stages",
    accent: "from-brand-500/20 to-rose-500/5",
  },
  {
    name: "Podcast Rooms",
    queryValue: "Podcast Room",
    description: "Turnkey Shure SM7B arrays, Sony FX3 3-camera rigs & Blackmagic 4K switchers.",
    icon: Mic,
    count: "110+ Broadcast Suites",
    accent: "from-sky-500/20 to-indigo-500/5",
  },
  {
    name: "Music Suites",
    queryValue: "Music Suite",
    description: "SSL analog consoles, decoupled floating floors, Neumann lockers & Atmos stages.",
    icon: Music,
    count: "95+ Recording Rooms",
    accent: "from-emerald-500/20 to-teal-500/5",
  },
  {
    name: "Art Workshops",
    queryValue: "Art Workshop",
    description: "North-light sculpture lofts, scenic fabrication benches & HEPA spray booths.",
    icon: Palette,
    count: "60+ Industrial Labs",
    accent: "from-purple-500/20 to-fuchsia-500/5",
  },
];

const WORKFLOW_STEPS = [
  {
    step: "01",
    title: "1. Discover Spaces",
    description:
      "Filter verified creative spaces by power capacity, acoustic rating, cyclorama dimensions, or onboard lighting & audio gear.",
    icon: Search,
  },
  {
    step: "02",
    title: "2. Select Shoot Hours",
    description:
      "Inspect real-time call-sheet availability and choose your exact load-in and wrap hours with transparent hourly & deposit pricing.",
    icon: Clock,
  },
  {
    step: "03",
    title: "3. Book Instantly",
    description:
      "Our collision-free scheduling engine locks your time slot immediately and generates an itemized PDF production invoice.",
    icon: Zap,
  },
  {
    step: "04",
    title: "4. Create & Produce",
    description:
      "Arrive on set with pre-patched equipment, stage manager check-in, high-speed fiber uplink, and $1M production coverage.",
    icon: Clapperboard,
  },
];

const GUARANTEE_PILLARS = [
  {
    title: "$1M Property & Gear Protection",
    description:
      "Every reservation includes comprehensive $1,000,000 primary liability and in-house strobe, lens, and console coverage for peace of mind on set.",
    icon: ShieldCheck,
    stat: "$1,000,000 Coverage",
  },
  {
    title: "Verified Creator Profiles",
    description:
      "All production companies, independent photographers, and studio hosts undergo identity and gear inventory verification before booking.",
    icon: UserCheck,
    stat: "100% Vetted Community",
  },
  {
    title: "On-Site Equipment Safety",
    description:
      "Pre-shoot stage inspections verify 3-phase Cam-Lok tie-ins, overhead truss rigging certifications, and calibrated studio monitor arrays.",
    icon: Wrench,
    stat: "SMPTE & OSHA Aligned",
  },
  {
    title: "24/7 Production Support",
    description:
      "Overnight shoot or early call time? Our dedicated Production Desk assists with overtime extensions, freight access, and backup gear dispatch.",
    icon: Headphones,
    stat: "< 5 Min Response Time",
  },
];

export default function HomePage() {
  const [featuredStudios, setFeaturedStudios] = useState<Studio[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await apiFetch<Studio[]>("/api/studios/featured");
        if (active) setFeaturedStudios(data);
      } catch (err) {
        console.error("Error loading featured studios:", err);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash) {
      const targetId = window.location.hash.replace("#", "");
      const el = document.getElementById(targetId);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth" });
        }, 200);
      }
    }
  }, []);

  return (
    <div className="space-y-24 pb-24">
      {/* 1. Hero Slider */}
      <HeroSlider />

      {/* 2. Featured Studios Section (Dynamic 6 Cards) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-brand-500">
              <Sparkles className="w-3.5 h-3.5" /> Curated Production Sets
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              Featured Production Studios
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl">
              Top-rated sound stages, cyclorama lofts, and analog recording rooms trusted by commercial
              directors and executive producers.
            </p>
          </div>
          <Link
            href="/studios"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-brand-500 dark:bg-slate-800 dark:hover:bg-brand-500 text-white text-sm font-semibold transition-colors shrink-0 self-start md:self-auto"
          >
            <span>View All Studios</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <StudioGridSkeleton count={6} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredStudios.map((studio) => (
              <StudioCard key={studio._id} studio={studio} />
            ))}
          </div>
        )}
      </section>

      {/* 3. Browse by Studio Categories (5 Interactive Category Cards) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-brand-500">
            Purpose-Built Environments
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            Browse by Studio Category
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
            Select a specialized creative environment to filter spaces engineered for your exact medium.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {STUDIO_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.name}
                href={`/studios?category=${encodeURIComponent(cat.queryValue)}`}
                className="group h-full flex flex-col justify-between p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-brand-500 dark:hover:border-brand-500 shadow-sm hover:shadow-xl transition-all duration-300"
              >
                <div className="space-y-4">
                  <div
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${cat.accent} border border-brand-500/20 flex items-center justify-center text-brand-500 group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-brand-500 transition-colors">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                      {cat.description}
                    </p>
                  </div>
                </div>

                <div className="pt-5 mt-5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-brand-500">
                  <span>{cat.count}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 4. Extra Section 1 — How Booking Works */}
      <section
        id="how-it-works"
        className="scroll-mt-24 py-20 bg-slate-900 text-white border-y border-slate-800 relative overflow-hidden"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-brand-400">
              Streamlined Production Workflow
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white">
              How StudioSpace Booking Works
            </h2>
            <p className="text-sm sm:text-base text-slate-300">
              From scouting technical specifications to final wrap—lock in your production stage in four
              seamless steps.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {WORKFLOW_STEPS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.step}
                  className="h-full flex flex-col justify-between p-6 rounded-2xl bg-slate-950/75 border border-slate-800 hover:border-brand-500/50 transition-all"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-brand-500/15 border border-brand-500/30 flex items-center justify-center text-brand-400">
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="font-display text-2xl font-bold text-slate-700">
                        {item.step}
                      </span>
                    </div>
                    <h3 className="font-display text-lg font-bold tracking-tight text-white">
                      {item.title}
                    </h3>
                    <p className="text-sm text-slate-400 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. Extra Section 2 — Host Guarantee & Creator Support */}
      <section id="about" className="scroll-mt-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
          <div className="space-y-2 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-brand-500">
              Enterprise Production Standards
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              Host Guarantee &amp; Creator Support
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
              Every studio booking on StudioSpace is backed by institutional-grade equipment protection,
              verified crew credentials, and round-the-clock stage support.
            </p>
          </div>
          <Link
            href="/add-studio"
            className="px-6 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm inline-flex items-center gap-2 shadow-lg shadow-brand-500/25 transition-all self-start lg:self-auto"
          >
            <span>List Your Studio Today</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {GUARANTEE_PILLARS.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.title}
                className="h-full flex flex-col justify-between p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-brand-500/40 transition-all"
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/25 flex items-center justify-center text-brand-500">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                    {pillar.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
                <div className="pt-4 mt-6 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                    {pillar.stat}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

