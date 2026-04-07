"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ChevronDown, ChevronUp, Brain, User, FileText, AlertTriangle, Building, FolderTree, Tag } from "lucide-react";

interface AiAnalysis {
  what: string;
  who: string;
  context: string;
  urgency: string;
  intent: string;
  requestType: string;
  department: string;
  departmentConfidence: number;
  category: string | null;
  reasoning: string;
}

interface AiSummaryProps {
  analysis: AiAnalysis | null;
  tags: string[];
}

export function AiSummary({ analysis, tags }: AiSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!analysis) {
    return (
      <Card className="border-dashed">
        <div className="px-4 py-3 flex items-center gap-2 text-muted-foreground">
          <Sparkles className="h-4 w-4" />
          <span className="text-sm">No AI analysis available</span>
        </div>
      </Card>
    );
  }

  const confidencePercent = Math.round(analysis.departmentConfidence * 100);
  const confidenceColor = confidencePercent >= 90 ? "text-green-600 bg-green-50 border-green-200"
    : confidencePercent >= 70 ? "text-blue-600 bg-blue-50 border-blue-200"
    : "text-orange-600 bg-orange-50 border-orange-200";

  return (
    <Card className="overflow-hidden">
      {/* Header — always visible, clickable to toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center gap-2 hover:bg-muted/30 transition-colors"
      >
        <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
        </div>
        <span className="text-sm font-semibold flex-1 text-left">AI Summary</span>
        <Badge variant="outline" className={`text-[10px] px-2 ${confidenceColor}`}>
          {confidencePercent}%
        </Badge>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {/* Collapsed preview — show just the "what" */}
      {!isExpanded ? (
        <div className="px-4 pb-3">
          <p className="text-xs text-muted-foreground line-clamp-2">{analysis.what}</p>
        </div>
      ) : null}

      {/* Expanded content */}
      {isExpanded ? (
        <CardContent className="pt-0 pb-4 space-y-3">
          {/* Key insight — highlighted */}
          <div className="bg-primary/5 rounded-lg p-3 border border-primary/10">
            <div className="flex items-start gap-2">
              <Brain className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <p className="text-sm leading-relaxed">{analysis.what}</p>
            </div>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-3">
            <DetailItem icon={<User className="h-3.5 w-3.5" />} label="Who" value={analysis.who} />
            <DetailItem
              icon={<AlertTriangle className="h-3.5 w-3.5" />}
              label="Urgency"
              value={analysis.urgency}
              highlight={analysis.urgency !== "None indicated" && analysis.urgency !== "None"}
            />
            <DetailItem icon={<Building className="h-3.5 w-3.5" />} label="Department" value={analysis.department} />
            <DetailItem icon={<FileText className="h-3.5 w-3.5" />} label="Type" value={analysis.requestType} />
            {analysis.category ? (
              <DetailItem icon={<FolderTree className="h-3.5 w-3.5" />} label="Category" value={analysis.category} />
            ) : null}
          </div>

          {/* Context — collapsible reasoning */}
          {analysis.context ? (
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground leading-relaxed">{analysis.context}</p>
            </div>
          ) : null}

          {/* Tags */}
          {tags.length > 0 ? (
            <div className="flex items-center gap-1.5 flex-wrap">
              <Tag className="h-3 w-3 text-muted-foreground shrink-0" />
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-[10px] px-2 py-0">
                  {tag}
                </Badge>
              ))}
            </div>
          ) : null}
        </CardContent>
      ) : null}
    </Card>
  );
}

function DetailItem({
  icon,
  label,
  value,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1 text-muted-foreground">
        {icon}
        <span className="text-[10px] font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className={`text-xs font-medium ${highlight ? "text-orange-600" : ""}`}>{value}</p>
    </div>
  );
}
