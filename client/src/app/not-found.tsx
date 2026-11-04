import React from "react";
import Link from "next/link";
import { Clapperboard, ArrowLeft, Compass, Sparkles } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-xl w-full text-center space-y-6 p-8 sm:p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
        {/* Film Set Clapperboard Illustration */}
        <div className="relative mx-auto w-24 h-24 rounded-3xl bg-gradient-to-br from-brand-500/20 to-amber-500/10 border border-brand-500/30 flex items-center justify-center">
          <Clapperboard className="w-12 h-12 text-brand-500" />
          <span className="absolute -top-2 -right-2 px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-500 text-white shadow-md">
            TAKE 404
          </span>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-500 flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Scene Missing From Call Sheet
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            Cut! That Studio Set Doesn&apos;t Exist.
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed pt-1">
            The sound stage, cyclorama loft, or production route you requested has wrapped filming or
            moved to a new studio lot. Let&apos;s get your crew back on set.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm inline-flex items-center justify-center gap-2 shadow-lg shadow-brand-500/25 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Home</span>
          </Link>
          <Link
            href="/studios"
            className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/80 hover:border-brand-500/50 text-slate-800 dark:text-slate-200 font-semibold text-sm inline-flex items-center justify-center gap-2 transition-all"
          >
            <Compass className="w-4 h-4 text-brand-500" />
            <span>Browse Active Stages</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

