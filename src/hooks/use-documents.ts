import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as backend from "@/lib/backend";
import type { DocumentListItem } from "@/lib/types";
import { jsonToRows } from "@/lib/brsrMapper";
import {
    getStoredDocument,
    hydrateFromFirstDocumentsCall,
    upsertDocument,
    upsertDocuments,
} from "@/lib/document-store";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function normalizeStatus(doc: any): DocumentListItem {
    return {
        ...doc,
        status: doc?.status === "pending" ? "processing" : doc?.status,
    } as DocumentListItem;
}

function mergeById(oldDocs: any, incomingDocs: any[]) {
    const oldArr = Array.isArray(oldDocs) ? oldDocs : [];
    const map = new Map<string, any>();

    for (const d of oldArr) {
        const id = d?.id ?? d?._id;
        if (id) map.set(String(id), d);
    }

    for (const d of incomingDocs) {
        const id = d?.id ?? d?._id;
        if (!id) continue;
        const k = String(id);
        const prev = map.get(k) ?? {};
        map.set(k, { ...prev, ...d, id: k });
    }

    return Array.from(map.values());
}

export function useDocuments(enabled = true) {
    return useQuery({
        queryKey: ["documents"],
        queryFn: async () => {
            const docs = await backend.listDocuments();
            hydrateFromFirstDocumentsCall(docs as any[]);
            upsertDocuments(docs as any[]);
            return docs;
        },
        enabled,
        // No global polling here. Upload flow will poll specific docs and
        // update the cache for those items only.
    });
}

export function useUpload() {
    const qc = useQueryClient();

    return useMutation({
        // Only upload files in the mutation (keeps `isLoading` limited to upload step).
        mutationFn: async ({ files }: { files: File[] }) => {
            const ids = await backend.uploadFiles(files);
            return ids;
        },
        // After upload succeeds, immediately add rows as processing and then poll /documents every 5s.
        onSuccess: (ids: unknown, variables: any) => {
            const uploadedIds = Array.isArray(ids) ? (ids as string[]) : [];
            const { onUpdate, files } = variables || {};

            (async function pollLoop() {
                try {
                    // Add placeholders as soon as upload returns 200.
                    const placeholders = uploadedIds.map((id: string, idx: number) => {
                        const f = Array.isArray(files) ? files[idx] : undefined;
                        return {
                            id,
                            file_name: f ? f.name : `document-${id}`,
                            status: "processing",
                            created_at: new Date().toISOString(),
                            parsed_at: null,
                        } as any;
                    });

                    upsertDocuments(placeholders);
                    qc.setQueryData(["documents"], (old: any) => mergeById(old, placeholders));
                    qc.setQueryData(["consolidated"], (old: any) => mergeById(old, placeholders));

                    try { onUpdate?.(placeholders); } catch (e) { /* swallow */ }

                    if (uploadedIds.length === 0) return;

                    while (true) {
                        const allDocs = await backend.listDocuments();
                        const mapped = (allDocs || []).map(normalizeStatus);

                        upsertDocuments(mapped);
                        qc.setQueryData(["documents"], mapped);
                        qc.setQueryData(["consolidated"], mapped);
                        try { onUpdate?.(mapped); } catch (e) { /* swallow */ }

                        const byId = new Map(mapped.map((d: any) => [String(d.id), d]));
                        const allFinal = uploadedIds.every((id: string) => {
                            const d = byId.get(String(id));
                            return !!d && d.status !== "processing";
                        });
                        if (allFinal) break;

                        // wait 5s between polls
                        // eslint-disable-next-line no-await-in-loop
                        await sleep(5000);
                    }
                } catch (e) {
                    // polling error — stop silently (do not show toast for status errors)
                }
            })();
        },
    });
}

export function usePreview(id: string | null) {
    return useQuery({
        queryKey: ["preview", id],
        queryFn: async () => {
            const cached = getStoredDocument(id);
            if (cached?.extracted_json) {
                return jsonToRows(cached.extracted_json || {});
            }
            const doc = await backend.getDocument(id!);
            upsertDocument(doc as any);
            // `extracted_json` follows the documented BRSR layout. Convert to table rows for preview.
            const rows = jsonToRows(doc.extracted_json || {});
            return rows;
        },
        enabled: !!id,
    });
}

export function useConsolidated(enabled = true) {
    return useQuery({
        queryKey: ["consolidated"],
        queryFn: async () => {
            const docs = await backend.listDocuments();
            hydrateFromFirstDocumentsCall(docs as any[]);
            upsertDocuments(docs as any[]);
            return docs;
        },
        enabled,
    });
}
