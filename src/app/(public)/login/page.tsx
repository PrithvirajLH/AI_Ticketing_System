"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardContent className="pt-8 pb-8 text-center space-y-6">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-primary/10 mx-auto">
            <Sparkles className="h-7 w-7 text-primary" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-semibold">AI Ticket Master</h1>
            <p className="text-sm text-muted-foreground">
              Sign in with your organization account to continue
            </p>
          </div>

          <Button
            onClick={() => signIn("microsoft-entra-id", { callbackUrl: "/submit" })}
            className="w-full"
            size="lg"
          >
            <svg className="h-5 w-5 mr-2" viewBox="0 0 21 21" fill="none">
              <rect x="1" y="1" width="9" height="9" fill="#f25022" />
              <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
              <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
              <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
            </svg>
            Sign in with Microsoft
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
