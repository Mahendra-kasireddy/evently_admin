import { apiError, type ApiError } from './errors';
import { getAccessToken } from './token';

/**
 * The one HTTP client. Every request in the app goes through it, so the base
 * URL, the bearer header and error normalisation exist in exactly one place.
 *
 * `VITE_API_BASE_URL` has no default and no fallback host. If it is unset the
 * app fails immediately and says so, rather than silently pointing at a
 * plausible-looking URL that only fails in production.
 */
const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').trim().replace(/\/+$/, '');

export function apiBaseUrl(): string {
  return BASE_URL;
}

export function isApiConfigured(): boolean {
  return BASE_URL.length > 0;
}

/** Called on any 401 so the session layer can drop an invalidated session. */
type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  onUnauthorized = handler;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  /** Send this bearer token instead of the stored access token. */
  bearer?: string;
  /** Skip the Authorization header entirely (public endpoints). */
  anonymous?: boolean;
  signal?: AbortSignal;
}

/**
 * Performs one request and resolves to the parsed body, or rejects with an
 * `ApiError`. Never throws a raw fetch/parse error at a caller.
 */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  if (!isApiConfigured()) {
    throw {
      kind: 'unknown',
      status: null,
      message: 'The admin console is not configured. Set VITE_API_BASE_URL and reload.',
    } satisfies ApiError;
  }

  const { method = 'GET', body, bearer, anonymous, signal } = options;
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  if (!anonymous) {
    const token = bearer ?? getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      ...(signal ? { signal } : {}),
    });
  } catch {
    // Transport-level failure: offline, DNS, CORS, aborted.
    throw apiError(null);
  }

  // 204 and other empty bodies are legitimate — logoutUser returns one.
  const text = await response.text();
  let parsed: unknown = undefined;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = undefined;
    }
  }

  if (!response.ok) {
    if (response.status === 401) onUnauthorized?.();
    throw apiError(response.status, parsed);
  }

  return parsed as T;
}
