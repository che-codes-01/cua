import { getAuthenticatedUser } from "@/utils/supabase/server";

export default async function DashboardPage() {
  const user = await getAuthenticatedUser();
  console.log("Authenticated user:", user);

  return <main className="">Dashboard</main>;
}
