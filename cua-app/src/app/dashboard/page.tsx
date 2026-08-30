import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import SignOutButton from "@/components/SignOutButton";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Belt-and-suspenders guard (middleware already handles this)
  if (!user) redirect("/signin");

  const avatarUrl =
    user.user_metadata?.avatar_url ?? user.user_metadata?.picture;
  const name =
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    user.email ??
    "User";

  return (
    <main className="">
      Dashboard
    </main>
  );
}
