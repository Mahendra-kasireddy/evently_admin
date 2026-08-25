/**
 * The four backend calls this console makes. Nothing is invented: each function
 * maps 1:1 onto an endpoint that already exists in the Evently API.
 */
import { request } from '../../lib/api/client';
import { getRefreshToken } from '../../lib/api/token';
import type { AdminUser, OtpChallenge, VerifiedSession } from './types';

/** 10 digits, no dial code — `SendOtpDto` matches /^\d{10}$/. */
export const MOBILE_PATTERN = /^\d{10}$/;
/** `VerifyOtpDto` matches /^\d{6}$/. */
export const OTP_LENGTH = 6;

export function sendOtp(mobile: string, signal?: AbortSignal): Promise<OtpChallenge> {
  return request<OtpChallenge>('/auth/sendOtp', {
    method: 'POST',
    body: { mobile },
    anonymous: true,
    ...(signal ? { signal } : {}),
  });
}

export function verifyOtp(
  requestId: string,
  code: string,
  signal?: AbortSignal,
): Promise<VerifiedSession> {
  return request<VerifiedSession>('/auth/verifyOtp', {
    method: 'POST',
    body: { requestId, code },
    anonymous: true,
    ...(signal ? { signal } : {}),
  });
}

/**
 * Authoritative source of the signed-in user's roles. The access token also
 * carries `roles`, but a token minted before a role change is stale, so the
 * gate is decided on this response.
 */
export function fetchProfile(signal?: AbortSignal): Promise<AdminUser> {
  return request<AdminUser>('/user/getUserDetails', signal ? { signal } : {});
}

/** Revokes the refresh token server-side. 204, no body. */
export function logout(): Promise<void> {
  return request<void>('/auth/logoutUser', { method: 'POST' });
}

/**
 * `POST /auth/refreshToken` authenticates with the *refresh* token in the
 * Authorization header, and returns the access token under `accessToken`.
 */
export async function refreshSession(): Promise<{ accessToken: string; refreshToken: string }> {
  const refresh = getRefreshToken();
  if (!refresh) throw new Error('No refresh token');
  return request<{ accessToken: string; refreshToken: string }>('/auth/refreshToken', {
    method: 'POST',
    bearer: refresh,
  });
}
