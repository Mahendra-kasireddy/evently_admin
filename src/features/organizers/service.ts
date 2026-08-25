/**
 * The admin organizer endpoints, one function each.
 *
 * Every one of these is guarded server-side by `@Roles(Role.ADMIN)` on
 * AdminOrganizerController. Nothing here is trusted to keep a non-admin out —
 * a customer calling the same URLs gets 403 from the API.
 */
import { request } from '../../lib/api/client';
import type { OrganizerDetail, OrganizerRow, OrganizerStatus, Paged } from './types';

export interface ListParams {
  status?: OrganizerStatus | undefined;
  search?: string | undefined;
  page?: number;
  limit?: number;
}

function query(params: ListParams): string {
  const search = new URLSearchParams();
  if (params.status) search.set('status', params.status);
  if (params.search?.trim()) search.set('search', params.search.trim());
  search.set('page', String(params.page ?? 1));
  search.set('limit', String(params.limit ?? 20));
  return search.toString();
}

export function listOrganizers(
  params: ListParams,
  signal?: AbortSignal,
): Promise<Paged<OrganizerRow>> {
  return request<Paged<OrganizerRow>>(
    `/admin/organizer/getOrganizers?${query(params)}`,
    signal ? { signal } : {},
  );
}

/** Real per-status counts. The chips never show a number the API didn't give. */
export function statusCounts(signal?: AbortSignal): Promise<Record<string, number>> {
  return request<Record<string, number>>(
    '/admin/organizer/getStatusCounts',
    signal ? { signal } : {},
  );
}

export function getOrganizer(id: string, signal?: AbortSignal): Promise<OrganizerDetail> {
  return request<OrganizerDetail>(
    `/admin/organizer/getOrganizerById/${id}`,
    signal ? { signal } : {},
  );
}

/**
 * One approve call. What it means depends on where the organizer is:
 * pending_review admits them to onboarding, submitted makes them live. The
 * backend decides and refuses any other state.
 */
export function approveOrganizer(id: string): Promise<OrganizerDetail> {
  return request<OrganizerDetail>(`/admin/organizer/approveOrganizer/${id}`, { method: 'POST' });
}

export function rejectOrganizer(id: string, reason: string): Promise<OrganizerDetail> {
  return request<OrganizerDetail>(`/admin/organizer/rejectOrganizer/${id}`, {
    method: 'POST',
    body: { reason },
  });
}

export function requestChanges(id: string, reason: string): Promise<OrganizerDetail> {
  return request<OrganizerDetail>(`/admin/organizer/requestChanges/${id}`, {
    method: 'POST',
    body: { reason },
  });
}

/** Sends only the fields the admin actually changed. */
export function updateOnboarding(
  id: string,
  patch: Record<string, string | number>,
): Promise<OrganizerDetail> {
  return request<OrganizerDetail>(`/admin/organizer/updateOnboarding/${id}`, {
    method: 'PATCH',
    body: patch,
  });
}
