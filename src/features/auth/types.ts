/**
 * Shapes taken from the backend as it actually is, not as it would ideally be.
 *
 * Sources:
 *  - `POST /auth/sendOtp`   → `IssuedOtp` in modules/auth/otp.service.ts
 *  - `POST /auth/verifyOtp` → the literal returned by AuthService.verifyOtp
 *  - `GET  /user/getUserDetails` → User document via `idJsonTransform`
 *
 * Note the inconsistency preserved here on purpose: `verifyOtp` returns the
 * access token as `token`, while `refreshToken` returns it as `accessToken`.
 * Renaming either would mean changing the backend, which this task does not.
 */

/** `Role` enum, common/enums/role.enum.ts. Only `admin` matters here. */
export const ADMIN_ROLE = 'admin';

/** `GET /user/getUserDetails`. `_id`/`__v` are dropped, secrets are hidden. */
export interface AdminUser {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  phoneVerified: boolean;
  city: string;
  roles: string[];
  status: 'active' | 'suspended';
}

/** `POST /auth/sendOtp` response. */
export interface OtpChallenge {
  requestId: string;
  /** Masked destination, e.g. "••••••3210" — safe to display. */
  sentTo: string;
  /** Non-production only; the stub SMS provider echoes the code. */
  devCode?: string;
}

/** `POST /auth/verifyOtp` response. */
export interface VerifiedSession {
  token: string;
  refreshToken: string;
  isNewUser: boolean;
  user: AdminUser;
}

export function isAdmin(user: AdminUser | null): boolean {
  return !!user && user.roles.includes(ADMIN_ROLE);
}
