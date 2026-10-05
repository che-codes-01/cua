import { getAuthenticatedUser } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function RootLayoutForAuthPages({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getAuthenticatedUser();
  if (user?.user_metadata?.user_name) {
    // redirect to dashboard, because the user is already authenticated
    redirect("/dashboard");
  }
  return <>{children}</>;
}
