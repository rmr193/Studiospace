"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { toast } from "sonner";
import { User } from "@/types";
import { authClient } from "@/lib/auth-client";
import { apiFetch, API_URL } from "@/lib/api";

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  image?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithEmail: (email: string, password: string) => Promise<User>;
  registerWithEmail: (input: RegisterInput) => Promise<void>;
  loginWithGoogle: (redirectPath?: string) => Promise<void>;
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
      return res.user;
    },
    []
  );

  const refreshUser = useCallback(async () => {
    // 0. Check if returning from Google OAuth completion bridge (?auth_token=...)
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      const oauthToken = url.searchParams.get("auth_token");
      if (oauthToken) {
        localStorage.setItem("studiospace_jwt_token", oauthToken);
        url.searchParams.delete("auth_token");
        window.history.replaceState({}, "", url.pathname + url.search + url.hash);
        toast.success("Signed in with Google!");
      }
    }

    try {
      // 1. Verify existing HTTPOnly JWT cookie or Bearer token via /api/auth/me
      const meRes = await apiFetch<{ user: User }>("/api/auth/me", {
        method: "GET",
      });
      if (meRes?.user) {
        setUser(meRes.user);
        return;
      }
    } catch {
      // JWT session not valid; check BetterAuth session
    }

    try {
      // 2. Check active BetterAuth session in MongoDB
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

    localStorage.removeItem("studiospace_jwt_token");
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

    try {
      await authClient.signOut();
    } catch {
      // Ignore
    }
  };

  // Real BetterAuth Google OAuth flow with first-party completion bridge
  const loginWithGoogle = async (redirectPath = "/"): Promise<void> => {
    const frontendTarget =
      typeof window !== "undefined"
        ? `${window.location.origin}${redirectPath.startsWith("/") ? redirectPath : `/${redirectPath}`}`
        : "https://studiospace-lyart.vercel.app/";

    const callbackURL = `${API_URL}/api/auth/oauth-complete?redirect=${encodeURIComponent(frontendTarget)}`;

    const { error } = await authClient.signIn.social({
      provider: "google",
      callbackURL,
    });

    if (error) {
      throw new Error(
        error.message ||
          "Google OAuth failed. Ensure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set."
      );
    }
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
