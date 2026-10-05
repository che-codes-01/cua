"use client";

import Logo from "./Logo";
import ProfileDropdown from "./ProfileDropdown";
import { useAuthenticatedUser } from "@/context/AuthenticatedUser";

function Header() {
  const user = useAuthenticatedUser();
  return (
    <div className="flex justify-center">
      <nav className="max-w-7xl w-full flex items-center justify-between p-2">
        <Logo href="/dashboard" />

        <div>
          <ProfileDropdown
            userEmail={user?.email}
            userName={user?.user_metadata?.user_name}
            avatarUrl={user?.user_metadata?.avatar_url}
          />
        </div>
      </nav>
    </div>
  );
}

export default Header;
