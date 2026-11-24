/**
 * The Team page's endpoints. All guarded server-side by `@Roles(Role.ADMIN)`
 * on AdminTeamController — this file keeps nobody out on its own.
 */
import { request } from '../../lib/api/client';
import type { Team, TeamInvite } from './types';

export function getTeam(signal?: AbortSignal): Promise<Team> {
  return request<Team>('/admin/team/getTeam', signal ? { signal } : {});
}

/** Invites a mobile number; its owner then signs up on the console. */
export function inviteAdmin(name: string, mobile: string): Promise<TeamInvite> {
  return request<TeamInvite>('/admin/team/invite', {
    method: 'POST',
    body: { name, mobile },
  });
}

export function revokeInvite(id: string): Promise<void> {
  return request<void>(`/admin/team/revokeInvite/${id}`, { method: 'DELETE' });
}

/** Not allowed for yourself, or for the last admin — the API refuses both. */
export function removeAdmin(id: string): Promise<void> {
  return request<void>(`/admin/team/removeAdmin/${id}`, { method: 'PATCH' });
}
