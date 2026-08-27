import { request } from '../../lib/api/client';
import type { DashboardSummary } from './types';

/** Guarded server-side by `@Roles(Role.ADMIN)` on AdminDashboardController. */
export function getDashboardSummary(signal?: AbortSignal): Promise<DashboardSummary> {
  return request<DashboardSummary>('/admin/dashboard/getSummary', signal ? { signal } : {});
}
