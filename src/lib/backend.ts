import api from "./api";
import type {
    DocumentListItem,
    DocumentDetail,
    AuthResponse,
    RegisterRequest,
    LoginRequest,
} from "./types";

export async function listDocuments(): Promise<DocumentListItem[]> {
    const resp = await api.get("/documents");
    return resp.data;
}

export async function getDocument(id: string): Promise<DocumentDetail> {
    const resp = await api.get(`/documents/${id}`);
    return resp.data;
}

export async function uploadFiles(files: File[]) {
    const fd = new FormData();
    files.forEach(f => fd.append("files", f)); // multiple entries named "files"
    const resp = await api.post("/documents/upload/", fd);
    // resp.data.documents is an array of created documents
    return resp.data.documents.map(d => d.document_id);
}

export async function getStatus(documentIds: string[]) {
    const resp = await api.post("/documents/status");
    return resp.data as DocumentListItem[];
}

export async function requestExcel(documentIds: string[]) {
    const resp = await api.post("/documents/excel", { document_ids: documentIds }, { responseType: "blob" });
    return resp.data as Blob;
}

export async function register(body: RegisterRequest) {
    const resp = await api.post("/auth/signup", body);
    return resp.data;
}

export async function login(body: LoginRequest) {
    const resp = await api.post("/auth/login", body);
    return resp; // return full axios response so caller can inspect status/data/token variants
}

export async function uploadAndPoll(
    files: File[],
    onUpdate: (docs: DocumentListItem[]) => void,
    interval = 2000,
): Promise<DocumentListItem[]> {
    const ids = await uploadFiles(files);

    if (!ids || ids.length === 0) return [];

    let last: DocumentListItem[] = [];

    while (true) {
        const docs = await getStatus(ids);
        last = docs;
        try {
            onUpdate(docs);
        } catch (e) {
            // swallow
        }
        const hasProcessing = docs.some((d) => d.status === "processing");
        if (!hasProcessing) break;
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, interval));
    }

    return last;
}

export default {
    listDocuments,
    getDocument,
    uploadFiles,
    getStatus,
    requestExcel,
    uploadAndPoll,
    register,
    login,
};
