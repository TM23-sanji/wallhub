import React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { User, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useProfileBubbleStore } from "@/hooks/use-profile";
import { useUser } from "@clerk/nextjs";

const ShowProfile = () => {
  const router = useRouter();
  const isOpen = useProfileBubbleStore((state) => state.isOpen);
    const { user } = useUser();
    const profile = {
      name: user?.username || "Guest",
      email: user?.primaryEmailAddress?.emailAddress,
      avatar:
        user?.imageUrl ||
        "https://img.clerk.com/eyJ0eXBlIjoiZGVmYXVsdCIsImlpZCI6Imluc18yd0hqUnAycURwTk9RUnVIMk90c01STFExZmIiLCJyaWQiOiJ1c2VyXzJ3Vkc1aU9xZHlqUnVEcHBHanZxUVk0WFpzQiJ9",
    };

  return (
    <div className="fixed top-6 right-6 z-50">
      <div
        className={cn(
          "invite-bubble transition-all duration-300 ease-in-out",
          isOpen ? "translate-y-0" : "-translate-y-2"
        )}
      >
        {isOpen && (
          <div className="bg-white rounded-lg shadow-lg  animate-in fade-in slide-in-from-top">
            {/* <form onSubmit={handleSubmit} className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-sm">Invite a Friend</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="h-6 w-6"
                >
                  <span className="sr-only">Close</span>✕
                </Button>
              </div>

              <div className="flex flex-col space-y-2">
                <Input
                  placeholder="Enter username"
                  value={!profile.name? "Guest": profile.name}
                  onChange={(e) =>(e.stopPropagation()) }
                  className="h-9 text-sm"
                  autoFocus
                />
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting || !profile.name.trim()}
                  className="bg-[#9b87f5] hover:bg-[#7E69AB] text-white"
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <div className="h-3 w-3 rounded-full border-2 border-t-transparent border-white animate-spin mr-2" />
                      Sending...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <Send className="h-3.5 w-3.5 mr-1" />
                      Send Invite
                    </span>
                  )}
                </Button>
              </div>
            </form> */}
                  <main className="flex-1 flex flex-col items-center justify-center">
        <Card className="w-full max-w-md mx-auto shadow-md relative">
          <button
            onClick={() => useProfileBubbleStore.getState().setIsOpen(false)}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          <CardHeader className="flex flex-col items-center space-y-4 pb-2">
            <Avatar className="h-24 w-24">
              <AvatarImage src={profile.avatar} alt={profile.name} />
              <AvatarFallback>
                <User className="h-12 w-12 text-gray-400" />
              </AvatarFallback>
            </Avatar>
          </CardHeader>

          <CardContent className="flex flex-col items-center text-center space-y-2">
            <h2 className="text-2xl font-bold">{profile.name}</h2>
            {profile.email?.trim() ? (
              <p className="text-gray-500">{profile.email}</p>
            ) : (
              <p
                className="text-blue-400 underline cursor-pointer"
                onClick={() => router.push("/signup")}
              >
                Click here to Signup
              </p>
            )}
          </CardContent>
        </Card>
      </main>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShowProfile;