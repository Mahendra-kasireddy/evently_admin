/**
 * Turns any failure into something an administrator can act on.
 *
 * Two rules: the `kind` drives behaviour (sign out on 401, stop retrying on
 * 429), and `message` is the only thing rendered. Backend messages are used
 * only where they are already written for end users — the OTP module's
 * "Code has expired" and "Too many attempts — request a new code" are — and
 * never for 5xx, where the body can carry stack traces or internals.
 */
export type ApiErrorKind =
  | 'network'
  | 'validation'
  | 'unauthorized'
  | 'forbidden'
  | 'notFound'
  | 'expired'
  | 'rateLimited'
  | 'server'
  | 'unknown';

export interface ApiError {
  kind: ApiErrorKind;
  status: number | null;
  message: string;
}

/** Statuses whose server-provided message is safe and useful to show. */
const PASS_THROUGH = new Set([400, 401, 403, 404, 409, 410, 429]);

const FALLBACK: Record<ApiErrorKind, string> = {
  network: 'Can’t reach the server. Check your connection and try again.',
  validation: 'Please check what you entered and try again.',
  unauthorized: 'Your session has ended. Please sign in again.',
  forbidden: 'You don’t have permission to do that.',
  notFound: 'That code isn’t valid any more. Request a new one.',
  expired: 'That code has expired. Request a new one.',
  rateLimited: 'Too many attempts. Please wait a moment and try again.',
  server: 'Something went wrong on our side. Please try again shortly.',
  unknown: 'Something went wrong. Please try again.',
};

function kindFor(status: number): ApiErrorKind {
  if (status === 400 || status === 422) return 'validation';
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'notFound';
  if (status === 410) return 'expired';
  if (status === 429) return 'rateLimited';
  if (status >= 500) return 'server';
  return 'unknown';
}

export function apiError(status: number | null, body?: unknown): ApiError {
  if (status === null) {
    return { kind: 'network', status: null, message: FALLBACK.network };
  }
  const kind = kindFor(status);
  let message = FALLBACK[kind];

  if (PASS_THROUGH.has(status) && typeof body === 'object' && body !== null) {
    const raw = (body as { message?: unknown }).message;
    // Nest's ValidationPipe returns `message` as an array of constraint strings.
    const text = Array.isArray(raw)
      ? raw.filter((m): m is string => typeof m === 'string')[0]
      : typeof raw === 'string'
        ? raw
        : undefined;
    if (text && text.length <= 200) message = text;
  }

  return { kind, status, message };
}

export function isApiError(value: unknown): value is ApiError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'kind' in value &&
    'message' in value &&
    typeof (value as ApiError).message === 'string'
  );
}

/** Message for anything thrown, including non-ApiError bugs. */
export function errorMessage(value: unknown): string {
  return isApiError(value) ? value.message : FALLBACK.unknown;
}
