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

  // Exchanges the verified BetterAuth session for the HTTPOnly API JWT cookie.
  // No token is ever written to localStorage.
  const syncJwtSession = useCallback(async (): Promise<User> => {
    const res = await apiFetch<{ success: boolean; user: User }>("/api/auth/jwt", {
      method: "POST",
    });
    setUser(res.user);
    return res.user;
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      // 1. Verify the existing HTTPOnly JWT cookie.
      const meRes = await apiFetch<{ user: User }>("/api/auth/me", {
        method: "GET",
      });
      if (meRes?.user) {
        setUser(meRes.user);
        return;
      }
    } catch {
      // JWT session not valid; check the BetterAuth session below.
    }

    try {
      // 2. A valid BetterAuth session (email or Google OAuth) can mint a new
      // HTTPOnly API cookie without exposing the token to JavaScript.
      const { data: sessionData } = await authClient.getSession();
      if (sessionData?.user?.email) {
        await syncJwtSession();
        return;
      }
    } catch {
      // No active BetterAuth session
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

    return syncJwtSession();
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

    // The registration page sends users to the login screen so the new
    // credential account starts from a fresh, explicit sign-in.
    try {
      await authClient.signOut();
    } catch {
      // Ignore
    }
  };

  // Real BetterAuth Google OAuth flow with a first-party completion bridge.
  const loginWithGoogle = async (redirectPath = "/"): Promise<void> => {
    const safePath =
      redirectPath.startsWith("/") && !redirectPath.startsWith("//") ? redirectPath : "/";
    const frontendTarget =
      typeof window !== "undefined"
        ? `${window.location.origin}${safePath}`
        : "https://studiospace-lyart.vercel.app/";

    const callbackURL = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/auth/oauth-complete?redirect=${encodeURIComponent(frontendTarget)}`;

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
