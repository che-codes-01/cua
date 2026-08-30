import LoginCard from "@/components/custom/LoginCard";
import { getAuthenticatedUser } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function SignInPage() {
  const user = await getAuthenticatedUser();
  if (user?.user_metadata?.user_name) {
    // redirect to dashboard
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <LoginCard />
    </main>
  );
}
