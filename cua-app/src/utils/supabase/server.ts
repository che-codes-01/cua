import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll called from a Server Component — middleware handles refresh
          }
        },
      },
    }
  );
}

/**
 * Returns the currently authenticated Supabase user.
 *
 * Uses `getUser()` (validates the JWT with the Supabase Auth server on every
 * call) rather than `getSession()` (trusts the local cookie), so it is safe
 * to use in Server Components and Route Handlers where you need a trustworthy
 * identity check.
 *
 * Redirects to `/signin` when there is no active session, so the return type
 * is always a non-null `User`.
 *
 * @example
 * // app/(dashboard-pages)/some-page/page.tsx
 * const user = await getAuthenticatedUser();
 * console.log(user.email);
 */
export async function getAuthenticatedUser(): Promise<User> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) redirect("/signin");

  return user;
}
