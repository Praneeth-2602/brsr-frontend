import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { usePreview } from "@/hooks/use-documents";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  documentId: string | null;
  documentName?: string;
  companyName?: string;
  financialYear?: string | number;
  onClose: () => void;
}

export function PreviewModal({ documentId, documentName, companyName, financialYear, onClose }: Props) {
  const { data, isLoading } = usePreview(documentId);

  return (
    <Dialog open={!!documentId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[80vw] h-[80vh] max-w-none max-h-none overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            Preview — {companyName}_({financialYear})
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto scrollbar-thin">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
            </div>
          ) : data && data.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 sticky top-0">
                  {Object.keys(data[0]).map((key) => (
                    <th key={key} className="px-4 py-2.5 text-left font-medium text-muted-foreground whitespace-nowrap">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                    {Object.entries(row).map(([key, val], j) => {
                      const render = (() => {
                        const keyLc = String(key).toLowerCase();
                        const isYear = keyLc.includes("year of incorporation") || keyLc === "3. year of incorporation";
                        if (val == null) return "";
                        if (typeof val === "number") return isYear ? String(val) : val.toLocaleString();
                        if (typeof val === "string") return val;
                        try {
                          const s = JSON.stringify(val);
                          return s.length > 200 ? s.slice(0, 200) + "…" : s;
                        } catch (e) {
                          return String(val);
                        }
                      })();
                      const keyLc = String(key).toLowerCase();
                      const isYear = keyLc.includes("year of incorporation") || keyLc === "3. year of incorporation";
                      const isNumeric = typeof val === "number" && !isYear;

                      return (
                        <td key={j} className={`px-4 py-2.5 whitespace-normal text-foreground max-h-40 overflow-auto break-words ${isNumeric ? "text-right" : "text-left"}`}>
                          {render}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="p-6 text-center text-muted-foreground">No preview data available</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
