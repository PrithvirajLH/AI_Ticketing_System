"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, MessageSquareText } from "lucide-react";

interface CannedResponse {
  id: string;
  name: string;
  content: string;
}

export default function CannedResponsesPage() {
  const [responses, setResponses] = useState<CannedResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  async function loadData() {
    const res = await fetch("/api/canned-responses");
    const data = await res.json();
    setResponses(data.responses ?? []);
    setIsLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    await fetch("/api/canned-responses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.get("name"), content: form.get("content") }),
    });
    setDialogOpen(false);
    loadData();
  }

  if (isLoading) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{responses.length} canned response{responses.length !== 1 ? "s" : ""}</p>
        <Button size="sm" onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-1" /> Add Response</Button>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>New Canned Response</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-5 pt-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" required placeholder="e.g. Greeting" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Response Content</Label>
                <Textarea id="content" name="content" required rows={4} placeholder="Hi, thank you for reaching out..." />
              </div>
              <Button type="submit" className="w-full mt-2">Create Response</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {responses.length === 0 ? (
        <div className="text-center py-12 space-y-2">
          <MessageSquareText className="h-8 w-8 mx-auto text-muted-foreground opacity-50" />
          <p className="text-sm text-muted-foreground">No canned responses yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {responses.map((r) => (
            <Card key={r.id}>
              <CardContent className="pt-3 pb-3">
                <p className="text-sm font-medium">{r.name}</p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
