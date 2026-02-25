import { useState } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { UploadArea } from "@/components/dashboard/UploadArea";
import { CompanyTable } from "@/components/dashboard/CompanyTable";
import { PreviewModal } from "@/components/dashboard/PreviewModal";
import { PdfList } from "@/components/dashboard/PdfList";
import { ConsolidatedTable } from "@/components/dashboard/ConsolidatedTable";
import { useDocuments } from "@/hooks/use-documents";
import { getStoredDocument } from "@/lib/document-store";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<"upload" | "consolidated">("upload");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [selectedConsolidatedId, setSelectedConsolidatedId] = useState<string | null>(null);

  const { data: documents, isLoading } = useDocuments(activeTab === "upload");
  const { data: allDocs, isLoading: allDocsLoading } = useDocuments(activeTab === "consolidated");

  const previewDoc = documents?.find((d) => d.id === previewId) ?? getStoredDocument(previewId);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <DashboardSidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="flex-1 overflow-auto">
        {activeTab === "upload" ? (
          <div className="p-6 max-w-5xl mx-auto">
            <UploadArea />
            <CompanyTable documents={documents} isLoading={isLoading} onPreview={setPreviewId} />
            <PreviewModal documentId={previewId} documentName={previewDoc?.file_name} onClose={() => setPreviewId(null)} />
          </div>
        ) : (
          <div className="flex h-full">
            {/* Left column - PDF list */}
            <div className="w-72 border-r bg-card p-4 overflow-auto shrink-0 scrollbar-thin">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Documents</h2>
              <PdfList
                documents={allDocs}
                isLoading={allDocsLoading}
                selectedId={selectedConsolidatedId}
                onSelect={setSelectedConsolidatedId}
              />
            </div>

            {/* Right column - Master table */}
            <div className="flex-1 p-6 overflow-auto">
              <ConsolidatedTable selectedId={selectedConsolidatedId} documents={allDocs} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
