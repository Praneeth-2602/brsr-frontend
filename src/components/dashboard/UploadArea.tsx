import { Upload, FileText, X } from "lucide-react";
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
      await upload.mutateAsync(files);
      toast({ title: "Upload successful", description: `${files.length} file(s) uploaded. Processing started.` });
      setFiles([]);
    } catch {
      toast({ title: "Upload failed", description: "Please try again.", variant: "destructive" });
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Upload BRSR Reports</h2>

      <div
        className={`relative rounded-lg border-2 border-dashed p-8 text-center transition-colors cursor-pointer ${
          dragOver ? "border-upload-border bg-upload-bg" : "border-border hover:border-upload-border hover:bg-upload-bg"
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
        <Upload className="mx-auto h-10 w-10 text-muted-foreground" />
        <p className="mt-2 text-sm font-medium text-foreground">Drag & drop PDF files here</p>
        <p className="text-xs text-muted-foreground">or click to browse</p>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((f, i) => (
            <div key={i} className="flex items-center justify-between rounded-md border bg-card p-2.5">
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
          <Button onClick={handleUpload} disabled={upload.isPending} className="w-full">
            {upload.isPending ? "Uploading..." : `Upload ${files.length} file(s)`}
          </Button>
        </div>
      )}
    </div>
  );
}
