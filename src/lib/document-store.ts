import type { DocumentDetail, DocumentListItem } from "./types";

export type StoredDocument = Partial<DocumentDetail> & Partial<DocumentListItem> & {
  id: string;
  extracted_json?: Record<string, any> | null;
};

const docsById = new Map<string, StoredDocument>();
let hydratedFromFirstDocumentsCall = false;

function normalizeId(doc: any): string | null {
  const id = doc?.id ?? doc?._id;
  if (!id) return null;
  return String(id);
}

export function hydrateFromFirstDocumentsCall(docs: any[] | undefined | null) {
  if (hydratedFromFirstDocumentsCall) return;
  hydratedFromFirstDocumentsCall = true;
  upsertDocuments(docs);
}

export function upsertDocuments(docs: any[] | undefined | null) {
  if (!Array.isArray(docs)) return;
  for (const doc of docs) {
    upsertDocument(doc);
  }
}

export function upsertDocument(doc: any) {
  const id = normalizeId(doc);
  if (!id) return;
  const prev = docsById.get(id) ?? { id };
  docsById.set(id, { ...prev, ...doc, id });
}

export function getStoredDocument(id: string | null | undefined): StoredDocument | null {
  if (!id) return null;
  return docsById.get(String(id)) ?? null;
}

export function clearDocumentStore() {
  docsById.clear();
  hydratedFromFirstDocumentsCall = false;
}
