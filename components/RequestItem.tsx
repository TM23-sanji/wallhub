"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

interface RequestItemProps {
  name: string;
}

const RequestItem = ({ name }: RequestItemProps) => {
  const [loading, setLoading] = useState(false);
  const [accepted, setAccepted] = useState(false);

  const handleAccept = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: name }),
      });

      if (res.ok) {
        setAccepted(true);
      } else {
        const err = await res.json();
        console.error("Error accepting request:", err.error);
      }
    } catch (err) {
      console.error("Request failed:", err);
    } finally {
      setLoading(false);
    }
  };

  if (accepted) {
    return (
      <div className="flex items-center justify-between p-2 pr-1 bg-green-50 rounded-lg text-green-700">
        <span>{name}</span>
        <span className="text-sm font-medium">✓</span>
      </div>
    );
  }

  return (
    <div
      className="flex items-center justify-between p-3 pr-0 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
    >
      <div className="flex items-center">
        <span className="font-medium text-gray-700">{name}</span>
      </div>

      <button
        onClick={handleAccept}
        disabled={loading}
        className="flex items-center cursor-pointer space-x-2 pl-2 pr-2 text-gray-600 hover:text-gray-blue-800 transition"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
};

export default RequestItem;