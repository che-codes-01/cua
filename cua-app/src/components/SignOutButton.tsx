"use client";

import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export default function SignOutButton() {
  const supabase = createClient();
  const router = useRouter();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/signin");
    router.refresh();
  }

  return (
    <button
      onClick={handleSignOut}
      className="w-full rounded-xl border border-gray-700 bg-gray-800 px-5 py-2.5 text-sm font-medium text-gray-200 transition hover:bg-gray-700"
    >
      Sign out
    </button>
  );
}
