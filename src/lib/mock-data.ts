export type DocumentStatus = "processing" | "completed" | "failed";

export interface BRSRDocument {
  id: string;
  name: string;
  sector: string;
  confidence_score: number;
  status: DocumentStatus;
  error_message?: string;
  uploaded_at: string;
}

export interface PreviewRow {
  [key: string]: string | number;
}

export interface ConsolidatedRow {
  company: string;
  sector: string;
  [key: string]: string | number;
}

// --- Mock Data for Demo ---
const MOCK_DOCUMENTS: BRSRDocument[] = [
  { id: "1", name: "Tata Steel Ltd", sector: "Metals & Mining", confidence_score: 0.94, status: "completed", uploaded_at: "2026-02-20T10:00:00Z" },
  { id: "2", name: "Infosys Ltd", sector: "Information Technology", confidence_score: 0.89, status: "completed", uploaded_at: "2026-02-20T10:01:00Z" },
  { id: "3", name: "Reliance Industries", sector: "Oil & Gas", confidence_score: 0.91, status: "completed", uploaded_at: "2026-02-20T10:02:00Z" },
  { id: "4", name: "HDFC Bank", sector: "Financial Services", confidence_score: 0.87, status: "completed", uploaded_at: "2026-02-20T10:03:00Z" },
  { id: "5", name: "Wipro Ltd", sector: "Information Technology", confidence_score: 0.85, status: "completed", uploaded_at: "2026-02-20T10:04:00Z" },
];

const MOCK_PREVIEW: PreviewRow[] = [
  { "Metric": "Energy Consumption (GJ)", "FY 2024": 45200, "FY 2023": 43100, "Change (%)": 4.87 },
  { "Metric": "Water Withdrawal (KL)", "FY 2024": 12300, "FY 2023": 11800, "Change (%)": 4.24 },
  { "Metric": "GHG Emissions Scope 1 (tCO2e)", "FY 2024": 8900, "FY 2023": 9200, "Change (%)": -3.26 },
  { "Metric": "GHG Emissions Scope 2 (tCO2e)", "FY 2024": 3400, "FY 2023": 3600, "Change (%)": -5.56 },
  { "Metric": "Waste Generated (MT)", "FY 2024": 1500, "FY 2023": 1650, "Change (%)": -9.09 },
  { "Metric": "Employee Training Hours", "FY 2024": 24000, "FY 2023": 21000, "Change (%)": 14.29 },
  { "Metric": "Women in Workforce (%)", "FY 2024": 28.5, "FY 2023": 26.1, "Change (%)": 9.20 },
  { "Metric": "CSR Spend (₹ Cr)", "FY 2024": 45.2, "FY 2023": 38.7, "Change (%)": 16.80 },
];

const MOCK_CONSOLIDATED: ConsolidatedRow[] = [
  { company: "Tata Steel Ltd", sector: "Metals & Mining", "Energy (GJ)": 45200, "Water (KL)": 12300, "GHG Scope 1": 8900, "GHG Scope 2": 3400, "Waste (MT)": 1500 },
  { company: "Infosys Ltd", sector: "IT", "Energy (GJ)": 18400, "Water (KL)": 5600, "GHG Scope 1": 2100, "GHG Scope 2": 4800, "Waste (MT)": 320 },
  { company: "Reliance Industries", sector: "Oil & Gas", "Energy (GJ)": 92000, "Water (KL)": 34500, "GHG Scope 1": 28000, "GHG Scope 2": 8900, "Waste (MT)": 4200 },
  { company: "HDFC Bank", sector: "Financial Services", "Energy (GJ)": 8900, "Water (KL)": 2100, "GHG Scope 1": 450, "GHG Scope 2": 3200, "Waste (MT)": 180 },
  { company: "Wipro Ltd", sector: "IT", "Energy (GJ)": 15200, "Water (KL)": 4800, "GHG Scope 1": 1800, "GHG Scope 2": 4100, "Waste (MT)": 280 },
];

let uploadedDocs: BRSRDocument[] = [];
let uploadCounter = 100;

function simulateProcessing(doc: BRSRDocument) {
  setTimeout(() => {
    doc.status = Math.random() > 0.15 ? "completed" : "failed";
    if (doc.status === "failed") doc.error_message = "Unable to parse section headers in PDF";
    doc.confidence_score = parseFloat((0.75 + Math.random() * 0.2).toFixed(2));
  }, 3000 + Math.random() * 5000);
}

export const mockApi = {
  login: async (email: string, _password: string) => {
    await delay(800);
    return { token: "demo_jwt_" + btoa(email), user: { email } };
  },

  signup: async (_email: string, _password: string) => {
    await delay(800);
    return { message: "Account created" };
  },

  upload: async (files: File[]) => {
    await delay(1500);
    const newDocs: BRSRDocument[] = files.map((f) => {
      uploadCounter++;
      const doc: BRSRDocument = {
        id: String(uploadCounter),
        name: f.name.replace(".pdf", ""),
        sector: ["Metals & Mining", "IT", "Oil & Gas", "Financial Services", "Pharma"][Math.floor(Math.random() * 5)],
        confidence_score: 0,
        status: "processing",
        uploaded_at: new Date().toISOString(),
      };
      simulateProcessing(doc);
      return doc;
    });
    uploadedDocs = [...uploadedDocs, ...newDocs];
    return newDocs;
  },

  getDocuments: async (): Promise<BRSRDocument[]> => {
    await delay(300);
    return [...MOCK_DOCUMENTS, ...uploadedDocs];
  },

  getPreview: async (_id: string): Promise<PreviewRow[]> => {
    await delay(600);
    return MOCK_PREVIEW;
  },

  getConsolidated: async (): Promise<ConsolidatedRow[]> => {
    await delay(500);
    return MOCK_CONSOLIDATED;
  },

  downloadConsolidated: async () => {
    await delay(800);
    // Create a simple CSV blob for demo
    const headers = Object.keys(MOCK_CONSOLIDATED[0]);
    const csv = [
      headers.join(","),
      ...MOCK_CONSOLIDATED.map((r) => headers.map((h) => r[h]).join(",")),
    ].join("\n");
    return new Blob([csv], { type: "text/csv" });
  },
};

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
