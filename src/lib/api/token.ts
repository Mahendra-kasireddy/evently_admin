/**
 * Where the admin session lives.
 *
 * `sessionStorage`, not `localStorage`: the tokens are cleared when the tab
 * closes, which is the right default for a console that can act on every user
 * on the platform, and they still survive a refresh — which is all the session
 * needs to do.
 *
 * A distinct key namespace from the customer web app (`evently.auth.token`), so
 * an admin session can never be picked up by another Evently app served from
 * the same origin, or vice versa.
 *
 * Worth being straight about the limit: the backend issues bearer tokens, so
 * the browser has to hold them somewhere JavaScript can read. That is XSS-
 * exposed by construction. The fix is server-side — httpOnly, SameSite cookies
 * — and it is not something this client can do on its own.
 */
const ACCESS_KEY = 'evently.admin.accessToken';
const REFRESH_KEY = 'evently.admin.refreshToken';

/** Mirrors storage so a blocked/absent Storage API degrades to in-memory. */
let memory: { access: string | null; refresh: string | null } = { access: null, refresh: null };

function read(key: string): string | null {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null): void {
  try {
    if (value === null) window.sessionStorage.removeItem(key);
    else window.sessionStorage.setItem(key, value);
  } catch {
    /* private mode / storage disabled — the in-memory copy carries the session */
  }
}

export function getAccessToken(): string | null {
  return memory.access ?? read(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  return memory.refresh ?? read(REFRESH_KEY);
}

export function setTokens(access: string | null, refresh: string | null): void {
  memory = { access, refresh };
  write(ACCESS_KEY, access);
  write(REFRESH_KEY, refresh);
}

export function clearTokens(): void {
  setTokens(null, null);
}
