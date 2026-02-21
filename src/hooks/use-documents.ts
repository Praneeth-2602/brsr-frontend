import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mockApi } from "@/lib/mock-data";

export function useDocuments(enabled = true) {
  return useQuery({
    queryKey: ["documents"],
    queryFn: mockApi.getDocuments,
    enabled,
    refetchInterval: (query) => {
      const docs = query.state.data;
      if (!docs) return 3000;
      const hasProcessing = docs.some((d) => d.status === "processing");
      return hasProcessing ? 3000 : false;
    },
  });
}

export function useUpload() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (files: File[]) => mockApi.upload(files),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}

export function usePreview(id: string | null) {
  return useQuery({
    queryKey: ["preview", id],
    queryFn: () => mockApi.getPreview(id!),
    enabled: !!id,
  });
}

export function useConsolidated(enabled = true) {
  return useQuery({
    queryKey: ["consolidated"],
    queryFn: mockApi.getConsolidated,
    enabled,
  });
}
