/**
 * The admin contact endpoints, one function each.
 *
 * Every one is guarded server-side by `@Roles(Role.ADMIN)` on
 * AdminContactController. Nothing here keeps a non-admin out — a customer or a
 * guest calling the same URLs gets 403 from the API.
 */
import { request } from '../../lib/api/client';
import type {
  ContactDetail,
  ContactRow,
  ContactStatus,
  ContactSubject,
  Paged,
} from './types';

export interface ListParams {
  status?: ContactStatus | undefined;
  subject?: ContactSubject | undefined;
  search?: string | undefined;
  page?: number;
  limit?: number;
}

function query(params: ListParams): string {
  const search = new URLSearchParams();
  if (params.status) search.set('status', params.status);
  if (params.subject) search.set('subject', params.subject);
  if (params.search?.trim()) search.set('search', params.search.trim());
  search.set('page', String(params.page ?? 1));
  search.set('limit', String(params.limit ?? 20));
  return search.toString();
}

export function listContactRequests(
  params: ListParams,
  signal?: AbortSignal,
): Promise<Paged<ContactRow>> {
  return request<Paged<ContactRow>>(
    `/admin/contact-us/getContactRequests?${query(params)}`,
    signal ? { signal } : {},
  );
}

/** Real per-status counts. The chips never show a number the API didn't give. */
export function statusCounts(signal?: AbortSignal): Promise<Record<string, number>> {
  return request<Record<string, number>>(
    '/admin/contact-us/getStatusCounts',
    signal ? { signal } : {},
  );
}

export function getContactRequest(id: string, signal?: AbortSignal): Promise<ContactDetail> {
  return request<ContactDetail>(
    `/admin/contact-us/getContactRequestById/${id}`,
    signal ? { signal } : {},
  );
}

export function updateContactStatus(id: string, status: ContactStatus): Promise<ContactDetail> {
  return request<ContactDetail>(`/admin/contact-us/updateStatus/${id}`, {
    method: 'PATCH',
    body: { status },
  });
}

/** Saves the reply, stamps who sent it, and moves the request to RESPONDED. */
export function respondToContactRequest(id: string, response: string): Promise<ContactDetail> {
  return request<ContactDetail>(`/admin/contact-us/respond/${id}`, {
    method: 'POST',
    body: { response },
  });
}
