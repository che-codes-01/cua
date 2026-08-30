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
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-lg rounded-2xl border border-gray-800 bg-gray-900 p-8 shadow-xl">
        <div className="flex items-center gap-4">
          {avatarUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={name}
              className="h-14 w-14 rounded-full ring-2 ring-indigo-500"
            />
          )}
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-indigo-400">
              Signed in
            </p>
            <h1 className="text-2xl font-bold text-white">{name}</h1>
            <p className="text-sm text-gray-400">{user.email}</p>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-gray-800 bg-gray-950 p-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
            User ID
          </p>
          <code className="break-all text-xs text-indigo-300">{user.id}</code>
        </div>

        <div className="mt-6">
          <SignOutButton />
        </div>
      </div>
    </main>
  );
}
