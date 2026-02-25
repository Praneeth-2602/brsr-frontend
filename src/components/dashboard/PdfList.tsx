import type { DocumentListItem } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText } from "lucide-react";
import { useMemo, useState } from "react";

interface Props {
  documents: DocumentListItem[] | undefined;
  isLoading: boolean;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export function PdfList({ documents, isLoading, selectedIds, onChange }: Props) {
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [sectorFilter, setSectorFilter] = useState<string>("all");

  const yearOptions = useMemo(() => {
    const years = new Set<string>();
    (documents ?? []).forEach((doc) => {
      const y = (doc as any)?.extracted_json?.entity_details?.financial_year;
      if (y && String(y).trim()) years.add(String(y).trim());
    });
    return Array.from(years).sort((a, b) => a.localeCompare(b));
  }, [documents]);

  const sectorOptions = useMemo(() => {
    const sectors = new Set<string>();
    (documents ?? []).forEach((doc) => {
      const s = (doc as any)?.extracted_json?.entity_details?.sector;
      if (s && String(s).trim()) sectors.add(String(s).trim());
    });
    return Array.from(sectors).sort((a, b) => a.localeCompare(b));
  }, [documents]);

  const filteredDocuments = useMemo(() => {
    return (documents ?? []).filter((doc) => {
      const year = String((doc as any)?.extracted_json?.entity_details?.financial_year ?? "").trim();
      const sector = String((doc as any)?.extracted_json?.entity_details?.sector ?? "").trim();
      const matchYear = yearFilter === "all" || year === yearFilter;
      const matchSector = sectorFilter === "all" || sector === sectorFilter;
      return matchYear && matchSector;
    });
  }, [documents, yearFilter, sectorFilter]);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-1 gap-2 mb-2">
        <select
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
          className="h-9 rounded-md border border-border bg-background px-2.5 text-xs text-foreground"
        >
          <option value="all">All Financial Years</option>
          {yearOptions.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
        <select
          value={sectorFilter}
          onChange={(e) => setSectorFilter(e.target.value)}
          className="h-9 rounded-md border border-border bg-background px-2.5 text-xs text-foreground"
        >
          <option value="all">All Sectors</option>
          {sectorOptions.map((sector) => (
            <option key={sector} value={sector}>
              {sector}
            </option>
          ))}
        </select>
      </div>

      {/* All Companies option */}
      <button
        onClick={() => onChange([])}
        className={`w-full rounded-lg px-3.5 py-3 text-left transition-colors ${
          selectedIds.length === 0 ? "bg-primary/10 border border-primary/25 shadow-sm" : "border border-transparent hover:bg-muted/60"
        }`}
      >
        <p className="text-sm font-semibold text-foreground">All Companies</p>
        <p className="text-xs text-muted-foreground">Consolidated view</p>
      </button>

      {filteredDocuments.map((doc) => {
        const checked = selectedIds.includes(doc.id);
        return (
          <label
            key={doc.id}
            className={`w-full flex items-center gap-3 rounded-lg px-3.5 py-3 transition-colors cursor-pointer ${
              checked ? "bg-primary/10 border border-primary/25 shadow-sm" : "border border-transparent hover:bg-muted/60"
            }`}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => {
                e.stopPropagation();
                const next = e.currentTarget.checked ? [...selectedIds, doc.id] : selectedIds.filter((id) => id !== doc.id);
                onChange(next);
              }}
              className="h-4 w-4 text-primary rounded"
            />
            <div className="flex items-start justify-between gap-2 w-full">
              <div className="flex items-start gap-2 min-w-0">
                <FileText className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{doc.extracted_json?.entity_details.name}</p>
                  {/* <p className="text-xs text-muted-foreground">{new Date(doc.created_at).toLocaleString()}</p> */}
                </div>
              </div>
            </div>
          </label>
        );
      })}
    </div>
  );
}
