"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const SHORTCUTS = [
  { keys: ["Ctrl", "K"], description: "Command palette" },
  { keys: ["?"], description: "Show keyboard shortcuts" },
  { keys: ["Alt", "N"], description: "New request" },
  { keys: ["Alt", "T"], description: "Go to tickets" },
  { keys: ["Alt", "D"], description: "Go to dashboard" },
  { keys: ["Alt", "R"], description: "Go to reports" },
  { keys: ["Alt", "B"], description: "Go to triage board" },
];

export function KeyboardShortcuts() {
  const [helpOpen, setHelpOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ignore if typing in input/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.key === "?" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setHelpOpen((prev) => !prev);
      }
      if (e.altKey && e.key === "n") { e.preventDefault(); router.push("/submit"); }
      if (e.altKey && e.key === "t") { e.preventDefault(); router.push("/tickets"); }
      if (e.altKey && e.key === "d") { e.preventDefault(); router.push("/dashboard"); }
      if (e.altKey && e.key === "r") { e.preventDefault(); router.push("/reports"); }
      if (e.altKey && e.key === "b") { e.preventDefault(); router.push("/triage"); }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  return (
    <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 pt-2">
          {SHORTCUTS.map((s) => (
            <div key={s.description} className="flex items-center justify-between py-1.5">
              <span className="text-sm">{s.description}</span>
              <div className="flex items-center gap-1">
                {s.keys.map((k) => (
                  <kbd key={k} className="text-xs font-mono bg-muted px-2 py-1 rounded border">{k}</kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
