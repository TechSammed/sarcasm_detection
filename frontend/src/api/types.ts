// ── API Types (mirrors backend schemas exactly) ──────────────────────

export interface PredictRequest {
  text: string;
  context?: string | null;
  source: 'text' | 'voice';
}

export interface PredictResponse {
  is_sarcastic?: boolean;
  label?: string;
  confidence: number;
  explanation?: string;
  reason?: string;
  sarcasm_type?: string;
  markers?: string[];
  literal_meaning?: string;
  intended_meaning?: string;
  provider: string;
  source: string;
  latency_ms: number;
}

export interface ExampleItem {
  text: string;
  context?: string | null;
  expected_label: string;
}

export interface HealthResponse {
  status: string;
  provider: string;
}

export interface ApiError {
  detail: string;
}

// ── History ──────────────────────────────────────────────────────────

export interface HistoryEntry {
  id: string;
  text: string;
  context?: string | null;
  result: PredictResponse;
  timestamp: number;
}
