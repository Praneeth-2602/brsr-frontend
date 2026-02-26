import type { DocumentStatus } from "@/lib/types";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertCircle } from "lucide-react";

const statusConfig: Record<DocumentStatus, { label: string; className: string }> = {
  processing: {
    label: "Processing",
    className: "bg-status-processing/15 text-status-processing-foreground border border-status-processing/30 animate-pulse-subtle",
  },
  completed: {
    label: "Completed",
    className: "bg-status-completed/15 text-status-completed-foreground border border-status-completed/30",
  },
  failed: {
    label: "Failed",
    className: "bg-status-failed/15 text-destructive border border-status-failed/30",
  },
};

export function StatusBadge({ status, errorMessage }: { status?: DocumentStatus | string; errorMessage?: string }) {
  const normalizedStatus = status === "pending" ? "processing" : status;
  const config = (normalizedStatus && (statusConfig as any)[normalizedStatus]) ?? { label: String(normalizedStatus ?? "Unknown"), className: "bg-muted text-foreground" };

  const badge = (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}>
      {config.label}
      {String(status) === "failed" && <AlertCircle className="h-3 w-3" />}
    </span>
  );

  if (status === "failed" && errorMessage) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="text-xs">{errorMessage}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return badge;
}
