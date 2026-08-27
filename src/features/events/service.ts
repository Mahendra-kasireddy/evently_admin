/**
 * Admin event-pipeline endpoints. Read-only, and guarded server-side by
 * `@Roles(Role.ADMIN)` on AdminEventController.
 */
import { request } from '../../lib/api/client';
import type { Paged } from '../shared/useAdminList';
import type { EventDetail, EventRow } from './types';

export function listEvents(
  args: { search: string; page: number; limit: number; filters: Record<string, string> },
  signal: AbortSignal,
): Promise<Paged<EventRow>> {
  const q = new URLSearchParams();
  if (args.search.trim()) q.set('search', args.search.trim());
  if (args.filters.status) q.set('status', args.filters.status);
  q.set('page', String(args.page));
  q.set('limit', String(args.limit));
  return request<Paged<EventRow>>(`/admin/event/getEvents?${q}`, { signal });
}

export function eventCounts(signal: AbortSignal): Promise<Record<string, number>> {
  return request<Record<string, number>>('/admin/event/getStatusCounts', { signal });
}

export function getEvent(id: string, signal?: AbortSignal): Promise<EventDetail> {
  return request<EventDetail>(`/admin/event/getEventById/${id}`, signal ? { signal } : {});
}
