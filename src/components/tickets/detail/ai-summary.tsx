"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

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
  if (!analysis) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-medium">AI Summary</h3>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No AI analysis available for this ticket.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-medium">AI Summary</h3>
          <Badge variant="outline" className="text-xs ml-auto">
            {(analysis.departmentConfidence * 100).toFixed(0)}% confidence
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <SummaryRow label="What" value={analysis.what} />
        <SummaryRow label="Who" value={analysis.who} />
        <SummaryRow label="Context" value={analysis.context} />
        <SummaryRow
          label="Urgency"
          value={analysis.urgency}
          highlight={analysis.urgency !== "None indicated"}
        />
        <SummaryRow label="Type" value={analysis.requestType} />
        <SummaryRow label="Department" value={analysis.department} />
        {analysis.category ? (
          <SummaryRow label="Category" value={analysis.category} />
        ) : null}

        {tags.length > 0 ? (
          <div>
            <span className="text-xs text-muted-foreground font-medium">Tags</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function SummaryRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <span className="text-xs text-muted-foreground font-medium">{label}</span>
      <p className={`text-sm mt-0.5 ${highlight ? "text-orange-600 font-medium" : ""}`}>
        {value}
      </p>
    </div>
  );
}
