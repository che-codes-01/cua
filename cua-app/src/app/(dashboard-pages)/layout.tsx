import type { Metadata } from "next";
import "../globals.css";
import { Inter } from "next/font/google";
import Header from "@/components/custom/Header";
import Footer from "@/components/custom/Footer";
import { getAuthenticatedUser } from "@/utils/supabase/server";
import { AuthenticatedUserProvider } from "@/context/AuthenticatedUser";

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

  return (
    <AuthenticatedUserProvider user={user}>
      <Header />
      {children}
      <Footer />
    </AuthenticatedUserProvider>
  );
}
