/**
 * Admin sub-vendor endpoints. Every one is guarded server-side by
 * `@Roles(Role.ADMIN)` on AdminSubvendorController.
 */
import { request } from '../../lib/api/client';
import type { Paged } from '../shared/useAdminList';
import type { VendorDetail, VendorRow } from './types';

export function listVendors(
  args: { search: string; page: number; limit: number; filters: Record<string, string> },
  signal: AbortSignal,
): Promise<Paged<VendorRow>> {
  const q = new URLSearchParams();
  if (args.search.trim()) q.set('search', args.search.trim());
  if (args.filters.category) q.set('category', args.filters.category);
  if (args.filters.active) q.set('active', args.filters.active);
  q.set('page', String(args.page));
  q.set('limit', String(args.limit));
  return request<Paged<VendorRow>>(`/admin/subvendor/getSubVendors?${q}`, { signal });
}

export function vendorCounts(signal: AbortSignal): Promise<Record<string, number>> {
  return request<Record<string, number>>('/admin/subvendor/getStatusCounts', { signal });
}

export function getVendor(id: string, signal?: AbortSignal): Promise<VendorDetail> {
  return request<VendorDetail>(`/admin/subvendor/getSubVendorById/${id}`, signal ? { signal } : {});
}

/** Take a vendor off the roster, or put them back on it. */
export function setVendorActive(id: string, active: boolean): Promise<VendorDetail> {
  return request<VendorDetail>(`/admin/subvendor/updateActive/${id}`, {
    method: 'PATCH',
    body: { active },
  });
}
