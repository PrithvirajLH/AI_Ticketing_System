"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";

const CURRENT_USER_ID = "a89f9497-b330-47ad-9136-65a5e4e5abd8";

interface FollowersButtonProps {
  ticketId: string;
}

export function FollowersButton({ ticketId }: FollowersButtonProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);

  useEffect(() => {
    fetch(`/api/tickets/${ticketId}/followers`)
      .then((r) => r.json())
      .then((data) => {
        const followers = data.followers ?? [];
        setFollowerCount(followers.length);
        setIsFollowing(followers.some((f: { userId: string }) => f.userId === CURRENT_USER_ID));
      })
      .catch(() => {});
  }, [ticketId]);

  async function toggle() {
    const res = await fetch(`/api/tickets/${ticketId}/followers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: CURRENT_USER_ID }),
    });
    const data = await res.json();
    setIsFollowing(data.following);
    setFollowerCount((c) => data.following ? c + 1 : c - 1);
  }

  return (
    <Button variant="outline" size="sm" onClick={toggle} className="h-7 text-xs">
      {isFollowing ? (
        <>
          <EyeOff className="h-3.5 w-3.5 mr-1" />
          Unwatch ({followerCount})
        </>
      ) : (
        <>
          <Eye className="h-3.5 w-3.5 mr-1" />
          Watch ({followerCount})
        </>
      )}
    </Button>
  );
}
