import type { Metadata } from "next";
import "../globals.css";
import Header from "@/components/custom/Header";
import Footer from "@/components/custom/Footer";
import { getAuthenticatedUser } from "@/utils/supabase/server";
import { AuthenticatedUserProvider } from "@/context/AuthenticatedUser";
import { redirect } from "next/dist/client/components/navigation";

export const metadata: Metadata = {
  title: "cua-app",
  description: "cua-app — Next.js app with Supabase GitHub auth",
};

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getAuthenticatedUser();
  if (!user?.user_metadata?.user_name) {
    redirect("/signin");
  }

  return (
    <AuthenticatedUserProvider user={user}>
      <main className="max-w-10xl w-full">
        {/* <Header /> */}
        {children}
        {/* <Footer /> */}
      </main>
    </AuthenticatedUserProvider>
  );
}
