"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Aperture, Send, ShieldCheck, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";

export function Footer() {
  const [newsletterEmail, setNewsletterEmail] = useState("");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim() || !newsletterEmail.includes("@")) {
      toast.error("Please enter a valid production email address.");
      return;
    }
    toast.success(`Subscribed ${newsletterEmail.trim()} to StudioSpace Call Sheet Dispatch!`);
    setNewsletterEmail("");
  };

  return (
    <footer className="bg-slate-50 dark:bg-slate-950 border-t border-slate-200/80 dark:border-slate-800/80 text-slate-600 dark:text-slate-400 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10">
          {/* Column 1: Brand & Mission */}
          <div className="lg:col-span-4 space-y-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-brand-500/25">
                <Aperture className="w-5 h-5" />
              </div>
              <span className="font-display text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Studio<span className="text-brand-500">Space</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              The premier peer-to-peer creative production marketplace connecting commercial directors,
              photographers, audio engineers, and artists with verified cyclorama lofts, cinema sound
              stages, and analog recording suites.
            </p>
            <div className="flex items-center gap-4 pt-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-brand-500" /> $1M Gear & Stage Guarantee
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-brand-500" /> NYC · LA · Nashville · Austin
              </span>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Platform
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/" className="hover:text-brand-500 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/studios" className="hover:text-brand-500 transition-colors">
                  Explore Studios
                </Link>
              </li>
              <li>
                <Link href="/add-studio" className="hover:text-brand-500 transition-colors">
                  Host Your Space
                </Link>
              </li>
              <li>
                <Link href="/my-bookings" className="hover:text-brand-500 transition-colors">
                  My Bookings
                </Link>
              </li>
              <li>
                <Link href="/wishlist" className="hover:text-brand-500 transition-colors">
                  Saved Wishlist
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Studio Categories */}
          <div className="lg:col-span-3 space-y-3">
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Studio Categories
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  href="/studios?category=Photo%20Studio"
                  className="hover:text-brand-500 transition-colors"
                >
                  Photo Studios & Cyc Lofts
                </Link>
              </li>
              <li>
                <Link
                  href="/studios?category=Sound%20Stage"
                  className="hover:text-brand-500 transition-colors"
                >
                  Cinema Sound Stages
                </Link>
              </li>
              <li>
                <Link
                  href="/studios?category=Podcast%20Room"
                  className="hover:text-brand-500 transition-colors"
                >
                  4K Broadcast & Podcast Lounges
                </Link>
              </li>
              <li>
                <Link
                  href="/studios?category=Music%20Suite"
                  className="hover:text-brand-500 transition-colors"
                >
                  SSL & Atmos Recording Suites
                </Link>
              </li>
              <li>
                <Link
                  href="/studios?category=Art%20Workshop"
                  className="hover:text-brand-500 transition-colors"
                >
                  Scenic & Sculpture Workshops
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Newsletter */}
          <div className="lg:col-span-3 space-y-3">
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Call Sheet Dispatch
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Receive weekly drops of newly verified cinema stages, lighting packages, and off-peak studio
              rates.
            </p>
            <form onSubmit={handleSubscribe} className="space-y-2.5">
              <div className="flex items-center gap-2">
                <input
                  type="email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="producer@productionhouse.io"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                />
                <button
                  type="submit"
                  aria-label="Subscribe to newsletter"
                  className="px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm flex items-center justify-center shrink-0 transition-colors shadow-md shadow-brand-500/20"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
            <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
              <Phone className="w-3.5 h-3.5 text-brand-500" />
              <span>24/7 Stage Desk: +1 (800) 555-STAGE</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar with New X Logo SVG */}
        <div className="mt-12 pt-8 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            © {new Date().getFullYear()} StudioSpace Production Marketplace Inc. All rights reserved.
          </p>

          <div className="flex items-center gap-3">
            {/* Official New X Logo (NOT Twitter Bird) */}
            <a
              href="https://x.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Follow StudioSpace on X"
              className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center text-slate-700 dark:text-slate-300 hover:border-brand-500 hover:text-brand-500 transition-colors"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>

            {/* Instagram SVG */}
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Follow StudioSpace on Instagram"
              className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center text-slate-700 dark:text-slate-300 hover:border-brand-500 hover:text-brand-500 transition-colors"
            >
              <svg className="w-4 h-4 fill-none stroke-current" strokeWidth="2" viewBox="0 0 24 24">
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
              </svg>
            </a>

            {/* Vimeo / Film Reel SVG */}
            <a
              href="https://vimeo.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Watch StudioSpace Reels on Vimeo"
              className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center text-slate-700 dark:text-slate-300 hover:border-brand-500 hover:text-brand-500 transition-colors"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M22.396 7.164c-.093 2.026-1.507 4.799-4.245 8.32C15.323 19.16 12.928 21 10.97 21c-1.214 0-2.24-1.119-3.079-3.359l-1.68-6.159c-.623-2.239-1.29-3.36-2.005-3.36-.156 0-.701.328-1.634.981L1.6 7.847c1.027-.902 2.04-1.805 3.037-2.708C6.001 3.953 7.03 3.329 7.715 3.265c1.619-.156 2.616.951 2.99 3.321.404 2.557.685 4.147.841 4.769.467 2.121.981 3.181 1.542 3.181.435 0 1.09-.688 1.963-2.065.871-1.376 1.338-2.422 1.401-3.142.125-1.187-.343-1.782-1.401-1.782-.498 0-1.013.115-1.541.341 1.023-3.35 2.977-4.977 5.862-4.884 2.139.063 3.149 1.45 3.024 4.16z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

