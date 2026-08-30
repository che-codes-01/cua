"use client";

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AuthenticatedUserContextValue {
  user: User;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const AuthenticatedUserContext =
  createContext<AuthenticatedUserContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

/**
 * Wrap authenticated routes with this provider.
 *
 * The `user` prop should be resolved server-side (e.g. in a layout or page)
 * via `createClient().auth.getUser()` and passed in, keeping this component
 * a pure client boundary with no extra round-trips.
 *
 * @example
 * // app/(dashboard-pages)/layout.tsx  (Server Component)
 * const { data: { user } } = await supabase.auth.getUser();
 * if (!user) redirect("/signin");
 * return <AuthenticatedUserProvider user={user}>{children}</AuthenticatedUserProvider>;
 */
export function AuthenticatedUserProvider({
  user,
  children,
}: {
  user: User;
  children: ReactNode;
}) {
  return (
    <AuthenticatedUserContext.Provider value={{ user }}>
      {children}
    </AuthenticatedUserContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Returns the authenticated user.
 *
 * Must be called inside an `<AuthenticatedUserProvider>`.
 * Throws if used outside of one — this is intentional: only authenticated
 * subtrees should call this hook, so a missing provider is always a bug.
 */
export function useAuthenticatedUser(): User {
  const ctx = useContext(AuthenticatedUserContext);
  if (!ctx) {
    throw new Error(
      "useAuthenticatedUser must be used inside <AuthenticatedUserProvider>. " +
        "Make sure the component is rendered within an authenticated route layout."
    );
  }
  return ctx.user;
}
