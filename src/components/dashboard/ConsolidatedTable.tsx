import { useConsolidated } from "@/hooks/use-documents";
import * as backend from "@/lib/backend";
import type { DocumentListItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import React from "react";
import { jsonToRows } from "@/lib/brsrMapper";
import VirtualTable from "@/components/dashboard/VirtualTable";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Eye, EyeOff } from "lucide-react";

interface Props {
  selectedId: string | null;
  documents: DocumentListItem[] | undefined;
}

export function ConsolidatedTable({ selectedId, documents }: Props) {
  const { data, isLoading } = useConsolidated(true);
  const { toast } = useToast();
  const [combinedRows, setCombinedRows] = React.useState<Record<string, any>[]>([]);
  const [loadingDocs, setLoadingDocs] = React.useState(false);
  const docFirstRowIndex = React.useRef<Record<string, number>>({});
  const rowRefs = React.useRef<Record<string, HTMLTableRowElement | null>>({});

  React.useEffect(() => {
    let mounted = true;
    async function loadAll() {
      if (!documents || documents.length === 0) {
        setCombinedRows([]);
        return;
      }
      setLoadingDocs(true);
      const all: Record<string, any>[] = [];
      const firstIndexMap: Record<string, number> = {};

      for (const doc of documents) {
        try {
          const detail = await backend.getDocument(doc.id);
          const extracted = detail.extracted_json || {};
          const rows = jsonToRows(extracted);
          // annotate rows with doc metadata and push
          const startIndex = all.length;
          firstIndexMap[doc.id] = startIndex;
          for (const r of rows) {
            const name = doc.file_name && doc.file_name.length > 20 ? `${doc.file_name.slice(0, 20)}…` : doc.file_name;
            all.push({ __docId: doc.id, __fileName: name, ...r });
          }
        } catch (e) {
          // skip if error
        }
      }

      if (!mounted) return;
      docFirstRowIndex.current = firstIndexMap;
      setCombinedRows(all);
      setLoadingDocs(false);
    }

    loadAll();
    return () => {
      mounted = false;
    };
  }, [documents]);

  // scroll to selected document when it changes
  React.useEffect(() => {
    if (!selectedId) return;
    const ref = rowRefs.current[selectedId];
    if (ref && typeof ref.scrollIntoView === "function") {
      ref.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [selectedId]);

  const [visibleCols, setVisibleCols] = React.useState<string[] | null>(null);
  const [colOrder, setColOrder] = React.useState<string[] | null>(null);
  const [expandedDocs, setExpandedDocs] = React.useState<Record<string, boolean>>({});
  const [scrollToIndex, setScrollToIndex] = React.useState<number | null>(null);
  const scrollRef = React.useRef<HTMLDivElement | null>(null);

  const filteredData = combinedRows;

  // derive base columns (excluding internal keys)
  const baseColumns = (() => {
    if (!filteredData || filteredData.length === 0) return [] as string[];
    return Object.keys(filteredData[0]).filter((k) => !k.startsWith("__"));
  })();

  // initialize visible columns and order
  React.useEffect(() => {
    if (!visibleCols && baseColumns.length) setVisibleCols(baseColumns.slice());
    if (!colOrder && baseColumns.length) setColOrder(baseColumns.slice());
  }, [baseColumns, visibleCols, colOrder]);

  // Build grouped rows with headers and expand/collapse
  const computeGrouping = () => {
    const rows: Record<string, any>[] = [];
    const map: Record<string, number> = {};
    if (!documents || documents.length === 0) return { groupedRows: rows, groupIndexMap: map };

    // preserve order of `documents` list
    for (const doc of documents) {
      const docRows = filteredData.filter((r) => r.__docId === doc.id);
      const idx = rows.length;
      map[doc.id] = idx;

      // group header row
      const isExpanded = expandedDocs[doc.id] ?? true;
      const headerName = doc.file_name && doc.file_name.length > 20 ? `${doc.file_name.slice(0, 20)}…` : doc.file_name;
      rows.push({ __isGroupHeader: true, __docId: doc.id, __docLabel: (
        <div className="flex items-center gap-3">
          <button
            className="p-1 rounded hover:bg-muted"
            onClick={(e) => { e.stopPropagation(); setExpandedDocs((s) => ({ ...s, [doc.id]: !isExpanded })); }}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          <div className="min-w-0">
            <div className="text-sm font-medium truncate">{headerName}</div>
            <div className="text-xs text-muted-foreground">{doc.created_at ? new Date(doc.created_at).toLocaleString() : ''}</div>
          </div>
        </div>
      ) });

      if (isExpanded) {
        const label = doc.file_name && doc.file_name.length > 20 ? `${doc.file_name.slice(0, 20)}…` : doc.file_name;
        for (const r of docRows) {
          rows.push({ ...r, __docLabel: label });
        }
      }
    }

    return { groupedRows: rows, groupIndexMap: map };
  };

  const { groupedRows, groupIndexMap } = computeGrouping();

  // scroll to group header when selectedId changes
  React.useEffect(() => {
    if (!selectedId) return;
    const idx = groupIndexMap[selectedId];
    if (typeof idx === "number") {
      setScrollToIndex(idx);
      // clear after 1s
      const t = setTimeout(() => setScrollToIndex(null), 1000);
      return () => clearTimeout(t);
    }
  }, [selectedId, groupIndexMap]);

  const handleDownload = async () => {
    try {
      const ids = selectedId ? [selectedId] : (documents ?? []).map((d) => d.id);
      const blob = await backend.requestExcel(ids);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "brsr_consolidated.csv";
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Download started" });
    } catch {
      toast({ title: "Download failed", variant: "destructive" });
    }
  };

  if (isLoading || loadingDocs) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-40" />
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
      </div>
    );
  }

  if (!filteredData || filteredData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-muted-foreground text-sm">No consolidated data available</p>
      </div>
    );
  }

  const columns = ["Document", ...(colOrder ?? baseColumns)];
 

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">
          {selectedId ? documents?.find((d) => d.id === selectedId)?.file_name : "All Companies"} — Master Table
        </h2>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleDownload} className="gap-1.5">
            <Download className="h-3.5 w-3.5" />
            Download Excel
          </Button>
        </div>
      </div>
      {/* Sticky header + virtualized body (shared horizontal scroller) */}
      <div className="rounded-lg border bg-card">
        <div ref={scrollRef} className="overflow-auto" style={{ maxHeight: 'calc(100vh - 260px)' }}>
          <div className="sticky top-0 z-20 bg-card border-b">
            <div className="flex items-center">
              <div className="flex-shrink-0 px-4 py-3 min-w-[220px] border-r">Document</div>
              <div className="flex-1 grid" style={{ gridTemplateColumns: (visibleCols ?? (colOrder ?? baseColumns)).map(() => '160px').join(' '), minWidth: `${(visibleCols ?? (colOrder ?? baseColumns)).length * 160}px` }}>
                {(visibleCols ?? (colOrder ?? baseColumns)).map((c) => (
                  <div key={c} className="px-4 py-3 text-left font-medium text-muted-foreground truncate border-r last:border-r-0">
                    {c}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-0">
            <VirtualTable
              columns={columns}
              rows={groupedRows.map((r) => r)}
              rowHeight={44}
              stickyFirst
              visibleColumns={(visibleCols ?? (colOrder ?? baseColumns))}
              scrollToIndex={scrollToIndex}
              scrollContainerRef={scrollRef}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
