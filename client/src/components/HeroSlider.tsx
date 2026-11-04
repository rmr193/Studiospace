"use client";

import React from "react";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation, EffectFade } from "swiper/modules";
import { ArrowRight, Sparkles, ShieldCheck, CheckCircle2, Radio } from "lucide-react";

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import "swiper/css/effect-fade";

const HERO_SLIDES = [
  {
    id: "cyc-stage",
    badge: "3-Wall Cyclorama & Daylight Lofts",
    headline: "Book Cinema-Grade Cyclorama Stages on Demand.",
    subtext:
      "Reserve pre-lit 3-wall infinity coves, ARRI SkyPanel lighting grids, and 400A 3-phase power stages by the hour. Instant call-sheet confirmation with zero broker fees.",
    image:
      "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1920&q=85",
    specs: ["28ft × 24ft Infinity Cove", "Profoto Pro-11 Strobe Pack", "16ft Grid Clearance"],
  },
  {
    id: "sound-stage",
    badge: "NC-20 Acoustically Rated Sound Stages",
    headline: "Virtual Production & LED Volume Stages Ready to Roll.",
    subtext:
      "From commercial automotive shoots with drive-in elephant doors to Unreal Engine XR stages with overhead motion-capture trusses and dedicated DIT fiber suites.",
    image:
      "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&w=1920&q=85",
    specs: ["NC-20 Sound Isolation", "12× ARRI SkyPanel S60-C", "400A Cam-Lok Tie-In"],
  },
  {
    id: "analog-audio",
    badge: "SSL Mastering & 4K Broadcast Suites",
    headline: "Track on SSL Consoles & Record Multi-Cam 4K Podcasts.",
    subtext:
      "Step into acoustically floated tracking rooms stocked with vintage Neumann U87 microphone arrays, ATC monitors, and turnkey Sony FX3 + Blackmagic ATEM broadcast rigs.",
    image:
      "https://images.unsplash.com/photo-1598653222000-6b7b7a552625?auto=format&fit=crop&w=1920&q=85",
    specs: ["SSL Origin 32-Ch Console", "Neumann U87 Ai Locker", "Decoupled Floating Floor"],
  },
];

export function HeroSlider() {
  return (
    <section className="relative w-full overflow-hidden bg-slate-950">
      <Swiper
        modules={[Autoplay, Pagination, Navigation, EffectFade]}
        effect="fade"
        loop={true}
        speed={800}
        autoplay={{
          delay: 5500,
          disableOnInteraction: false,
        }}
        pagination={{
          clickable: true,
        }}
        className="w-full h-[600px] sm:h-[660px] lg:h-[700px]"
      >
        {HERO_SLIDES.map((slide) => (
          <SwiperSlide key={slide.id}>
            <div className="relative w-full h-full flex items-center">
              {/* Background Image */}
              <img
                src={slide.image}
                alt={slide.headline}
                className="absolute inset-0 w-full h-full object-cover object-center scale-105 transition-transform duration-1000"
              />
              {/* Multi-layer Dark Cinema Overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-slate-950/40" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/40" />

              {/* Content Container */}
              <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-12">
                <div className="max-w-3xl space-y-6">
                  {/* Top Pill Badge */}
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/15 border border-brand-500/35 text-brand-400 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                    <Radio className="w-3.5 h-3.5 animate-pulse" />
                    <span>{slide.badge}</span>
                  </div>

                  {/* Main Headline */}
                  <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.1]">
                    {slide.headline}
                  </h1>

                  {/* Subtext */}
                  <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
                    {slide.subtext}
                  </p>

                  {/* Spec Chips */}
                  <div className="flex flex-wrap items-center gap-2.5 pt-1">
                    {slide.specs.map((spec) => (
                      <span
                        key={spec}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-slate-100"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-brand-400" />
                        {spec}
                      </span>
                    ))}
                  </div>

                  {/* Primary & Secondary CTAs */}
                  <div className="flex flex-wrap items-center gap-4 pt-3">
                    <Link
                      href="/studios"
                      className="px-6 py-3.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm sm:text-base inline-flex items-center gap-2.5 shadow-lg shadow-brand-500/30 transition-all"
                    >
                      <span>Explore Studios</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                      href="/add-studio"
                      className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md font-semibold text-sm sm:text-base inline-flex items-center gap-2 transition-all"
                    >
                      <Sparkles className="w-4 h-4 text-brand-400" />
                      <span>Host Your Space</span>
                    </Link>
                  </div>

                  {/* Trust Indicator */}
                  <div className="flex items-center gap-6 pt-2 text-xs text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      $1M Property & Gear Protection Included
                    </span>
                    <span className="hidden sm:inline-block">•</span>
                    <span className="hidden sm:inline-block">
                      Real-Time Slot Overlap Prevention
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}

