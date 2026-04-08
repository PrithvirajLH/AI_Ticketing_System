"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Paperclip, Upload, File, Loader2 } from "lucide-react";

const CURRENT_USER_ID = "a89f9497-b330-47ad-9136-65a5e4e5abd8";

interface Attachment {
  id: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  scanStatus: string;
  createdAt: string;
  uploadedBy: { displayName: string } | null;
}

interface AttachmentsCardProps {
  ticketId: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AttachmentsCard({ ticketId }: AttachmentsCardProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`/api/tickets/${ticketId}/attachments`)
      .then((r) => r.json())
      .then((data) => setAttachments(data.attachments ?? []))
      .catch(() => {});
  }, [ticketId]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("uploadedById", CURRENT_USER_ID);

    const res = await fetch(`/api/tickets/${ticketId}/attachments`, {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      setAttachments((prev) => [data.attachment, ...prev]);
    }

    setIsUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <Card>
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Paperclip className="h-3.5 w-3.5 text-amber-500" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Attachments ({attachments.length})
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => fileRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Upload className="h-3.5 w-3.5 mr-1" />}
            Upload
          </Button>
          <input ref={fileRef} type="file" className="hidden" onChange={handleUpload} />
        </div>

        {attachments.length > 0 ? (
          <div className="space-y-2">
            {attachments.map((att) => (
              <div key={att.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <File className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{att.fileName}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {formatSize(att.sizeBytes)}
                    {att.uploadedBy ? ` · ${att.uploadedBy.displayName}` : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
