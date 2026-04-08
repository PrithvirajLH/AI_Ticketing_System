"use client";

import { Suspense } from "react";
import { Sidebar } from "./sidebar";
import { TopHeader } from "./top-header";
import { CommandPalette } from "./command-palette";
import { KeyboardShortcuts } from "./keyboard-shortcuts";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Suspense>
        <Sidebar />
      </Suspense>
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopHeader />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
      <CommandPalette />
      <KeyboardShortcuts />
    </div>
  );
}
