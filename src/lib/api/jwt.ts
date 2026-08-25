/**
 * Reads the claims the backend puts in the access token.
 *
 * `signTokens` in the backend's AuthService signs
 * `{ sub, roles, email, phone }`, so `roles` is an array of strings.
 *
 * This decode is for UI decisions only — showing the dashboard, choosing a
 * redirect. It is emphatically NOT authorization: the payload is base64, not
 * verified, and anyone can forge one locally. Every privileged action is
 * authorized by the backend against the signed token.
 */
export interface AccessClaims {
  sub: string;
  roles: string[];
  email?: string;
  phone?: string;
  /** Seconds since epoch. */
  exp?: number;
}

export function decodeAccessToken(token: string): AccessClaims | null {
  try {
    const segment = token.split('.')[1];
    if (!segment) return null;
    const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const json = decodeURIComponent(
      atob(padded)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join(''),
    );
    const payload: unknown = JSON.parse(json);
    if (typeof payload !== 'object' || payload === null) return null;
    const p = payload as Record<string, unknown>;
    return {
      sub: typeof p.sub === 'string' ? p.sub : '',
      roles: Array.isArray(p.roles) ? p.roles.filter((r): r is string => typeof r === 'string') : [],
      ...(typeof p.email === 'string' ? { email: p.email } : {}),
      ...(typeof p.phone === 'string' ? { phone: p.phone } : {}),
      ...(typeof p.exp === 'number' ? { exp: p.exp } : {}),
    };
  } catch {
    return null;
  }
}

/** True when the token carries an `exp` that has already passed. */
export function isExpired(claims: AccessClaims | null): boolean {
  if (!claims?.exp) return false;
  return claims.exp * 1000 <= Date.now();
}
