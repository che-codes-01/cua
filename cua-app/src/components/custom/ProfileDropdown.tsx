import React from "react";
import SignOutButton from "@/app/(auth-pages)/signout/page";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "../ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { User, Settings, HelpCircle } from "lucide-react";
import Link from "next/link";

function ProfileDropdown({
  avatarUrl,
  userName,
  userEmail,
}: {
  avatarUrl?: string;
  userName?: string;
  userEmail?: string;
}) {
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          className="relative h-10 w-10 rounded-full"
        >
          <Avatar>
            <AvatarImage
              alt={userName ?? "@user"}
              src={avatarUrl ?? ""}
            />
            <AvatarFallback>{userName?.[0]?.toUpperCase() ?? "U"}</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="font-medium text-sm leading-none">
                  {userName ?? ""}
                </p>
                <p className="text-muted-foreground text-xs leading-none">
                  {userEmail ?? ""}
                </p>
              </div>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <Link href="/profile" className="flex items-center gap-2 w-full">
              <User /> Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Link href="/settings" className="flex items-center gap-2 w-full">
              <Settings /> Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Link href="/help" className="flex items-center gap-2 w-full">
              <HelpCircle /> Help Docs
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <SignOutButton
              buttonText="Sign Out"
              className="w-full"
              variant="destructive"
            />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

export default ProfileDropdown;
