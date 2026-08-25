/**
 * What step 1 hands to step 2, carried in the router's location state.
 *
 * Router state and nothing else: the challenge is in flight for a few minutes
 * and is not part of a session, so it never touches sessionStorage or
 * localStorage. Reloading /verify-otp therefore drops it — and the step sends
 * the user back to /login rather than pretending it still has a request.
 *
 * The OTP code itself is never held here. `sendOtp` returns `devCode` outside
 * production; this console deliberately discards it so a real code is never
 * rendered or kept in client memory.
 */
export interface OtpHandoff {
  requestId: string;
  /** The digits the admin typed, so "Change number" can prefill and resend. */
  mobile: string;
  /** Masked destination from the API, e.g. "••••••3210". */
  sentTo: string;
}

export function isOtpHandoff(value: unknown): value is OtpHandoff {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.requestId === 'string' && v.requestId.length > 0 && typeof v.mobile === 'string';
}
