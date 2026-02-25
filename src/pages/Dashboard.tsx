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
  const [selectedConsolidatedIds, setSelectedConsolidatedIds] = useState<string[]>([]);

  const {
    data: documents,
    isLoading,
    isFetching: isRefreshingDocuments,
    refetch: refetchDocuments,
  } = useDocuments(activeTab === "upload");
  const { data: allDocs, isLoading: allDocsLoading } = useDocuments(activeTab === "consolidated");

  const previewDoc = documents?.find((d) => d.id === previewId) ?? getStoredDocument(previewId);

  return (
    <div className="surface-gradient flex h-screen overflow-hidden">
      <DashboardSidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="flex-1 overflow-auto">
        {activeTab === "upload" ? (
          <div className="p-8 max-w-6xl mx-auto">
            <UploadArea />
            <CompanyTable
              documents={documents}
              isLoading={isLoading}
              isRefreshing={isRefreshingDocuments}
              onRefresh={() => {
                void refetchDocuments();
              }}
              onPreview={setPreviewId}
            />
            <PreviewModal
              documentId={previewId}
              documentName={previewDoc?.file_name}
              companyName={previewDoc?.extracted_json?.name ?? previewDoc?.extracted_json?.entity_details?.name}
              financialYear={previewDoc?.extracted_json?.entity_details?.financial_year}
              onClose={() => setPreviewId(null)}
            />
          </div>
        ) : (
          <div className="flex h-full">
            {/* Left column - PDF list */}
            <div className="w-80 border-r border-border/70 bg-card/70 backdrop-blur-sm p-5 overflow-auto shrink-0 scrollbar-thin">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.16em] mb-4">Documents</h2>
              <PdfList
                documents={allDocs?.filter((doc) => doc.status !== "failed") ?? []}
                isLoading={allDocsLoading}
                selectedIds={selectedConsolidatedIds}
                onChange={setSelectedConsolidatedIds}
              />
            </div>

            {/* Right column - Master table */}
            <div className="flex-1 p-8 overflow-auto">
              <ConsolidatedTable selectedIds={selectedConsolidatedIds} documents={allDocs?.filter((doc) => doc.status !== "failed") ?? []} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
