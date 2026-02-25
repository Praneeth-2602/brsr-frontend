import type { DocumentListItem } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText } from "lucide-react";

interface Props {
  documents: DocumentListItem[] | undefined;
  isLoading: boolean;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export function PdfList({ documents, isLoading, selectedId, onSelect }: Props) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {/* All Companies option */}
      <button
        onClick={() => onSelect(null)}
        className={`w-full rounded-md px-3 py-3 text-left transition-colors ${
          selectedId === null ? "bg-primary/10 border border-primary/20" : "hover:bg-muted"
        }`}
      >
        <p className="text-sm font-medium text-foreground">All Companies</p>
        <p className="text-xs text-muted-foreground">Consolidated view</p>
      </button>

      {documents?.map((doc) => (
        <button
          key={doc.id}
          onClick={() => onSelect(doc.id)}
          className={`w-full rounded-md px-3 py-3 text-left transition-colors ${
            selectedId === doc.id ? "bg-primary/10 border border-primary/20" : "hover:bg-muted"
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 min-w-0">
              <FileText className="h-4 w-4 mt-0.5 text-primary shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{doc.extracted_json?.entity_details.name || doc.file_name}</p>
                <p className="text-xs text-muted-foreground">{new Date(doc.created_at).toLocaleString()}</p>
              </div>
            </div>
            <StatusBadge status={doc.status} />
          </div>
        </button>
      ))}
    </div>
  );
}
