import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { setUnauthorizedHandler } from '../../lib/api/client';
import { isApiError } from '../../lib/api/errors';
import { clearTokens, getAccessToken, setTokens } from '../../lib/api/token';
import { AuthContext, type AuthStatus } from './context';
import * as api from './service';
import { isAdmin, type AdminUser, type OtpChallenge } from './types';

const DENIED_MESSAGE = 'You don’t have permission to access Evently Admin.';

/**
 * Owns the admin session: restore on load, admit only admins, drop the session
 * on sign-out or on any 401 from anywhere in the app.
 *
 * The admin check is deliberately done twice over: here, so a non-admin never
 * sees the console, and again on the backend, where `@Roles(Role.ADMIN)` guards
 * the privileged endpoints. This provider is the *convenience* half — it is not
 * what makes the data safe.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>(() =>
    getAccessToken() ? 'restoring' : 'anonymous',
  );
  const [user, setUser] = useState<AdminUser | null>(null);
  const [accessDenied, setAccessDenied] = useState<string | null>(null);

  // Guards against a 401 handler firing during unmount or a stale restore.
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const drop = useCallback(() => {
    clearTokens();
    if (!alive.current) return;
    setUser(null);
    setStatus('anonymous');
  }, []);

  /**
   * True while the restore sequence is in flight. The blanket 401 handler steps
   * aside for it: an expired access token on page load is exactly the case the
   * refresh token exists for, and clearing the tokens on that first 401 would
   * destroy the refresh token before it could be used.
   */
  const restoring = useRef(false);

  /** Any other 401 means the session is genuinely gone. Don't pretend. */
  useEffect(() => {
    setUnauthorizedHandler(() => {
      if (restoring.current) return;
      clearTokens();
      if (alive.current) {
        setUser(null);
        setStatus('anonymous');
      }
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  /**
   * Fetches the profile and applies the gate. A non-admin is signed out here —
   * both locally and on the backend — so a rejected session leaves nothing
   * behind that a later page load could resurrect.
   */
  const admit = useCallback(async (): Promise<'admin' | 'denied'> => {
    const profile = await api.fetchProfile();
    if (!isAdmin(profile)) {
      await api.logout().catch(() => {
        /* the local session is cleared either way */
      });
      clearTokens();
      if (alive.current) {
        setUser(null);
        setStatus('anonymous');
        setAccessDenied(DENIED_MESSAGE);
      }
      return 'denied';
    }
    if (alive.current) {
      setUser(profile);
      setStatus('authenticated');
      setAccessDenied(null);
    }
    return 'admin';
  }, []);

  /**
   * Runs exactly once per page load, StrictMode's double-invoke included: the
   * refresh token rotates server-side, so two concurrent restores would race
   * and the loser would invalidate the winner's session.
   */
  const restoreDone = useRef(false);

  // Restore on load: a refresh must not cost the admin their session.
  useEffect(() => {
    if (restoreDone.current) return;
    restoreDone.current = true;
    if (!getAccessToken()) return;
    restoring.current = true;

    void (async () => {
      try {
        await admit();
      } catch (error) {
        // An expired access token is recoverable — the refresh token outlives
        // it. Anything else, or a failed refresh, ends the session.
        if (isApiError(error) && error.kind === 'unauthorized') {
          try {
            const pair = await api.refreshSession();
            setTokens(pair.accessToken, pair.refreshToken);
            await admit();
            return;
          } catch {
            /* falls through to drop */
          }
        }
        drop();
      } finally {
        restoring.current = false;
      }
    })();
  }, [admit, drop]);

  const requestOtp = useCallback((mobile: string): Promise<OtpChallenge> => {
    setAccessDenied(null);
    return api.sendOtp(mobile);
  }, []);

  const submitOtp = useCallback(
    async (requestId: string, code: string): Promise<'admin' | 'denied'> => {
      const session = await api.verifyOtp(requestId, code);
      setTokens(session.token, session.refreshToken);
      try {
        return await admit();
      } catch (error) {
        // Verified, but the profile call failed — don't leave half a session.
        clearTokens();
        if (alive.current) {
          setUser(null);
          setStatus('anonymous');
        }
        throw error;
      }
    },
    [admit],
  );

  const signOut = useCallback(async () => {
    await api.logout().catch(() => {
      /* revoking server-side is best-effort; the local session goes regardless */
    });
    drop();
  }, [drop]);

  const dismissAccessDenied = useCallback(() => setAccessDenied(null), []);

  const value = useMemo(
    () => ({
      status,
      user,
      accessDenied,
      requestOtp,
      submitOtp,
      signOut,
      dismissAccessDenied,
    }),
    [status, user, accessDenied, requestOtp, submitOtp, signOut, dismissAccessDenied],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
