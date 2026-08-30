"use client";

import { createClient } from "@/utils/supabase/client";
import { Button } from "./ui/button";
import { VscGithub } from "react-icons/vsc";

export default function GitHubSignInButton({
  buttonText = "Continue with GitHub",
}: {
  buttonText?: string;
}) {
  const supabase = createClient();

  async function handleSignIn() {
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  return (
    <Button size="lg" onClick={handleSignIn} className="w-full">
      <VscGithub />
      {buttonText}
    </Button>
  );
}
