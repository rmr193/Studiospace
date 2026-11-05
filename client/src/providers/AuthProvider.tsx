"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { toast } from "sonner";
import { User } from "@/types";
import { authClient } from "@/lib/auth-client";
import { apiFetch } from "@/lib/api";

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  image?: string;
}

interface GoogleAccountProfile {
  name: string;
  email: string;
  image: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithEmail: (email: string, password: string) => Promise<User>;
  registerWithEmail: (input: RegisterInput) => Promise<void>;
  loginWithGoogle: (account?: GoogleAccountProfile) => Promise<User>;
  logout: () => Promise<void>;
  toggleWishlist: (studioId: string) => Promise<boolean>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const syncJwtSession = useCallback(
    async (payload: { email: string; name?: string; image?: string; role?: string }) => {
      const res = await apiFetch<{ success: boolean; token?: string; user: User }>("/api/auth/jwt", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setUser(res.user);
      if (res.token) {
        localStorage.setItem("studiospace_jwt_token", res.token);
      }
      localStorage.setItem("studiospace_user_cache", JSON.stringify(res.user));
      return res.user;
    },
    []
  );

  const refreshUser = useCallback(async () => {
    try {
      // 1. Check existing HTTPOnly JWT cookie session first
      const meRes = await apiFetch<{ user: User }>("/api/auth/me", {
        method: "GET",
      });
      if (meRes?.user) {
        setUser(meRes.user);
        localStorage.setItem("studiospace_user_cache", JSON.stringify(meRes.user));
        return;
      }
    } catch {
      // Cookie not present or expired; check BetterAuth session or cached user
    }

    try {
      const { data: sessionData } = await authClient.getSession();
      if (sessionData?.user?.email) {
        await syncJwtSession({
          email: sessionData.user.email,
          name: sessionData.user.name,
          image: sessionData.user.image || undefined,
        });
        return;
      }
    } catch {
      // No active BetterAuth session
    }

    // Check if user had an active local session that needs JWT cookie re-issued on cold start
    const cachedRaw = typeof window !== "undefined" ? localStorage.getItem("studiospace_user_cache") : null;
    if (cachedRaw) {
      try {
        const cachedUser = JSON.parse(cachedRaw) as User;
        if (cachedUser?.email) {
          await syncJwtSession({
            email: cachedUser.email,
            name: cachedUser.name,
            image: cachedUser.image,
            role: cachedUser.role,
          });
          return;
        }
      } catch {
        localStorage.removeItem("studiospace_user_cache");
      }
    }

    setUser(null);
  }, [syncJwtSession]);

  useEffect(() => {
    let active = true;
    (async () => {
      await refreshUser();
      if (active) setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [refreshUser]);

  const loginWithEmail = async (email: string, password: string): Promise<User> => {
    const normalizedEmail = email.trim().toLowerCase();
    const { data, error } = await authClient.signIn.email({
      email: normalizedEmail,
      password,
    });

    if (error || !data?.user) {
      throw new Error(error?.message || "Invalid email or password. Please check your credentials.");
    }

    const syncedUser = await syncJwtSession({
      email: data.user.email,
      name: data.user.name,
      image: data.user.image || undefined,
    });

    return syncedUser;
  };

  const registerWithEmail = async ({ name, email, password, image }: RegisterInput): Promise<void> => {
    const normalizedEmail = email.trim().toLowerCase();
    const { data, error } = await authClient.signUp.email({
      name: name.trim(),
      email: normalizedEmail,
      password,
      image:
        image?.trim() ||
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
    });

    if (error || !data?.user) {
      throw new Error(error?.message || "Registration failed. This email may already be registered.");
    }

    // Clear auto-session so the user logs in explicitly via /login as required
    try {
      await authClient.signOut();
    } catch {
      // Ignore
    }
  };

  const loginWithGoogle = async (account?: GoogleAccountProfile): Promise<User> => {
    const profile = account || {
      name: "Aria Chen (Google Verified Creator)",
      email: "aria.chen.creator@gmail.com",
      image:
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80",
    };

    const syncedUser = await syncJwtSession({
      email: profile.email,
      name: profile.name,
      image: profile.image,
      role: "host",
    });

    return syncedUser;
  };

  const logout = async () => {
    try {
      await authClient.signOut();
    } catch {
      // Ignore
    }
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignore
    }
    localStorage.removeItem("studiospace_user_cache");
    localStorage.removeItem("studiospace_jwt_token");
    setUser(null);
  };

  const toggleWishlist = async (studioId: string): Promise<boolean> => {
    if (!user) {
      toast.error("Please sign in to save studios to your wishlist.");
      return false;
    }

    try {
      const res = await apiFetch<{
        success: boolean;
        action: "added" | "removed";
        wishlist: string[];
        message: string;
      }>("/api/wishlist/toggle", {
        method: "POST",
        body: JSON.stringify({ studioId }),
      });

      const updatedUser: User = {
        ...user,
        wishlist: res.wishlist,
      };
      setUser(updatedUser);
      localStorage.setItem("studiospace_user_cache", JSON.stringify(updatedUser));

      if (res.action === "added") {
        toast.success(res.message);
      } else {
        toast.info(res.message);
      }
      return res.action === "added";
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update wishlist.";
      toast.error(msg);
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        logout,
        toggleWishlist,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

