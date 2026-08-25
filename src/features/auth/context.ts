import { createContext } from 'react';
import type { AdminUser, OtpChallenge } from './types';

/**
 * `restoring` — a stored token is being checked against the backend. The router
 *   must render nothing decisive until this resolves, or a refresh would bounce
 *   an admin to /login for a frame.
 * `anonymous` — no usable session.
 * `authenticated` — signed in AND carrying the admin role. There is no
 *   "signed in but not admin" resting state: that user is signed out.
 */
export type AuthStatus = 'restoring' | 'anonymous' | 'authenticated';

export interface AuthContextValue {
  status: AuthStatus;
  user: AdminUser | null;
  /**
   * Set when a real, valid account signed in without the admin role. The
   * session is already cleared by the time this is set; it exists so /login can
   * explain why, instead of silently returning to an empty form.
   */
  accessDenied: string | null;
  requestOtp: (mobile: string) => Promise<OtpChallenge>;
  /** Verifies the code, then admits only admins. Resolves to the outcome. */
  submitOtp: (requestId: string, code: string) => Promise<'admin' | 'denied'>;
  signOut: () => Promise<void>;
  dismissAccessDenied: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
