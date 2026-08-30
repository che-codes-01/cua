"use client";

import { GiCamelHead } from "react-icons/gi";
import Logo from "./Logo";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "../ui/navigation-menu";
import ProfileDropdown from "./ProfileDropdown";
import { useAuthenticatedUser } from "@/context/AuthenticatedUser";

function Header() {
  const user = useAuthenticatedUser();
  return (
    <div className="flex justify-center">
      <nav className="max-w-7xl w-full flex items-center justify-between p-2">
        <Logo />

        <div>
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Item One</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <NavigationMenuLink>Link</NavigationMenuLink>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

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
