import type { Metadata } from "next";
import "../globals.css";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import { getAuthenticatedUser } from "@/utils/supabase/server";
import { redirect } from "next/dist/client/components/navigation";
const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
export const metadata: Metadata = {
  title: "cua-app",
  description: "cua-app — Next.js app with Supabase GitHub auth",
};

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
