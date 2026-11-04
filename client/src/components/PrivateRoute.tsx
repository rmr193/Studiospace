"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { Aperture } from "lucide-react";

export function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      const target = pathname ? `/login?redirect=${encodeURIComponent(pathname)}` : "/login";
      router.replace(target);
    }
  }, [user, loading, router, pathname]);

  if (loading) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center px-4">
        <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/30 mb-4">
          <Aperture className="w-8 h-8 text-brand-500 animate-spin" />
        </div>
        <p className="font-display text-lg font-semibold text-slate-900 dark:text-white">
          Verifying Studio Credentials...
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Syncing encrypted HTTPOnly session token
        </p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}

