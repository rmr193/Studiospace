"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Aperture,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/providers/AuthProvider";

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/";
  const { loginWithEmail, loginWithGoogle } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleForgotPassword = () => {
    toast.info("Please contact StudioSpace Production Support to reset your account password.");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error("Please enter both your email address and password.");
      return;
    }

    setSubmitting(true);
    try {
      const user = await loginWithEmail(email, password);
      toast.success(`Welcome back to StudioSpace, ${user.name}!`);
      router.push(redirectPath);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to sign in. Please verify your credentials.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await loginWithGoogle(redirectPath);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Google authentication failed.";
      toast.error(msg);
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-14">
      <div className="max-w-md w-full rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-7 sm:p-9 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-brand-500/25">
            <Aperture className="w-6 h-6" />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Sign In to StudioSpace
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Access your production call sheets, studio listings, and bookings.
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Production Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="producer@productionhouse.io"
                className="w-full pl-10 pr-4 py-3 rounded-xl text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Password
              </label>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-xs font-semibold text-brand-500 hover:text-brand-600 transition-colors"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-10 py-3 rounded-xl text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label="Toggle password visibility"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-500/25 transition-all"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <span>Login to StudioSpace</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
          <span className="flex-shrink mx-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Or Continue With
          </span>
          <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
        </div>

        {/* Social Login: Continue with Google */}
        <button
          type="button"
          disabled={googleLoading}
          onClick={handleGoogleSignIn}
          className="w-full py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:border-brand-500/50 text-slate-800 dark:text-slate-100 font-semibold text-sm flex items-center justify-center gap-3 transition-all"
        >
          {googleLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-brand-500" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5c1.617 0 3.082.593 4.219 1.664l3.152-3.152C17.457 1.727 14.965.75 12 .75 7.602.75 3.801 3.27 1.945 6.953l3.672 2.848C6.492 7.195 9.02 5 12 5z"
              />
              <path
                fill="#4285F4"
                d="M23.04 12.261c0-.815-.073-1.598-.209-2.348H12v4.442h6.189c-.267 1.438-1.078 2.656-2.297 3.472l3.562 2.763c2.082-1.92 3.586-4.746 3.586-8.329z"
              />
              <path
                fill="#FBBC05"
                d="M5.617 14.2c-.23-.69-.36-1.43-.36-2.2s.13-1.51.36-2.2L1.945 6.953C1.185 8.469.75 10.184.75 12s.435 3.531 1.195 5.047L5.617 14.2z"
              />
              <path
                fill="#34A853"
                d="M12 23.25c3.038 0 5.588-1.005 7.451-2.723l-3.562-2.763c-.995.668-2.269 1.063-3.889 1.063-2.98 0-5.508-2.195-6.383-4.801L1.945 16.874C3.801 20.557 7.602 23.25 12 23.25z"
              />
            </svg>
          )}
          <span>Continue with Google</span>
        </button>

        {/* Link to Register */}
        <p className="text-center text-sm text-slate-600 dark:text-slate-400">
          New to StudioSpace?{" "}
          <Link href="/register" className="font-bold text-brand-500 hover:text-brand-600">
            Create Creator / Host Account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh]" />}>
      <LoginFormContent />
    </Suspense>
  );
}
