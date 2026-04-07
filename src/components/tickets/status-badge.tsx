import { Badge } from "@/components/ui/badge";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  NEW: { label: "New", className: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  TRIAGED: { label: "Triaged", className: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
  ASSIGNED: { label: "Assigned", className: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20" },
  IN_PROGRESS: { label: "In Progress", className: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20" },
  WAITING_ON_REQUESTER: { label: "Waiting on Requester", className: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
  WAITING_ON_VENDOR: { label: "Waiting on Vendor", className: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
  RESOLVED: { label: "Resolved", className: "bg-green-500/10 text-green-600 border-green-500/20" },
  CLOSED: { label: "Closed", className: "bg-gray-500/10 text-gray-500 border-gray-500/20" },
  REOPENED: { label: "Reopened", className: "bg-red-500/10 text-red-600 border-red-500/20" },
};

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    className: "bg-gray-500/10 text-gray-500",
  };

  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}
