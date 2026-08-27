/**
 * The admin account endpoints, one function each.
 *
 * Every one is guarded server-side by `@Roles(Role.ADMIN)` on
 * AdminUserController. Nothing here keeps a non-admin out — a customer calling
 * the same URLs gets 403 from the API.
 */
import { request } from '../../lib/api/client';
import type { Paged, UserDetail, UserRole, UserRow, UserStatus } from './types';

export interface ListParams {
  role?: UserRole | undefined;
  status?: UserStatus | undefined;
  search?: string | undefined;
  page?: number;
  limit?: number;
}

function query(params: ListParams): string {
  const search = new URLSearchParams();
  if (params.role) search.set('role', params.role);
  if (params.status) search.set('status', params.status);
  if (params.search?.trim()) search.set('search', params.search.trim());
  search.set('page', String(params.page ?? 1));
  search.set('limit', String(params.limit ?? 20));
  return search.toString();
}

export function listUsers(params: ListParams, signal?: AbortSignal): Promise<Paged<UserRow>> {
  return request<Paged<UserRow>>(
    `/admin/user/getUsers?${query(params)}`,
    signal ? { signal } : {},
  );
}

/** Real per-status and per-role counts. The chips never show an invented number. */
export function statusCounts(signal?: AbortSignal): Promise<Record<string, number>> {
  return request<Record<string, number>>('/admin/user/getStatusCounts', signal ? { signal } : {});
}

export function getUser(id: string, signal?: AbortSignal): Promise<UserDetail> {
  return request<UserDetail>(`/admin/user/getUserById/${id}`, signal ? { signal } : {});
}

/** Suspending also revokes the account's refresh token, server-side. */
export function setUserStatus(id: string, status: UserStatus): Promise<UserDetail> {
  return request<UserDetail>(`/admin/user/updateStatus/${id}`, {
    method: 'PATCH',
    body: { status },
  });
}
