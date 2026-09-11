/**
 * Admin coupon endpoints, all guarded server-side by `@Roles(Role.ADMIN)` on
 * AdminCouponController.
 *
 * `createCoupon` has no scope field on either side: everything an admin creates
 * is a platform coupon. An organizer's coupon is created by the organizer, in
 * their own console, and admins reach it here only to look at it or switch it
 * off.
 */
import { request } from '../../lib/api/client';
import type { Paged } from '../shared/useAdminList';
import type { Coupon, CouponStatus, CouponTerms, Redemption } from './types';

export function listCoupons(
  args: { search: string; page: number; limit: number; filters: Record<string, string> },
  signal: AbortSignal,
): Promise<Paged<Coupon>> {
  const q = new URLSearchParams();
  if (args.search.trim()) q.set('search', args.search.trim());
  if (args.filters.scope) q.set('scope', args.filters.scope);
  if (args.filters.status) q.set('status', args.filters.status);
  q.set('page', String(args.page));
  q.set('limit', String(args.limit));
  return request<Paged<Coupon>>(`/admin/coupon/getCoupons?${q}`, { signal });
}

export function couponCounts(signal: AbortSignal): Promise<Record<string, number>> {
  return request<Record<string, number>>('/admin/coupon/getStatusCounts', { signal });
}

export function getCoupon(id: string, signal?: AbortSignal): Promise<Coupon> {
  return request<Coupon>(`/admin/coupon/getCouponById/${id}`, signal ? { signal } : {});
}

export function getCouponUsage(id: string, signal?: AbortSignal): Promise<Redemption[]> {
  return request<Redemption[]>(`/admin/coupon/getUsage/${id}`, signal ? { signal } : {});
}

export function createCoupon(terms: CouponTerms): Promise<Coupon> {
  return request<Coupon>('/admin/coupon/createCoupon', { method: 'POST', body: terms });
}

/** The code is not editable — redemptions already reference it by name. */
export function updateCoupon(id: string, terms: Omit<CouponTerms, 'code'>): Promise<Coupon> {
  return request<Coupon>(`/admin/coupon/updateCoupon/${id}`, { method: 'PATCH', body: terms });
}

export function setCouponStatus(id: string, status: CouponStatus): Promise<Coupon> {
  return request<Coupon>(`/admin/coupon/updateStatus/${id}`, {
    method: 'PATCH',
    body: { status },
  });
}
