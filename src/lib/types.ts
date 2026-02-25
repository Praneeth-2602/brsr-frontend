export type DocumentStatus = "processing" | "completed" | "failed";

export interface DocumentListItem {
  id: string;
  file_name: string;
  status: DocumentStatus;
  extracted_json?: Record<string, any> | null;
  created_at: string; // ISO string
  parsed_at?: string | null;
  error_message?: string | null;
}

export interface DocumentDetail {
  id: string;
  file_name: string;
  status: DocumentStatus;
  extracted_json?: Record<string, any> | null;
  error_message?: string | null;
  created_at: string;
  parsed_at?: string | null;
}

export interface ExcelRequest {
  document_ids: string[];
}

export interface DocumentStatusRequest {
  document_ids: string[];
}

export interface AuthResponse {
  token: string;
  email?: string;
  user?: Record<string, any>;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}
