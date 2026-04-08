"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, MessageSquare } from "lucide-react";

const CURRENT_USER_ID = "a89f9497-b330-47ad-9136-65a5e4e5abd8";

interface CsatWidgetProps {
  ticketId: string;
  status: string;
  requesterId: string;
}

export function CsatWidget({ ticketId, status, requesterId }: CsatWidgetProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [existing, setExisting] = useState<number | null>(null);

  // Only show for resolved/closed tickets to the requester
  const isRequester = requesterId === CURRENT_USER_ID;
  const isResolved = ["RESOLVED", "CLOSED"].includes(status);

  useEffect(() => {
    if (!isResolved) return;
    fetch(`/api/tickets/${ticketId}/csat`)
      .then((r) => r.json())
      .then((data) => {
        if (data.rating) setExisting(data.rating);
      })
      .catch(() => {});
  }, [ticketId, isResolved]);

  if (!isResolved) return null;

  // Already submitted
  if (existing) {
    return (
      <Card className="border-green-200 bg-green-50/30">
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 mb-2">
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            <span className="text-sm font-medium">Satisfaction Rating</span>
          </div>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`h-5 w-5 ${s <= existing ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`}
              />
            ))}
            <span className="text-sm text-muted-foreground ml-2">{existing}/5</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (submitted) {
    return (
      <Card className="border-green-200 bg-green-50/30">
        <CardContent className="pt-4 text-center">
          <p className="text-sm font-medium text-green-700">Thank you for your feedback!</p>
        </CardContent>
      </Card>
    );
  }

  // Show rating form (for requester) or nothing (for agents)
  if (!isRequester) return null;

  return (
    <Card>
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 text-yellow-500" />
          <span className="text-sm font-medium">How was your experience?</span>
        </div>

        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              onMouseEnter={() => setHoveredStar(s)}
              onMouseLeave={() => setHoveredStar(0)}
              onClick={() => setRating(s)}
              className="transition-transform hover:scale-110"
            >
              <Star
                className={`h-7 w-7 ${
                  s <= (hoveredStar || rating || 0)
                    ? "text-yellow-500 fill-yellow-500"
                    : "text-gray-300"
                }`}
              />
            </button>
          ))}
        </div>

        {rating ? (
          <>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Optional comment..."
              className="w-full border rounded-md px-3 py-2 text-sm resize-none"
              rows={2}
            />
            <Button
              size="sm"
              onClick={async () => {
                await fetch(`/api/tickets/${ticketId}/csat`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ rating, comment: comment || undefined, userId: CURRENT_USER_ID }),
                });
                setSubmitted(true);
                setExisting(rating);
              }}
            >
              Submit Rating
            </Button>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
