"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Aperture,
  User,
  Mail,
  Lock,
  Image as ImageIcon,
  Upload,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/providers/AuthProvider";
import { uploadImageToImgBB } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const { registerWithEmail, loginWithGoogle } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);

  // Strict Password Validation Rules
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasMinLength = /.{6,}/.test(password);
  const isPasswordValid = hasUppercase && hasLowercase && hasMinLength;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const url = await uploadImageToImgBB(file);
      setPhotoUrl(url);
      toast.success("Profile portrait uploaded!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to upload image.";
      toast.error(msg);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInlineError(null);

    if (!hasUppercase || !hasLowercase || !hasMinLength) {
      const errorMsg =
        "Password must contain at least one uppercase letter, one lowercase letter, and be at least 6 characters long.";
      setInlineError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    setSubmitting(true);
    try {
      await registerWithEmail({
        name,
        email,
        password,
        image:
          photoUrl.trim() ||
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
      });
      toast.success("Account registered! Please log in with your new credentials.");
      router.push("/login");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to register account.";
      setInlineError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleRegister = async () => {
    setGoogleLoading(true);
    try {
      await loginWithGoogle("/");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Google sign-in failed.";
      toast.error(msg);
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-[88vh] flex items-center justify-center px-4 py-14">
      <div className="max-w-lg w-full rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-7 sm:p-9 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-brand-500/25">
            <Aperture className="w-6 h-6" />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Create Your StudioSpace Account
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Book verified production stages or list your creative workspace.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Full Name / Producer Credit
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jordan Sterling (Director of Photography)"
                className="w-full pl-10 pr-4 py-3 rounded-xl text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {/* Email */}
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
                placeholder="jordan@sterlingcinema.io"
                className="w-full pl-10 pr-4 py-3 rounded-xl text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {/* Photo URL + ImgBB Upload */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Avatar Photo URL or Upload
              </label>
              <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-500 hover:text-brand-600 cursor-pointer">
                {uploadingImage ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                <span>{uploadingImage ? "Uploading..." : "Upload via ImgBB"}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
            <div className="relative">
              <ImageIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="https://images.unsplash.com/photo-1534528741775-53994a69daeb"
                className="w-full pl-10 pr-4 py-3 rounded-xl text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {/* Password with Live Inline Checklist */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (inlineError) setInlineError(null);
                }}
                placeholder="Create a strong password"
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

            {/* Inline Password Requirements Checklist */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-1.5 text-xs">
              <div
                className={`flex items-center gap-2 ${
                  hasUppercase
                    ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                {hasUppercase ? (
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 shrink-0" />
                )}
                <span>At least one uppercase letter (A–Z)</span>
              </div>
              <div
                className={`flex items-center gap-2 ${
                  hasLowercase
                    ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                {hasLowercase ? (
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 shrink-0" />
                )}
                <span>At least one lowercase letter (a–z)</span>
              </div>
              <div
                className={`flex items-center gap-2 ${
                  hasMinLength
                    ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                {hasMinLength ? (
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 shrink-0" />
                )}
                <span>Minimum 6 characters</span>
              </div>
            </div>

            {inlineError && (
              <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 pt-1">
                {inlineError}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-500/25 transition-all"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Register Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
          <span className="flex-shrink mx-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Or Register With
          </span>
          <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
        </div>

        {/* Social Registration: Continue with Google */}
        <button
          type="button"
          disabled={googleLoading}
          onClick={handleGoogleRegister}
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

        {/* Link to Login */}
        <p className="text-center text-sm text-slate-600 dark:text-slate-400">
          Already have a StudioSpace account?{" "}
          <Link href="/login" className="font-bold text-brand-500 hover:text-brand-600">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}

