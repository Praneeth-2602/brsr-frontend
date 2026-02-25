import type { DocumentListItem } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  documents: DocumentListItem[] | undefined;
  isLoading: boolean;
  onPreview: (id: string) => void;
}

export function CompanyTable({ documents, isLoading, onPreview }: Props) {
  if (isLoading) {
    return (
      <div className="space-y-3 mt-6">
        <Skeleton className="h-8 w-48" />
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
      </div>
    );
  }

  if (!documents || documents.length === 0) {
    return (
      <div className="mt-6 flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
        <p className="text-sm text-muted-foreground">No documents uploaded yet</p>
        <p className="text-xs text-muted-foreground mt-1">Upload BRSR reports to get started</p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <h2 className="text-lg font-semibold text-foreground mb-3">Parsed Companies</h2>
      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Sector</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Company</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Confidence</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Preview</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr key={doc.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 text-muted-foreground">{(() => {
                    const ext = (doc as any).extracted_json;
                    const val = ext?.entity_details.sector;
                    if (val == null) return <span className="text-muted-foreground">-</span>;                    
                    return <span>{String(val)}</span>;
                  })()}</td>
                <td className="px-4 py-3 font-medium text-foreground">
                  <div className="max-w-[220px] truncate">{doc.file_name && doc.file_name.length > 20 ? `${doc.file_name.slice(0,20)}…` : doc.file_name}</div>
                </td>
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
