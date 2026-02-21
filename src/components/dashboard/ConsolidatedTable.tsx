import { useConsolidated } from "@/hooks/use-documents";
import { mockApi, BRSRDocument } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface Props {
  selectedId: string | null;
  documents: BRSRDocument[] | undefined;
}

export function ConsolidatedTable({ selectedId, documents }: Props) {
  const { data, isLoading } = useConsolidated(true);
  const { toast } = useToast();

  const filteredData = selectedId
    ? data?.filter((r) => {
        const doc = documents?.find((d) => d.id === selectedId);
        return doc ? r.company === doc.name : true;
      })
    : data;

  const handleDownload = async () => {
    try {
      const blob = await mockApi.downloadConsolidated();
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

  if (isLoading) {
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

  const columns = Object.keys(filteredData[0]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">
          {selectedId ? documents?.find((d) => d.id === selectedId)?.name : "All Companies"} — Master Table
        </h2>
        <Button variant="outline" size="sm" onClick={handleDownload} className="gap-1.5">
          <Download className="h-3.5 w-3.5" />
          Download Excel
        </Button>
      </div>

      <div className="overflow-auto rounded-lg border bg-card max-h-[calc(100vh-220px)] scrollbar-thin">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="border-b bg-muted/80 backdrop-blur">
              {columns.map((col) => (
                <th key={col} className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.map((row, i) => (
              <tr key={i} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                {columns.map((col) => (
                  <td key={col} className="px-4 py-3 whitespace-nowrap text-foreground">
                    {typeof row[col] === "number" ? row[col].toLocaleString() : String(row[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
