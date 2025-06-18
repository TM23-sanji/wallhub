"use client";
import React from "react";
import { Underdog } from "next/font/google";
import { User, Upload, Menu, UserPlus2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import Image from "next/image";
import { useSidebar } from "@/hooks/use-sidebar";
import InviteFriend from "./InviteFriend";
import ShowProfile from "./show-profile";
import { useInviteBubbleStore } from "@/hooks/use-invite";
import { useProfileBubbleStore } from "@/hooks/use-profile";
import { favorite } from "@/hooks/use-favorite";
import { Switch } from "@/components/ui/switch";

const underdog = Underdog({
  subsets: ["latin"],
  weight: "400",
});

const Header = ({ onUploadClick }: { onUploadClick: () => void }) => {
  const router = useRouter();
  const isMobile = useIsMobile();
  const { signOut } = useClerk();
  const { toggleSidebar } = useSidebar();

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center">
        {/* {isMobile && ( */}
        <Button
          variant="ghost"
          onClick={() => {
            toggleSidebar();
            useInviteBubbleStore.getState().setIsOpen(false);
            useProfileBubbleStore.getState().setIsOpen(false);
          }}
          size="icon"
          className="mr-2"
        >
          <Menu className="h-5 w-5" />
        </Button>
        {/* )} */}
        <div className="flex items-center">
          <div className="h-12 w-12 rounded-md flex items-center justify-center animate-subtle-pulse">
            <Image
              src="/logo.png" // from the public directory
              alt="Logo"
              width={120} // set your desired width
              height={40} // set your desired height
            />
          </div>
          <h1
            onClick={() => router.push("/")}
            style={{ fontWeight: "bold" }}
            className={`ml-3 ${underdog.className} text-lg cursor-pointer`}
          >
            WallTribe
          </h1>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          className="mr-2 flex items-center gap-1 cursor-pointer"
          onClick={() => {
            useInviteBubbleStore.getState().toggleInvite();
            useProfileBubbleStore.getState().setIsOpen(false);
          }}
          size="sm"
        >
          <UserPlus2 className="h-4 w-4" />
        </Button>
        <InviteFriend />
        <ShowProfile />

        <Button
          variant="ghost"
          className="mr-2 flex items-center gap-1 cursor-pointer"
          onClick={onUploadClick}
          size="sm"
        >
          <Upload className="h-4 w-4" />
          {!isMobile && <span>Upload</span>}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full cursor-pointer"
            >
              <User className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              onClick={() => {
                useProfileBubbleStore.getState().toggleInvite();
                useInviteBubbleStore.getState().setIsOpen(false);
              }}
              className={`${underdog.className}`}
            >
              Profile
            </DropdownMenuItem>
            <div className="flex items-center px-2 py-1">
              <p className="text-sm">Favourites{" "}</p>
              <Switch
                className="cursor-pointer ml-4"
                onClick={() => {
                  useInviteBubbleStore.getState().setIsOpen(false);
                  useProfileBubbleStore.getState().setIsOpen(false);
                  favorite.getState().toggleInvite();
                }}
              />
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                signOut();
                router.push("/login");
              }}
            >
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;