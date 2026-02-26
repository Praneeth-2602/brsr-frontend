import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { usePreview } from "@/hooks/use-documents";
import { Skeleton } from "@/components/ui/skeleton";
import React from "react";
import VirtualTable from "@/components/dashboard/VirtualTable";

interface Props {
  documentId: string | null;
  documentName?: string;
  companyName?: string;
  financialYear?: string | number;
  onClose: () => void;
}

export function PreviewModal({ documentId, documentName, companyName, financialYear, onClose }: Props) {
  const { data, isLoading } = usePreview(documentId);

  const rows = data ?? [];

  const columns = React.useMemo(() => {
    if (!rows.length) return [] as string[];
    return Object.keys(rows[0]);
  }, [rows]);

  const columnWidths = React.useMemo(() => {
    if (!columns.length) return [] as number[];
    const minWidth = 140;
    const maxWidth = 320;
    const sample = rows.slice(0, 250);

    return columns.map((col) => {
      const headerLen = String(col).length;
      let maxLen = headerLen;

      for (const row of sample) {
        const v = row[col];
        if (v == null) continue;
        if (React.isValidElement(v)) {
          maxLen = Math.max(maxLen, 18);
          continue;
        }

        const s = typeof v === "string" ? v : JSON.stringify(v);
        maxLen = Math.max(maxLen, s.length);
      }

      const estimated = 52 + Math.min(maxLen, 32) * 5.6;
      return Math.max(minWidth, Math.min(maxWidth, Math.round(estimated)));
    });
  }, [columns, rows]);

  return (
    <Dialog open={!!documentId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[80vw] h-[80vh] max-w-none max-h-none overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {companyName}_{financialYear}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto scrollbar-thin">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
            </div>
          ) : rows.length > 0 ? (
            <div className="rounded-xl border border-border/70 bg-card/80 backdrop-blur-sm">
              <VirtualTable
                columns={columns}
                rows={rows}
                rowHeight={64}
                stickyFirst
                visibleColumns={columns}
                columnWidths={columnWidths}
                showLeadingColumn={false}
                stickyColumnCount={3}
              />
            </div>
          ) : (
            <p className="p-6 text-center text-muted-foreground">No preview data available</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
