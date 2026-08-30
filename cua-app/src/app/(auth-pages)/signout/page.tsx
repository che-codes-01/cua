"use client";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import { redirect } from "next/dist/client/components/navigation";

function SignOutButton({
  buttonText = "Sign Out",
  className,
  variant,
}: {
  buttonText?: string;
  className?: string;
  variant?: "destructive" | "ghost" | "secondary";
}) {
  async function handleSignOut() {
    const supabase = createClient();
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Error signing out:", err);
    }
    redirect("/signin");
  }

  return (
    <Button onClick={handleSignOut} className={className} variant={variant}>
      {buttonText}
    </Button>
  );
}

export default SignOutButton;
