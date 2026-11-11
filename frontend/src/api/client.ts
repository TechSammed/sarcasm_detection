import type { PredictRequest, PredictResponse, ExampleItem, HealthResponse, ApiError } from './types';

const BASE = import.meta.env.VITE_API_URL || '';

// ── Error classes ────────────────────────────────────────────────────

export class ApiRequestError extends Error {
  constructor(
    public status: number,
    public detail: string,
    public retryAfter?: number,
  ) {
    super(detail);
    this.name = 'ApiRequestError';
  }
}

// ── Helpers ──────────────────────────────────────────────────────────

async function request<T>(
  path: string,
  options: RequestInit = {},
  signal?: AbortSignal,
): Promise<T> {
  const url = `${BASE}${path}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  // Merge caller signal with our timeout signal
  const mergedSignal = signal
    ? composeAbortSignals(signal, controller.signal)
    : controller.signal;

  try {
    const res = await fetch(url, {
      ...options,
      signal: mergedSignal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!res.ok) {
      let detail = `Request failed (${res.status})`;
      let retryAfter: number | undefined;

      try {
        const body = (await res.json()) as ApiError;
        detail = body.detail || detail;
      } catch {
        // body wasn't JSON
      }

      if (res.status === 429) {
        const ra = res.headers.get('Retry-After');
        retryAfter = ra ? parseInt(ra, 10) : 30;
      }

      throw new ApiRequestError(res.status, detail, retryAfter);
    }

    return (await res.json()) as T;
  } catch (err) {
    if (err instanceof ApiRequestError) throw err;
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ApiRequestError(0, 'Request timed out or was cancelled.');
    }
    throw new ApiRequestError(0, 'Network error. Check your connection.');
  } finally {
    clearTimeout(timeout);
  }
}

function composeAbortSignals(a: AbortSignal, b: AbortSignal): AbortSignal {
  const controller = new AbortController();
  const onAbort = () => controller.abort();
  a.addEventListener('abort', onAbort);
  b.addEventListener('abort', onAbort);
  if (a.aborted || b.aborted) controller.abort();
  return controller.signal;
}

// ── Public API ───────────────────────────────────────────────────────

export async function predict(
  body: PredictRequest,
  signal?: AbortSignal,
): Promise<PredictResponse> {
  return request<PredictResponse>('/api/predict', {
    method: 'POST',
    body: JSON.stringify(body),
  }, signal);
}

export async function getExamples(signal?: AbortSignal): Promise<ExampleItem[]> {
  return request<ExampleItem[]>('/api/examples', {}, signal);
}

export async function getHealth(signal?: AbortSignal): Promise<HealthResponse> {
  return request<HealthResponse>('/api/health', {}, signal);
}

// ── User-friendly error messages ─────────────────────────────────────

export function friendlyError(err: unknown): string {
  if (err instanceof ApiRequestError) {
    switch (err.status) {
      case 0:
        return err.detail; // network / timeout
      case 422:
        return err.detail;
      case 429:
        return `Too many requests. Please wait ${err.retryAfter ?? 30} seconds.`;
      case 502:
        return 'The analysis service is temporarily unavailable. Please retry.';
      case 504:
        return 'The request timed out. Please try a shorter text or retry.';
      default:
        return err.detail;
    }
  }
  return 'Something went wrong. Please try again.';
}
