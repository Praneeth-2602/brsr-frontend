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
import { ChevronUp, ChevronDown } from "lucide-react";

interface Props {
  selectedIds: string[];
  documents: DocumentListItem[] | undefined;
}

export function ConsolidatedTable({ selectedIds, documents }: Props) {
  const { isLoading } = useConsolidated(true);
  const { toast } = useToast();
  const [combinedRows, setCombinedRows] = React.useState<Record<string, any>[]>([]);
  const [loadingDocs, setLoadingDocs] = React.useState(false);

  const sortedDocuments = React.useMemo(() => {
    const all = [...(documents ?? [])]
      .filter((d) => (String(d?.status ?? "")).toLowerCase() !== "failed")
      .sort((a, b) => {
        const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
        return bTime - aTime;
      });

    if (selectedIds && selectedIds.length > 0) {
      const set = new Set(selectedIds);
      return all.filter((d) => set.has(d.id));
    }
    return all;
  }, [documents, selectedIds]);

  React.useEffect(() => {
    let mounted = true;
    async function loadAll() {
      if (sortedDocuments.length === 0) {
        setCombinedRows([]);
        return;
      }
      setLoadingDocs(true);
      const all: Record<string, any>[] = [];

      // Use the provided documents list (from /documents) and avoid fetching each document detail.
      for (const doc of sortedDocuments) {
        try {
          const extracted = (doc as any).extracted_json || {};
          const sector = extracted?.entity_details?.sector || extracted?.entity_details?.name;
          const rows = jsonToRows(extracted);

          for (const r of rows) {
            const name = doc.file_name && doc.file_name.length > 20 ? `${doc.file_name.slice(0, 20)}…` : doc.file_name;
            all.push({ __docId: doc.id, __fileName: name, __sector: sector, ...r });
          }
        } catch (e) {
          // skip if error parsing
        }
      }

      if (!mounted) return;
      setCombinedRows(all);
      setLoadingDocs(false);
    }

    loadAll();
    return () => {
      mounted = false;
    };
  }, [sortedDocuments]);

  const [visibleCols, setVisibleCols] = React.useState<string[] | null>(null);
  const [colOrder, setColOrder] = React.useState<string[] | null>(null);
  const [expandedDocs, setExpandedDocs] = React.useState<Record<string, boolean>>({});
  const [scrollToIndex, setScrollToIndex] = React.useState<number | null>(null);

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

  // columns and widths (hooks moved above early returns to preserve hook order)
  const columns = colOrder ?? baseColumns;
  const displayColumns = visibleCols ?? columns;
  const columnWidths = React.useMemo(() => {
    if (!displayColumns.length) return [] as number[];
    const minWidth = 140;
    const maxWidth = 320;
    const sample = filteredData.slice(0, 250);

    return displayColumns.map((col) => {
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
  }, [displayColumns, filteredData]);

  // Build grouped rows with expand/collapse on first row of each company
  const { groupedRows, groupIndexMap } = React.useMemo(() => {
    const rows: Record<string, any>[] = [];
    const map: Record<string, number> = {};
    if (!sortedDocuments.length) return { groupedRows: rows, groupIndexMap: map };

    const activeCols = visibleCols ?? (colOrder ?? baseColumns);
    const firstCol = activeCols[0];
    const sectorCol = activeCols.find((c) => String(c).toLowerCase().includes("sector"));

    for (const doc of sortedDocuments) {
      const docRows = filteredData.filter((r) => r.__docId === doc.id);
      if (!docRows.length) continue;

      map[doc.id] = rows.length;
      const isExpanded = expandedDocs[doc.id] ?? true;

      docRows.forEach((r, index) => {
        if (index === 0) {
          const sectorValue = sectorCol ? (r[sectorCol] ?? r.__sector ?? "") : (r.__sector ?? "");
          const firstCellValue = firstCol
            ? (String(firstCol).toLowerCase().includes("sector") ? (r[firstCol] ?? r.__sector ?? "") : r[firstCol])
            : "";
          rows.push({
            ...r,
            ...(firstCol
              ? {
                [firstCol]: (
                  <div className="flex items-center gap-2 min-w-0">
                    <button
                      className="p-1 rounded hover:bg-muted"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedDocs((s) => ({ ...s, [doc.id]: !isExpanded }));
                      }}
                      aria-label={isExpanded ? "Collapse company rows" : "Expand company rows"}
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                    <span className="truncate">{String(String(firstCol).toLowerCase().includes("sector") ? firstCellValue : sectorValue)}</span>
                  </div>
                ),
              }
              : {}),
          });
          return;
        }

        if (isExpanded) rows.push({ ...r });
      });
    }

    return { groupedRows: rows, groupIndexMap: map };
  }, [sortedDocuments, filteredData, expandedDocs, visibleCols, colOrder, baseColumns]);

  // No merged-cell approximation: show grouped rows directly and let cells wrap/scroll.

  // scroll to group header when a single selectedId is provided
  React.useEffect(() => {
    if (!selectedIds || selectedIds.length !== 1) return;
    const idx = groupIndexMap[selectedIds[0]];
    if (typeof idx === "number") {
      setScrollToIndex(idx);
      // clear after 1s
      const t = setTimeout(() => setScrollToIndex(null), 1000);
      return () => clearTimeout(t);
    }
  }, [selectedIds, groupIndexMap]);

  const handleDownload = async () => {
    try {
      const ids = selectedIds && selectedIds.length > 0 ? selectedIds : sortedDocuments.map((d) => d.id);
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

  // const columns = colOrder ?? baseColumns;
  // const displayColumns = visibleCols ?? columns;
  // const columnWidths = React.useMemo(() => {
  //   if (!displayColumns.length) return [] as number[];
  //   const minWidth = 140;
  //   const maxWidth = 240;
  //   const sample = filteredData.slice(0, 250);

  //   return displayColumns.map((col) => {
  //     const headerLen = String(col).length;
  //     let maxLen = headerLen;
  //     for (const row of sample) {
  //       const v = row[col];
  //       if (v == null) continue;
  //       if (React.isValidElement(v)) {
  //         maxLen = Math.max(maxLen, 18);
  //         continue;
  //       }
  //       const s = typeof v === "string" ? v : JSON.stringify(v);
  //       maxLen = Math.max(maxLen, s.length);
  //     }
  //     const estimated = 52 + Math.min(maxLen, 32) * 5.6;
  //     return Math.max(minWidth, Math.min(maxWidth, Math.round(estimated)));
  //   });
  // }, [displayColumns, filteredData]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">
          {selectedIds && selectedIds.length === 1
            ? documents?.find((d) => d.id === selectedIds[0])?.file_name
            : selectedIds && selectedIds.length > 1
              ? `${selectedIds.length} Selected Companies`
              : "All Companies"} — Master Table
        </h2>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleDownload} className="gap-1.5 border-border/80 bg-background/70">
            <Download className="h-3.5 w-3.5" />
            Download Excel
          </Button>
        </div>
      </div>
      <div className="rounded-xl border border-border/70 bg-card/80 backdrop-blur-sm">
        <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 260px)' }}>
          <div className="p-0">
            <VirtualTable
              columns={columns}
              rows={groupedRows}
              rowHeight={64}
              stickyFirst
              visibleColumns={displayColumns}
              columnWidths={columnWidths}
              showLeadingColumn={false}
              stickyColumnCount={3}
              scrollToIndex={scrollToIndex}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
