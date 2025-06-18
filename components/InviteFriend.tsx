import React, { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useInviteBubbleStore } from "@/hooks/use-invite";

const InviteFriend = () => {
  // const [isOpen, setIsOpen] = useState(false);
  const isOpen = useInviteBubbleStore((state) => state.isOpen);
  const setIsOpen = useInviteBubbleStore((state) => state.setIsOpen);
  const [username, setUsername] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!username.trim()) return;

  setIsSubmitting(true);

  try {
    const res = await fetch("/api/friend-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });

    const data = await res.json();

    if (!res.ok) {
      toast.error(data.error || data.message || "Something went wrong");
    } else {
      toast.success(data.message || "Friend request sent successfully");
      setUsername("");
      setIsOpen(false);
    }
  } catch (err: unknown) {
    if (err instanceof Error) {
        console.error(err);
        toast.error(err.message || "Unexpected error occurred");
    } else {
        console.error("Unexpected error", err);
        toast.error("Unexpected error occurred");
    }
} finally {
    setIsSubmitting(false);
  }
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
          <div className="bg-white rounded-lg shadow-lg p-4 w-72 animate-in fade-in slide-in-from-top">
            <form onSubmit={handleSubmit} className="space-y-3">
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
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="h-9 text-sm"
                  autoFocus
                />
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting || !username.trim()}
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
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default InviteFriend;