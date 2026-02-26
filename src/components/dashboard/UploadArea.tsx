import { Upload, FileText, X, Loader2 } from "lucide-react";
import { useCallback, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useUpload } from "@/hooks/use-documents";
import { useToast } from "@/hooks/use-toast";

export function UploadArea() {
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const upload = useUpload();
  const { toast } = useToast();

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const pdfs = Array.from(incoming).filter((f) => f.type === "application/pdf");
    if (pdfs.length === 0) {
      toast({ title: "Invalid file type", description: "Only PDF files are accepted.", variant: "destructive" });
      return;
    }
    setFiles((prev) => [...prev, ...pdfs]);
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  }, [addFiles]);

  const handleUpload = async () => {
    if (files.length === 0) return;
    try {
      const result = await upload.mutateAsync({ files, onUpdate: () => {} });
      const uploadedCount = Array.isArray(result?.uploadedIds) ? result.uploadedIds.length : 0;
      const duplicateFiles = Array.isArray(result?.skippedDuplicates) ? result.skippedDuplicates : [];

      if (uploadedCount > 0) {
        const duplicateText = duplicateFiles.length > 0
          ? ` ${duplicateFiles.length} duplicate file(s) skipped.`
          : "";
        toast({
          title: "Upload completed",
          description: `${uploadedCount} file(s) uploaded. Processing started.${duplicateText}`,
        });
      } else if (duplicateFiles.length > 0) {
        toast({
          title: "Duplicate files skipped",
          description: `${duplicateFiles.length} file(s) already exist and were skipped.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "No files uploaded",
          description: "No valid new PDF files were found.",
          variant: "destructive",
        });
      }

      setFiles([]);
    } catch {
      toast({ title: "Upload failed", description: "Please try again.", variant: "destructive" });
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4 rounded-2xl border border-border/70 bg-card/75 backdrop-blur-sm p-6 shadow-[0_1px_0_hsl(var(--border)),0_8px_24px_hsl(var(--foreground)/0.04)]">
      <div>
        {/* <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Ingestion</p> */}
        <h2 className="text-xl font-semibold text-foreground">Upload BRSR Pdf Reports</h2>
      </div>

      <div
        className={`relative rounded-xl border-2 border-dashed p-9 text-center transition-colors cursor-pointer ${
          dragOver ? "border-upload-border bg-upload-bg/80" : "border-border/80 hover:border-upload-border hover:bg-upload-bg/70"
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf"
          className="hidden"
          onChange={(e) => e.target.files && addFiles(e.target.files)}
        />
        <Upload className="mx-auto h-10 w-10 text-primary" />
        <p className="mt-3 text-sm font-semibold text-foreground">Drop PDF files here</p>
        <p className="text-xs text-muted-foreground tracking-wide">or click to browse from local storage</p>
      </div>

      {files.length > 0 && (
        <div className="space-y-2.5">
          {files.map((f, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border border-border/70 bg-background/70 p-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <span className="text-sm text-foreground truncate max-w-[250px]">{f.name}</span>
                <span className="text-xs text-muted-foreground">({(f.size / 1024).toFixed(0)} KB)</span>
              </div>
              <button onClick={(e) => { e.stopPropagation(); removeFile(i); }} className="text-muted-foreground hover:text-destructive">
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          <Button onClick={handleUpload} disabled={upload.isLoading} className="w-full">
            {upload.isLoading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </span>
            ) : `Upload ${files.length} file(s)`}
          </Button>
        </div>
      )}
    </div>
  );
}
