"use client";

import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface User {
  id: string;
  displayName: string;
  email: string;
}

interface MentionAutocompleteProps {
  query: string;
  position: { top: number; left: number };
  onSelect: (user: User) => void;
  onClose: () => void;
}

export function MentionAutocomplete({ query, position, onSelect, onClose }: MentionAutocompleteProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query) { setUsers([]); return; }
    fetch("/api/users")
      .then((r) => r.json())
      .then((data) => {
        const filtered = (data.users ?? []).filter((u: User) =>
          u.displayName.toLowerCase().includes(query.toLowerCase()) ||
          u.email.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 5);
        setUsers(filtered);
        setSelectedIndex(0);
      })
      .catch(() => {});
  }, [query]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIndex((i) => Math.min(i + 1, users.length - 1)); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIndex((i) => Math.max(i - 1, 0)); }
      else if (e.key === "Enter" && users[selectedIndex]) { e.preventDefault(); onSelect(users[selectedIndex]); }
      else if (e.key === "Escape") { onClose(); }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [users, selectedIndex, onSelect, onClose]);

  if (users.length === 0) return null;

  return (
    <div
      ref={ref}
      className="absolute z-50 w-64 bg-popover border rounded-lg shadow-lg py-1"
      style={{ bottom: position.top, left: position.left }}
    >
      {users.map((user, index) => (
        <button
          key={user.id}
          onClick={() => onSelect(user)}
          onMouseEnter={() => setSelectedIndex(index)}
          className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left ${
            index === selectedIndex ? "bg-accent" : ""
          }`}
        >
          <Avatar className="h-5 w-5">
            <AvatarFallback className="text-[8px]">
              {user.displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-xs font-medium truncate">{user.displayName}</p>
            <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
