"use client";

import { Minus, Circle } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils"; // adjust this import to match your project

interface FriendItemProps {
  name: string;
  isOnline: boolean;
}

const FriendItem = ({ name, isOnline }: FriendItemProps) => {
  const [removed, setRemoved] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRemove = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/friends", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: name }),
      });

      if (res.ok) {
        setRemoved(true);
      } else {
        const error = await res.json();
        console.error("Failed to remove friend:", error.error);
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (removed) return null;

  return (
    <div className="flex items-center justify-between p-3 pl-1 pr-0 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors">
      <div className="flex items-center">
        <Circle
          className={cn(
            "h-2 w-2 mr-2",
            isOnline
              ? "fill-green-500 stroke-green-500"
              : "fill-red-500 stroke-red-500"
          )}
        />
        <span className="font-medium text-gray-700">{name}</span>
      </div>
      <button
        onClick={handleRemove}
        disabled={loading}
        className="flex items-center cursor-pointer space-x-2 pl-2 pr-2 text-gray-500 hover:text-gray-700"
      >
        <Minus className="h-3 w-3" />
      </button>
    </div>
  );
};

export default FriendItem;