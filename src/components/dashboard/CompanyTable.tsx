import type { DocumentListItem } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";
import { Button } from "@/components/ui/button";
import { Eye, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import React from "react";

interface Props {
  documents: DocumentListItem[] | undefined;
  isLoading: boolean;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  onPreview: (id: string) => void;
}

export function CompanyTable({ documents, isLoading, isRefreshing = false, onRefresh, onPreview }: Props) {
  const sortedDocuments = React.useMemo(() => {
    return [...(documents ?? [])].sort((a, b) => {
      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bTime - aTime;
    });
  }, [documents]);

  if (isLoading) {
    return (
      <div className="space-y-3 mt-6">
        <Skeleton className="h-8 w-48" />
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
      </div>
    );
  }

  if (sortedDocuments.length === 0) {
    return (
      <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-card/65 py-12">
        <p className="text-sm text-muted-foreground">No documents uploaded yet</p>
        <p className="text-xs text-muted-foreground mt-1">Upload BRSR reports to get started</p>
      </div>
    );
  }

  return (
    <div className="mt-7">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          {/* <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Status Board</p> */}
          <h2 className="text-xl font-semibold text-foreground">Status</h2>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="gap-1.5"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh Table
        </Button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-border/70 bg-card/80 backdrop-blur-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/45">
              <th className="px-4 py-3 text-left text-xs uppercase tracking-[0.12em] font-semibold text-white">Sector</th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-[0.12em] font-semibold text-white">Company Name</th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-[0.12em] font-semibold text-white">Year</th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-[0.12em] font-semibold text-white">Confidence Score</th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-[0.12em] font-semibold text-white">Status</th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-[0.12em] font-semibold text-white">Preview</th>
            </tr>
          </thead>
          <tbody>
            {sortedDocuments.map((doc) => (
              <tr key={doc.id} className="border-b border-border/60 last:border-0 hover:bg-muted/25 transition-colors">
                <td className="px-4 py-3 text-foreground">{(() => {
                  const ext = (doc as any).extracted_json;
                  const val = ext?.entity_details.sector;
                  if (val == null) return <span className="text-muted-foreground">-</span>;
                  return <span>{String(val)}</span>;
                })()}</td>
                <td className="px-4 py-3 font-medium text-foreground">
                  <div className="max-w-[220px] truncate">{doc.extracted_json?.entity_details?.name || doc.file_name}</div>
                </td>
                <td className="px-4 py-3 text-foreground">{(() => {
                  const ext = (doc as any).extracted_json;
                  const val = ext?.entity_details.financial_year;
                  if (val == null) return <span className="text-muted-foreground">-</span>;
                  return <span>{String(val)}</span>;
                })()}</td>
                <td className="px-4 py-3">
                  {(() => {
                    const ext = (doc as any).extracted_json;
                    const val = ext?.confidence_score ?? ext?.confidence;
                    if (val == null) return <span className="text-muted-foreground">-</span>;
                    if (typeof val === "number") {
                      // show percent when value between 0 and 1
                      if (val > 0 && val <= 1) return <span>{(val * 100).toFixed(2)}%</span>;
                      return <span>{val.toLocaleString()}%</span>;
                    }
                    return <span>{String(val)}</span>;
                  })()}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={doc.status} errorMessage={doc.error_message} />
                </td>
                <td className="px-4 py-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={doc.status !== "completed"}
                    onClick={() => onPreview(doc.id)}
                    className="gap-1.5"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Preview
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
