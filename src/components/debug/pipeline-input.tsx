"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface PipelineInputFormProps {
  onSubmit: (text: string, userId: string) => void;
  isLoading: boolean;
}

export function PipelineInputForm({ onSubmit, isLoading }: PipelineInputFormProps) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const text = (form.elements.namedItem("text") as HTMLTextAreaElement).value;
        const userId = (form.elements.namedItem("userId") as HTMLInputElement).value;
        onSubmit(text, userId);
      }}
      className="space-y-3"
    >
      <div>
        <label htmlFor="text" className="block text-sm font-medium mb-1">
          Employee Request
        </label>
        <Textarea
          id="text"
          name="text"
          rows={3}
          required
          placeholder="e.g. I can't access SAP and I have a deadline tomorrow"
          defaultValue="I can't access SAP and I have a deadline tomorrow for the quarterly report"
        />
      </div>
      <div>
        <label htmlFor="userId" className="block text-sm font-medium mb-1">
          User ID (optional)
        </label>
        <Input
          id="userId"
          name="userId"
          type="text"
          placeholder="e.g. a89f9497-b330-47ad-9136-65a5e4e5abd8"
        />
      </div>
      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Running Pipeline..." : "Run Pipeline"}
      </Button>
    </form>
  );
}
